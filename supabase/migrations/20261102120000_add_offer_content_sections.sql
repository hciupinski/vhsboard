-- Additive content v2; existing descriptions are never rewritten.
alter function public.is_valid_trip_content(jsonb) rename to is_valid_trip_content_legacy;
alter function public.is_valid_day_camp_content(jsonb) rename to is_valid_day_camp_content_legacy;

create or replace function public.is_valid_accommodation_content(p_accommodation jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(p_accommodation) = 'object'
    and public.has_only_json_keys(p_accommodation, array['description'])
    and jsonb_typeof(p_accommodation -> 'description') = 'string'
    and char_length(trim(p_accommodation ->> 'description')) between 3 and 1000;
$$;

create function public.vhs_section_text(v jsonb, k text, maximum integer, required boolean default false)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(v -> k) = 'string'
    and char_length(trim(v ->> k)) <= maximum
    and (not required or char_length(trim(v ->> k)) >= 3), false);
$$;
create function public.vhs_section_url(v jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(v) = 'string' and length(v #>> '{}') <= 2048
    and ((v #>> '{}') = '' or (v #>> '{}') ~ '^https://[^[:space:]/?#]+[^[:space:]]*$'), false);
$$;
create function public.vhs_extra_price(v jsonb, complete boolean)
returns boolean language plpgsql immutable set search_path = '' as $$
declare amount numeric;
begin
  if not coalesce(public.has_only_json_keys(v, array['kind','amount','from','unit'])
    and (v ->> 'kind') in ('included','extra') and jsonb_typeof(v -> 'amount') = 'number'
    and jsonb_typeof(v -> 'from') = 'boolean'
    and public.vhs_section_text(v,'unit',120,complete and v ->> 'kind' = 'extra'),false) then return false; end if;
  amount := (v ->> 'amount')::numeric;
  return amount between 0 and 500000 and amount = round(amount,2)
    and (not complete or v ->> 'kind' <> 'included' or amount = 0);
exception when others then return false;
end;
$$;
create function public.vhs_content_base(v jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := v - array['schemaVersion','resort','training','transport','insurance'];
begin
  if v ? 'accommodation' then
    if v #>> '{accommodation,enabled}' = 'false' then result := result - 'accommodation';
    else result := jsonb_set(result,'{accommodation}',(v -> 'accommodation') - 'enabled'); end if;
  end if;
  if jsonb_typeof(v -> 'terms') = 'array' then
    result := jsonb_set(result,'{terms}',coalesce((select jsonb_agg(item - 'id' order by n)
      from jsonb_array_elements(v -> 'terms') with ordinality a(item,n)), '[]'::jsonb));
  end if;
  return result;
end;
$$;
create function public.is_valid_offer_sections(v jsonb, kind public.offer_kind, publication boolean default true)
returns boolean language plpgsql stable set search_path = '' as $$
declare k text; s jsonb; c jsonb; r jsonb; j jsonb; cards jsonb; complete boolean; counter integer; field text; seen text[];
begin
  if jsonb_typeof(v) <> 'object' then return false; end if;
  if v ? 'schemaVersion' then
    if v -> 'schemaVersion' <> '2'::jsonb then return false; end if;
  elsif v ?| array['resort','training','transport','insurance'] or (v -> 'accommodation') ? 'enabled' then
    return false;
  end if;
  if kind = 'day_camp' and v ? 'schemaVersion' then
    seen := array[]::text[];
    for c in select value from jsonb_array_elements(v -> 'terms') loop
      if not coalesce((c ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$',false) or (c ->> 'id') = any(seen) then return false; end if;
      seen := array_append(seen,c ->> 'id');
    end loop;
  end if;
  foreach k in array array['accommodation','resort','training','transport','insurance'] loop
    if not (v ? k) then continue; end if;
    s := v -> k;
    if jsonb_typeof(s) <> 'object' then return false; end if;
    if k = 'accommodation' and not (s ? 'enabled') then complete := publication;
    else
      if jsonb_typeof(s -> 'enabled') <> 'boolean' or not (s ? 'enabled') then return false; end if;
      complete := publication and (s ->> 'enabled')::boolean;
    end if;
    if not public.vhs_section_text(s,'description',case when k = 'accommodation' then 1000 else 3000 end,complete) then return false; end if;
    if k = 'accommodation' then
      if not public.has_only_json_keys(s,array['enabled','description']) then return false; end if;
    elsif k = 'resort' then
      if not coalesce(public.has_only_json_keys(s,array['enabled','name','description','mapUrl'])
        and public.vhs_section_text(s,'name',120,complete) and public.vhs_section_url(s -> 'mapUrl'),false) then return false; end if;
    elsif k in ('training','insurance') then
      if k = 'training' then
        if not public.has_only_json_keys(s,array['enabled','description','items']) then return false; end if;
        cards := s -> 'items'; counter := 12;
      else
        if not coalesce(public.has_only_json_keys(s,array['enabled','description','provider','informationUrl','packages','extensions'])
          and public.vhs_section_text(s,'provider',120) and public.vhs_section_url(s -> 'informationUrl'),false) then return false; end if;
        cards := s -> 'packages'; counter := 6;
      end if;
      if jsonb_typeof(cards) <> 'array' or cards is null or jsonb_array_length(cards) > counter or (complete and jsonb_array_length(cards) < 1) then return false; end if;
      seen := array[]::text[];
      for c in select value from jsonb_array_elements(cards) loop
        if not coalesce((c ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
          and public.vhs_section_text(c,'title',120,complete) and public.vhs_section_text(c,'description',1500,complete)
          and public.vhs_extra_price(c -> 'price',complete),false) or c ->> 'id' = any(seen) then return false; end if;
        seen := array_append(seen,c ->> 'id');
        if k = 'training' then
          if not coalesce(public.has_only_json_keys(c,array['id','title','description','price','level','scope'])
            and public.vhs_section_text(c,'level',120) and public.vhs_section_text(c,'scope',500),false) then return false; end if;
        else
          if not public.has_only_json_keys(c,array['id','title','description','price','risks']) or jsonb_typeof(c -> 'risks') <> 'array' or not (c ? 'risks') then return false; end if;
          if jsonb_array_length(c -> 'risks') > 12 or (complete and jsonb_array_length(c -> 'risks') < 1) then return false; end if;
          if (select count(*) <> count(distinct value ->> 'id') from jsonb_array_elements(c -> 'risks')) then return false; end if;
          for r in select value from jsonb_array_elements(c -> 'risks') loop
            if not coalesce(public.has_only_json_keys(r,array['id','label','value'])
              and (r ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
              and public.vhs_section_text(r,'label',120,complete) and public.vhs_section_text(r,'value',240)
              and (not complete or length(trim(r ->> 'value')) > 0),false) then return false; end if;
          end loop;
        end if;
      end loop;
      if k = 'insurance' then
        if jsonb_typeof(s -> 'extensions') <> 'array' or not (s ? 'extensions') or jsonb_array_length(s -> 'extensions') > 12 then return false; end if;
        if (select count(*) <> count(distinct value ->> 'id') from jsonb_array_elements(s -> 'extensions')) then return false; end if;
        for c in select value from jsonb_array_elements(s -> 'extensions') loop
          if not coalesce(public.has_only_json_keys(c,array['id','title','description','price'])
            and (c ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
            and public.vhs_section_text(c,'title',120,complete) and public.vhs_section_text(c,'description',1500)
            and public.vhs_extra_price(c -> 'price',complete),false) then return false; end if;
        end loop;
      end if;
    elsif k = 'transport' then
      if not coalesce(public.has_only_json_keys(s,array['enabled','description','type','customType','journeys'])
        and s ->> 'type' in ('coach','plane','train','own','other')
        and (not (s ? 'customType') or public.vhs_section_text(s,'customType',120,complete and s ->> 'type' = 'other'))
        and (not complete or s ->> 'type' <> 'other' or public.vhs_section_text(s,'customType',120,true))
        and jsonb_typeof(s -> 'journeys') = 'array',false) then return false; end if;
      cards := s -> 'journeys';
      if jsonb_array_length(cards) > 2 then return false; end if;
      if complete and s ->> 'type' <> 'own' then
        if jsonb_array_length(cards) <> (case when kind = 'trip' then 1 else jsonb_array_length(v -> 'terms') end) then return false; end if;
        if kind = 'day_camp' and exists (select 1 from jsonb_array_elements(v -> 'terms') t
          where (select count(*) from jsonb_array_elements(cards) x where x ->> 'termId' = t ->> 'id') <> 1) then return false; end if;
      end if;
      for j in select value from jsonb_array_elements(cards) loop
        if not public.has_only_json_keys(j,array['termId','departureDate','departureTime','departurePlace','returnDate','returnTime','returnPlace','note']) then return false; end if;
        if j ? 'termId' and not coalesce(j ->> 'termId' ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$',false) then return false; end if;
        foreach field in array array['departureDate','returnDate'] loop
          if not public.vhs_section_text(j,field,10) then return false; end if;
          if complete and s ->> 'type' <> 'own' and not public.is_valid_json_iso_date(j -> field) then return false; end if;
        end loop;
        foreach field in array array['departureTime','returnTime'] loop
          if not public.vhs_section_text(j,field,5) then return false; end if;
          if complete and s ->> 'type' <> 'own' and j ->> field <> '' and not (j ->> field ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then return false; end if;
        end loop;
        if not public.vhs_section_text(j,'departurePlace',120,complete and s ->> 'type' <> 'own') or not public.vhs_section_text(j,'returnPlace',120,complete and s ->> 'type' <> 'own') or not public.vhs_section_text(j,'note',500) then return false; end if;
        if complete and s ->> 'type' <> 'own' and (j ->> 'returnDate' < j ->> 'departureDate' or (j ->> 'returnDate' = j ->> 'departureDate' and j ->> 'departureTime' <> '' and j ->> 'returnTime' <> '' and j ->> 'returnTime' < j ->> 'departureTime')) then return false; end if;
      end loop;
    end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
create function public.is_valid_trip_content(p_content jsonb)
returns boolean language sql stable set search_path = '' as $$
  select public.is_valid_trip_content_legacy(public.vhs_content_base(p_content))
    and public.is_valid_offer_sections(p_content,'trip',true);
$$;
create function public.is_valid_day_camp_content(p_content jsonb)
returns boolean language sql stable set search_path = '' as $$
  select public.is_valid_day_camp_content_legacy(public.vhs_content_base(p_content))
    and public.is_valid_offer_sections(p_content,'day_camp',true);
$$;
create or replace function public.is_valid_published_offer_content(p_offer_kind public.offer_kind,p_content jsonb)
returns boolean language sql stable set search_path = '' as $$
  select case when p_offer_kind = 'trip' then public.is_valid_trip_content(p_content)
    when p_offer_kind = 'day_camp' then public.is_valid_day_camp_content(p_content) else false end;
$$;
create function public.guard_offer_content_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.description -> 'schemaVersion' = '2'::jsonb and new.description -> 'schemaVersion' is distinct from '2'::jsonb then
    raise check_violation using message = 'Odśwież CMS przed zapisaniem oferty.', constraint = 'offer_content_version_downgrade';
  end if;
  if new.description -> 'schemaVersion' = '2'::jsonb and not public.is_valid_offer_sections(new.description,new.offer_kind,false) then
    raise check_violation using message = 'Nieprawidłowa struktura sekcji oferty.', constraint = 'offer_content_sections_invalid';
  end if;
  return new;
end;
$$;
create trigger offer_content_version_guard before insert or update on public.offers
for each row execute function public.guard_offer_content_version();

-- Existing publication guard tests for key presence, so strip disabled accommodation
-- only for its image-readiness check while retaining all data in the stored description.
create or replace function public.enforce_offer_publication_readiness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from 'published'
       or new.hero_image is distinct from old.hero_image
       or new.description is distinct from old.description
     )
     and not exists (
       select 1
       from public.offer_images
       where public.offer_images.offer_id = new.id
         and public.offer_images.category = 'gallery'
         and public.offer_images.storage_path = new.hero_image
         and char_length(trim(public.offer_images.alt_text)) between 5 and 180
     ) then
    raise check_violation
      using message = 'Opublikowana oferta wymaga obrazu głównego z poprawnym opisem alternatywnym.',
            constraint = 'offers_published_hero_ready';
  end if;

  if new.status = 'published'
     and not public.is_valid_published_offer_content(new.offer_kind, new.description) then
    raise check_violation
      using message = 'Opublikowana oferta wymaga kompletnej treści właściwej dla rodzaju.',
            constraint = 'offers_published_content_ready';
  end if;

  if new.status = 'published'
     and new.booking_url !~ '^https://[^[:space:]]+$' then
    raise check_violation
      using message = 'Opublikowana oferta wymaga poprawnego HTTPS URL-a zapisów.',
            constraint = 'offers_published_booking_url_ready';
  end if;

  if new.status = 'published'
     and new.description ? 'accommodation'
     and coalesce(new.description #>> '{accommodation,enabled}', 'true') <> 'false'
     and not exists (
       select 1
       from public.offer_images
       where public.offer_images.offer_id = new.id
         and public.offer_images.category = 'accommodation'
     ) then
    raise check_violation
      using message = 'Opublikowana oferta z zakwaterowaniem wymaga co najmniej jednego zdjęcia.',
            constraint = 'offers_published_accommodation_ready';
  end if;

  return new;
end;
$$;


do $revoke$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and (p.proname like 'vhs_%' or p.proname in ('is_valid_offer_sections','is_valid_trip_content','is_valid_day_camp_content','guard_offer_content_version'))
  loop execute format('revoke all on function %s from public, anon, authenticated', f.signature); end loop;
end;
$revoke$;

alter table public.offer_images drop constraint if exists offer_images_category_check;
alter table public.offer_images add constraint offer_images_category_check check (category in ('gallery','accommodation','resort_map'));
create unique index offer_single_resort_map on public.offer_images(offer_id) where category = 'resort_map';

create function public.replace_offer_resort_map(p_offer_id uuid,p_storage_path text,p_alt_text text)
returns table(image jsonb, previous_path text)
language plpgsql security invoker set search_path = '' as $$
declare old_path text; saved public.offer_images;
begin
  if not public.is_cms_admin() then raise insufficient_privilege using message = 'Brak uprawnień do mapy resortu.'; end if;
  perform 1 from public.offers where id = p_offer_id for update;
  if not found then raise invalid_parameter_value using message = 'Oferta nie istnieje.'; end if;
  if p_storage_path is null or p_alt_text is null or p_storage_path !~ ('^offers/' || p_offer_id::text || '/[0-9a-fA-F-]{36}\.(jpeg|png|webp)$')
    or char_length(trim(p_alt_text)) not between 5 and 180
    or not exists(select 1 from storage.objects where bucket_id='offer-images' and name=p_storage_path) then
    raise invalid_parameter_value using message = 'Nieprawidłowy obraz mapy.';
  end if;
  select storage_path into old_path from public.offer_images where offer_id=p_offer_id and category='resort_map';
  insert into public.offer_images(offer_id,storage_path,alt_text,category,position)
    values(p_offer_id,p_storage_path,trim(p_alt_text),'resort_map',0)
    on conflict(offer_id) where category='resort_map'
    do update set storage_path=excluded.storage_path,alt_text=excluded.alt_text
    returning * into saved;
  return query select to_jsonb(saved), old_path;
end;
$$;
revoke all on function public.replace_offer_resort_map(uuid,text,text) from public,anon;
grant execute on function public.replace_offer_resort_map(uuid,text,text) to authenticated;
create or replace function public.reorder_offer_images(
  p_offer_id uuid,
  p_ordered_image_ids uuid[],
  p_category text default 'gallery'
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_count integer;
  supplied_count integer;
  max_position integer;
  image_id uuid;
  target_position integer;
begin
  if p_category not in ('gallery', 'accommodation', 'resort_map') then
    raise invalid_parameter_value using message = 'Nieprawidłowa kategoria obrazów.';
  end if;
  if not public.is_cms_admin() then
    raise insufficient_privilege using message = 'Brak uprawnień do zmiany kolejności obrazów.';
  end if;

  perform 1 from public.offers where public.offers.id = p_offer_id for update;
  if not found then
    raise invalid_parameter_value using message = 'Oferta nie istnieje.';
  end if;

  perform 1 from public.offer_images
  where public.offer_images.offer_id = p_offer_id
    and public.offer_images.category = p_category
  for update;

  select count(*), coalesce(max(public.offer_images.position), -1)
    into current_count, max_position
  from public.offer_images
  where public.offer_images.offer_id = p_offer_id
    and public.offer_images.category = p_category;

  if p_ordered_image_ids is null or cardinality(p_ordered_image_ids) <> current_count then
    raise invalid_parameter_value using message = 'Kolejność musi zawierać wszystkie obrazy oferty.';
  end if;

  select count(distinct ordered_id) into supplied_count
  from unnest(p_ordered_image_ids) as ordered_id;
  if supplied_count <> current_count or exists (
    select 1 from unnest(p_ordered_image_ids) as ordered_id
    where not exists (
      select 1 from public.offer_images
      where public.offer_images.offer_id = p_offer_id
        and public.offer_images.category = p_category
        and public.offer_images.id = ordered_id
    )
  ) then
    raise invalid_parameter_value using message = 'Kolejność musi zawierać wszystkie obrazy oferty.';
  end if;

  for image_id, target_position in
    select ordered_id, (ordinality - 1)::integer
    from unnest(p_ordered_image_ids) with ordinality as ordered(ordered_id, ordinality)
  loop
    update public.offer_images
    set position = max_position + current_count + target_position + 1
    where public.offer_images.id = image_id and public.offer_images.offer_id = p_offer_id;
  end loop;

  for image_id, target_position in
    select ordered_id, (ordinality - 1)::integer
    from unnest(p_ordered_image_ids) with ordinality as ordered(ordered_id, ordinality)
  loop
    update public.offer_images
    set position = target_position
    where public.offer_images.id = image_id
      and public.offer_images.offer_id = p_offer_id
      and public.offer_images.category = p_category;
  end loop;
end;
$$;

