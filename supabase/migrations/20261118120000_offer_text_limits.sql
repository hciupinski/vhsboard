-- Expand editorial text limits without rewriting existing offers.
alter table public.offers drop constraint offers_title_check, drop constraint offers_subtitle_check, drop constraint offers_short_description_check, drop constraint offers_location_check;
alter table public.offers add constraint offers_title_check check (char_length(public.vhs_js_trim(title)) >= 1 and char_length(title) <= 120) not valid, add constraint offers_subtitle_check check (char_length(public.vhs_js_trim(subtitle)) >= 1 and char_length(subtitle) <= 280) not valid, add constraint offers_short_description_check check (char_length(public.vhs_js_trim(short_description)) >= 1 and char_length(short_description) <= 500) not valid, add constraint offers_location_check check (char_length(public.vhs_js_trim(location)) >= 1 and char_length(location) <= 120) not valid;
alter table public.offer_images drop constraint offer_images_alt_text_check;
alter table public.offer_images add constraint offer_images_alt_text_check check (char_length(public.vhs_js_trim(alt_text)) between 1 and 180) not valid;

create or replace function public.vhs_utf16_length(v text)
returns integer language sql immutable strict set search_path = '' as $$
  select coalesce(sum(case when octet_length(convert_to(ch, 'UTF8')) = 4 then 2 else 1 end), 0)::integer
  from regexp_split_to_table(v, '') as ch;
$$;


create or replace function public.is_nonempty_json_text(p_value jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(p_value) = 'string' and char_length(public.vhs_js_trim(p_value #>> '{}')) > 0;
$$;

create or replace function public.is_valid_accommodation_content(p_accommodation jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(p_accommodation) = 'object' and public.has_only_json_keys(p_accommodation, array['description'])
    and jsonb_typeof(p_accommodation -> 'description') = 'string'
    and public.vhs_utf16_length(public.vhs_js_trim(p_accommodation ->> 'description')) between 1 and 5000;
$$;
create or replace function public.vhs_section_text(v jsonb, k text, maximum integer, required boolean default false)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(v -> k) = 'string' and (case when maximum = 5000 then public.vhs_utf16_length(public.vhs_js_trim(v ->> k)) else char_length(public.vhs_js_trim(v ->> k)) end) <= maximum
    and (not required or char_length(public.vhs_js_trim(v ->> k)) >= 1), false);
$$;

-- Camp long text has no legacy database maximum. Check changed data on writes,
-- leaving public read validators and existing paragraphs compatible.
create or replace function public.vhs_camp_long_text_valid(v jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare k text; item jsonb;
begin
  if jsonb_typeof(v -> 'venueDescription') = 'string' and public.vhs_utf16_length(public.vhs_js_trim(v ->> 'venueDescription')) > 5000 then return false; end if;
  foreach k in array array['supervision','safety','transport','meals'] loop
    if jsonb_typeof(v -> 'parentInfo' -> k) = 'string' and public.vhs_utf16_length(public.vhs_js_trim(v -> 'parentInfo' ->> k)) > 5000 then return false; end if;
  end loop;
  if jsonb_typeof(v -> 'dayProgram') = 'array' then
    for item in select value from jsonb_array_elements(v -> 'dayProgram') loop
      if jsonb_typeof(item -> 'text') = 'string' and public.vhs_utf16_length(public.vhs_js_trim(item ->> 'text')) > 5000 then return false; end if;
    end loop;
  end if;
  return true;
end;
$$;
revoke all on function public.vhs_camp_long_text_valid(jsonb) from public, anon, authenticated;

create or replace function public.is_valid_offer_sections(v jsonb, kind public.offer_kind, publication boolean default true)
returns boolean language plpgsql stable set search_path = '' as $$
declare k text; s jsonb; c jsonb; r jsonb; j jsonb; cards jsonb; complete boolean; counter integer; field text; seen text[]; modes jsonb; organized boolean;
begin
  if jsonb_typeof(v) <> 'object' then return false; end if;
  if v ? 'schemaVersion' then
    if v -> 'schemaVersion' <> '2'::jsonb then return false; end if;
  elsif v ?| array['resort','training','transport','insurance','priceNote','showRentalLink'] or (v -> 'accommodation') ? 'enabled' then
    return false;
  end if;
  if v ? 'showRentalLink' and jsonb_typeof(v -> 'showRentalLink') <> 'boolean' then return false; end if;
  if v ? 'priceNote' and not public.vhs_section_text(v,'priceNote',5000) then return false; end if;
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
    if not public.vhs_section_text(s,'description',5000,complete) then return false; end if;
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
      if jsonb_typeof(cards) <> 'array' or cards is null or jsonb_array_length(cards) > counter or (complete and k = 'insurance' and jsonb_array_length(cards) < 1) then return false; end if;
      seen := array[]::text[];
      for c in select value from jsonb_array_elements(cards) loop
        if not coalesce((c ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
          and public.vhs_section_text(c,'title',120,complete) and public.vhs_section_text(c,'description',5000,complete)
          and public.vhs_extra_price(c -> 'price',complete),false) or c ->> 'id' = any(seen) then return false; end if;
        seen := array_append(seen,c ->> 'id');
        if k = 'training' then
          if not coalesce(public.has_only_json_keys(c,array['id','title','description','price','level','scope'])
            and public.vhs_section_text(c,'level',120) and public.vhs_section_text(c,'scope',5000),false) then return false; end if;
        else
          if not public.has_only_json_keys(c,array['id','title','description','price','risks']) or jsonb_typeof(c -> 'risks') <> 'array' or not (c ? 'risks') then return false; end if;
          if jsonb_array_length(c -> 'risks') > 12 then return false; end if;
          if (select count(*) <> count(distinct value ->> 'id') from jsonb_array_elements(c -> 'risks')) then return false; end if;
          for r in select value from jsonb_array_elements(c -> 'risks') loop
            if not coalesce(public.has_only_json_keys(r,array['id','label','value'])
              and (r ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
              and public.vhs_section_text(r,'label',120) and public.vhs_section_text(r,'value',240)
              and (not complete or (length(public.vhs_js_trim(r ->> 'label')) = 0 and length(public.vhs_js_trim(r ->> 'value')) = 0)
                or (length(public.vhs_js_trim(r ->> 'label')) > 0 and length(public.vhs_js_trim(r ->> 'value')) > 0)),false) then return false; end if;
          end loop;
        end if;
      end loop;
      if k = 'insurance' then
        if jsonb_typeof(s -> 'extensions') <> 'array' or not (s ? 'extensions') or jsonb_array_length(s -> 'extensions') > 12 then return false; end if;
        if (select count(*) <> count(distinct value ->> 'id') from jsonb_array_elements(s -> 'extensions')) then return false; end if;
        for c in select value from jsonb_array_elements(s -> 'extensions') loop
          if not coalesce(public.has_only_json_keys(c,array['id','title','description','price'])
            and (c ->> 'id') ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
            and public.vhs_section_text(c,'title',120,complete) and public.vhs_section_text(c,'description',5000)
            and public.vhs_extra_price(c -> 'price',complete),false) then return false; end if;
        end loop;
      end if;
    elsif k = 'transport' then
      if not coalesce(public.has_only_json_keys(s,array['enabled','description','type','types','customType','journeys'])
        and jsonb_typeof(s -> 'journeys') = 'array',false) then return false; end if;
      if (s ? 'type') = (s ? 'types') then return false; end if;

      if s ? 'types' then
        modes := s -> 'types';
        if jsonb_typeof(modes) <> 'array' then return false; end if;
        if (complete and jsonb_array_length(modes) = 0)
          or exists (
            select 1 from jsonb_array_elements(modes) as mode(value)
            where jsonb_typeof(value) <> 'string'
              or value #>> '{}' not in ('coach','plane','train','own','other','vhs_bus')
          )
          or (select count(*) <> count(distinct value) from jsonb_array_elements(modes) as mode(value))
        then return false; end if;
      else
        if not coalesce(s ->> 'type' in ('coach','plane','train','own','other'),false) then return false; end if;
        modes := jsonb_build_array(s -> 'type');
      end if;

      if (s ? 'customType' or (complete and modes ? 'other'))
        and not public.vhs_section_text(s,'customType',120,complete and modes ? 'other')
      then return false; end if;

      organized := (modes - 'own') <> '[]'::jsonb;
      cards := s -> 'journeys';
      if jsonb_array_length(cards) > 2 then return false; end if;
      if complete and organized then
        if jsonb_array_length(cards) <> (case when kind = 'trip' then 1 else jsonb_array_length(v -> 'terms') end) then return false; end if;
        if kind = 'day_camp' and exists (select 1 from jsonb_array_elements(v -> 'terms') t
          where (select count(*) from jsonb_array_elements(cards) x where x ->> 'termId' = t ->> 'id') <> 1) then return false; end if;
      end if;
      for j in select value from jsonb_array_elements(cards) loop
        if not public.has_only_json_keys(j,array['termId','departureDate','departureTime','departurePlace','returnDate','returnTime','returnPlace','note']) then return false; end if;
        if j ? 'termId' and not coalesce(j ->> 'termId' ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$',false) then return false; end if;
        foreach field in array array['departureDate','returnDate'] loop
          if not public.vhs_section_text(j,field,10) then return false; end if;
          if complete and organized and not public.is_valid_json_iso_date(j -> field) then return false; end if;
        end loop;
        foreach field in array array['departureTime','returnTime'] loop
          if not public.vhs_section_text(j,field,5) then return false; end if;
          if complete and organized and j ->> field <> '' and not (j ->> field ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then return false; end if;
        end loop;
        if not public.vhs_section_text(j,'departurePlace',120,complete and organized) or not public.vhs_section_text(j,'returnPlace',120,complete and organized) or not public.vhs_section_text(j,'note',5000) then return false; end if;
        if complete and organized and (j ->> 'returnDate' < j ->> 'departureDate' or (j ->> 'returnDate' = j ->> 'departureDate' and j ->> 'departureTime' <> '' and j ->> 'returnTime' <> '' and j ->> 'returnTime' < j ->> 'departureTime')) then return false; end if;
      end loop;
    end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;


create or replace function public.guard_offer_content_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (
    (old.description -> 'schemaVersion' = '2'::jsonb and new.description -> 'schemaVersion' is distinct from '2'::jsonb)
    or (old.description ? 'highlightIcons' and not (new.description ? 'highlightIcons'))
    or (old.description ? 'showRentalLink' and not (new.description ? 'showRentalLink'))
    or (old.description ? 'priceNote' and not (new.description ? 'priceNote'))
    or (old.description #> '{transport,types}' is not null and new.description #> '{transport,types}' is null)
  ) then
    raise check_violation using message = 'Odśwież CMS przed zapisaniem oferty.', constraint = 'offer_content_version_downgrade';
  end if;
  if not public.vhs_valid_highlight_icons(new.description) or (
    (new.description -> 'schemaVersion' = '2'::jsonb
    or new.description ? 'showRentalLink'
    or new.description ? 'priceNote'
    or new.description #> '{transport,types}' is not null)
    and not public.is_valid_offer_sections(new.description,new.offer_kind,false)
  ) then
    raise check_violation using message = 'Nieprawidłowa struktura sekcji oferty.', constraint = 'offer_content_sections_invalid';
  end if;
  if (tg_op = 'INSERT' or
    (select jsonb_agg(case when jsonb_typeof(item) = 'string' then to_jsonb(public.vhs_js_trim(item #>> '{}')) else item end order by n)
      from jsonb_array_elements(case when jsonb_typeof(new.description -> 'paragraphs') = 'array' then new.description -> 'paragraphs' else '[]'::jsonb end) with ordinality a(item,n))
    is distinct from
    (select jsonb_agg(case when jsonb_typeof(item) = 'string' then to_jsonb(public.vhs_js_trim(item #>> '{}')) else item end order by n)
      from jsonb_array_elements(case when jsonb_typeof(old.description -> 'paragraphs') = 'array' then old.description -> 'paragraphs' else '[]'::jsonb end) with ordinality a(item,n)))
    and jsonb_typeof(new.description -> 'paragraphs') = 'array'
    and exists (select 1 from jsonb_array_elements(new.description -> 'paragraphs') item
      where jsonb_typeof(item) = 'string' and public.vhs_utf16_length(public.vhs_js_trim(item #>> '{}')) > 5000)
  then
    raise check_violation using message = 'Opis przekracza dopuszczalną długość.', constraint = 'offer_paragraphs_length';
  end if;
  if jsonb_typeof(new.description #> '{accommodation,description}') = 'string'
    and public.vhs_utf16_length(public.vhs_js_trim(new.description #>> '{accommodation,description}')) > 5000 then
    raise check_violation using message = 'Opis przekracza dopuszczalną długość.', constraint = 'offer_accommodation_text_length';
  end if;
  if not public.vhs_camp_long_text_valid(new.description) then
    raise check_violation using message = 'Opis przekracza dopuszczalną długość.', constraint = 'offer_camp_text_length';
  end if;
  return new;
end;
$$;

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
         and char_length(public.vhs_js_trim(public.offer_images.alt_text)) between 1 and 180
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


create or replace function public.replace_offer_resort_map(p_offer_id uuid,p_storage_path text,p_alt_text text)
returns table(image jsonb, previous_path text)
language plpgsql security invoker set search_path = '' as $$
declare old_path text; saved public.offer_images;
begin
  if not public.is_cms_admin() then raise insufficient_privilege using message = 'Brak uprawnień do mapy resortu.'; end if;
  perform 1 from public.offers where id = p_offer_id for update;
  if not found then raise invalid_parameter_value using message = 'Oferta nie istnieje.'; end if;
  if p_storage_path is null or p_alt_text is null or p_storage_path !~ ('^offers/' || p_offer_id::text || '/[0-9a-fA-F-]{36}\.(jpeg|png|webp)$')
    or char_length(public.vhs_js_trim(p_alt_text)) not between 1 and 180
    or not exists(select 1 from storage.objects where bucket_id='offer-images' and name=p_storage_path) then
    raise invalid_parameter_value using message = 'Nieprawidłowy obraz mapy.';
  end if;
  select storage_path into old_path from public.offer_images where offer_id=p_offer_id and category='resort_map';
  insert into public.offer_images(offer_id,storage_path,alt_text,category,position)
    values(p_offer_id,p_storage_path,public.vhs_js_trim(p_alt_text),'resort_map',0)
    on conflict(offer_id) where category='resort_map'
    do update set storage_path=excluded.storage_path,alt_text=excluded.alt_text
    returning * into saved;
  return query select to_jsonb(saved), old_path;
end;
$$;
