alter table public.offer_images
  add column category text not null default 'gallery'
    check (category in ('gallery', 'accommodation'));

alter table public.offer_images
  drop constraint offer_images_offer_id_position_key;

alter table public.offer_images
  add constraint offer_images_offer_category_position_key unique (offer_id, category, position);

create index offer_images_offer_category_position_idx
  on public.offer_images (offer_id, category, position);

create function public.is_valid_accommodation_content(p_accommodation jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_accommodation) = 'object'
    and public.has_only_json_keys(p_accommodation, array['description'])
    and jsonb_typeof(p_accommodation -> 'description') = 'string'
    and char_length(trim(p_accommodation ->> 'description')) between 3 and 500;
$$;

create or replace function public.is_valid_trip_content(p_content jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select public.has_only_json_keys(
      p_content,
      array['paragraphs', 'highlights', 'included', 'excluded', 'schedule', 'accommodation']
    )
    and public.is_nonempty_json_text_array(p_content -> 'paragraphs')
    and public.is_nonempty_json_text_array(p_content -> 'highlights')
    and public.is_nonempty_json_text_array(p_content -> 'included')
    and public.is_nonempty_json_text_array(p_content -> 'excluded')
    and public.is_valid_json_schedule(p_content -> 'schedule', 'day', 'text')
    and (
      not (p_content ? 'accommodation')
      or public.is_valid_accommodation_content(p_content -> 'accommodation')
    );
$$;

create or replace function public.is_valid_day_camp_content(p_content jsonb)
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.has_only_json_keys(
      p_content,
      array[
        'paragraphs', 'highlights', 'included', 'excluded', 'dayProgram',
        'venueDescription', 'parentInfo', 'terms', 'accommodation'
      ]
    )
    and public.is_nonempty_json_text_array(p_content -> 'paragraphs')
    and public.is_nonempty_json_text_array(p_content -> 'highlights')
    and public.is_nonempty_json_text_array(p_content -> 'included')
    and public.is_nonempty_json_text_array(p_content -> 'excluded')
    and public.is_valid_json_schedule(p_content -> 'dayProgram', 'time', 'text')
    and public.is_nonempty_json_text(p_content -> 'venueDescription')
    and public.has_only_json_keys(
      p_content -> 'parentInfo',
      array['ageRange', 'supervision', 'safety', 'transport', 'meals']
    )
    and public.is_nonempty_json_text(p_content -> 'parentInfo' -> 'ageRange')
    and public.is_nonempty_json_text(p_content -> 'parentInfo' -> 'supervision')
    and public.is_nonempty_json_text(p_content -> 'parentInfo' -> 'safety')
    and (
      not ((p_content -> 'parentInfo') ? 'transport')
      or public.is_nonempty_json_text(p_content -> 'parentInfo' -> 'transport')
    )
    and (
      not ((p_content -> 'parentInfo') ? 'meals')
      or public.is_nonempty_json_text(p_content -> 'parentInfo' -> 'meals')
    )
    and public.is_valid_day_camp_terms(p_content -> 'terms')
    and (
      not (p_content ? 'accommodation')
      or public.is_valid_accommodation_content(p_content -> 'accommodation')
    );
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

drop function public.reorder_offer_images(uuid, uuid[]);

create function public.reorder_offer_images(
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
  if p_category not in ('gallery', 'accommodation') then
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

revoke all on function public.reorder_offer_images(uuid, uuid[], text) from public;
revoke all on function public.reorder_offer_images(uuid, uuid[], text) from anon;
grant execute on function public.reorder_offer_images(uuid, uuid[], text) to authenticated;

revoke all on function public.is_valid_accommodation_content(jsonb) from public;
revoke all on function public.is_valid_trip_content(jsonb) from public;
revoke all on function public.is_valid_day_camp_content(jsonb) from public;
revoke all on function public.enforce_offer_publication_readiness() from public;
