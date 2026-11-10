-- Accept current and legacy content without rewriting any offers.
create or replace function public.vhs_content_base(v jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := v - array['schemaVersion','resort','training','transport','insurance','priceNote'];
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

create or replace function public.is_valid_offer_sections(v jsonb, kind public.offer_kind, publication boolean default true)
returns boolean language plpgsql stable set search_path = '' as $$
declare k text; s jsonb; c jsonb; r jsonb; j jsonb; cards jsonb; complete boolean; counter integer; field text; seen text[]; modes jsonb; organized boolean;
begin
  if jsonb_typeof(v) <> 'object' then return false; end if;
  if v ? 'schemaVersion' then
    if v -> 'schemaVersion' <> '2'::jsonb then return false; end if;
  elsif v ?| array['resort','training','transport','insurance','priceNote'] or (v -> 'accommodation') ? 'enabled' then
    return false;
  end if;
  if v ? 'priceNote' and not public.vhs_section_text(v,'priceNote',1000) then return false; end if;
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
      if jsonb_typeof(cards) <> 'array' or cards is null or jsonb_array_length(cards) > counter or (complete and k = 'insurance' and jsonb_array_length(cards) < 1) then return false; end if;
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
        if not public.vhs_section_text(j,'departurePlace',120,complete and organized) or not public.vhs_section_text(j,'returnPlace',120,complete and organized) or not public.vhs_section_text(j,'note',500) then return false; end if;
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
    or (old.description ? 'priceNote' and not (new.description ? 'priceNote'))
    or (old.description #> '{transport,types}' is not null and new.description #> '{transport,types}' is null)
  ) then
    raise check_violation using message = 'Odśwież CMS przed zapisaniem oferty.', constraint = 'offer_content_version_downgrade';
  end if;
  if (
    new.description -> 'schemaVersion' = '2'::jsonb
    or new.description ? 'priceNote'
    or new.description #> '{transport,types}' is not null
  ) and not public.is_valid_offer_sections(new.description,new.offer_kind,false) then
    raise check_violation using message = 'Nieprawidłowa struktura sekcji oferty.', constraint = 'offer_content_sections_invalid';
  end if;
  return new;
end;
$$;

-- Training photos are managed independently from the offer and resort galleries.
alter table public.offer_images drop constraint if exists offer_images_category_check;
alter table public.offer_images add constraint offer_images_category_check
  check (category in ('gallery', 'accommodation', 'resort_map', 'resort_gallery', 'training_gallery'));

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
  if p_category not in ('gallery', 'accommodation', 'resort_map', 'resort_gallery', 'training_gallery') then
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
