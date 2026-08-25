create type public.offer_kind as enum ('trip', 'day_camp');

alter type public.offer_activity add value if not exists 'wake';

alter table public.offers
  add column offer_kind public.offer_kind not null default 'trip';

alter table public.offers
  add constraint offers_offer_kind_activity_check check (
    (offer_kind = 'trip' and activity::text in ('surf', 'snow', 'combo'))
    or (offer_kind = 'day_camp' and activity::text in ('wake', 'snow'))
  ),
  add constraint offers_day_camp_has_no_group_limits_check check (
    offer_kind = 'trip' or (group_size_min is null and group_size_max is null)
  );

create index offers_status_offer_kind_published_at_idx
on public.offers (status, offer_kind, published_at desc);

grant usage on type public.offer_kind to anon, authenticated;

create function public.is_nonempty_json_text(p_value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_value) = 'string'
    and char_length(trim(p_value #>> '{}')) > 0;
$$;

create function public.is_nonempty_json_text_array(p_value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_value) = 'array'
    and jsonb_array_length(p_value) > 0
    and not exists (
      select 1
      from jsonb_array_elements(p_value) as item(value)
      where not public.is_nonempty_json_text(item.value)
    );
$$;

create function public.has_only_json_keys(p_value jsonb, p_allowed_keys text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_value) = 'object'
    and not exists (
      select 1
      from jsonb_object_keys(p_value) as key(value)
      where not key.value = any(p_allowed_keys)
    );
$$;

create function public.is_valid_json_iso_date(p_value jsonb)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_nonempty_json_text(p_value)
     or (p_value #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then
    return false;
  end if;

  perform (p_value #>> '{}')::date;
  return true;
exception
  when others then return false;
end;
$$;

create function public.is_valid_json_schedule(p_value jsonb, p_first_key text, p_second_key text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_value) = 'array'
    and jsonb_array_length(p_value) > 0
    and not exists (
      select 1
      from jsonb_array_elements(p_value) as item(value)
      where not public.has_only_json_keys(item.value, array[p_first_key, p_second_key])
        or not public.is_nonempty_json_text(item.value -> p_first_key)
        or not public.is_nonempty_json_text(item.value -> p_second_key)
    );
$$;

create function public.is_valid_trip_content(p_content jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select public.has_only_json_keys(
      p_content,
      array['paragraphs', 'highlights', 'included', 'excluded', 'schedule']
    )
    and public.is_nonempty_json_text_array(p_content -> 'paragraphs')
    and public.is_nonempty_json_text_array(p_content -> 'highlights')
    and public.is_nonempty_json_text_array(p_content -> 'included')
    and public.is_nonempty_json_text_array(p_content -> 'excluded')
    and public.is_valid_json_schedule(p_content -> 'schedule', 'day', 'text');
$$;

create function public.is_valid_day_camp_terms(p_terms jsonb)
returns boolean
language sql
stable
set search_path = ''
as $$
  select jsonb_typeof(p_terms) = 'array'
    and jsonb_array_length(p_terms) between 1 and 2
    and not exists (
      select 1
      from jsonb_array_elements(p_terms) as term(value)
      where not public.has_only_json_keys(
          term.value,
          array['label', 'startDate', 'endDate', 'priceOptions']
        )
        or not public.is_nonempty_json_text(term.value -> 'label')
        or not public.is_valid_json_iso_date(term.value -> 'startDate')
        or not public.is_valid_json_iso_date(term.value -> 'endDate')
        or (term.value ->> 'endDate') < (term.value ->> 'startDate')
        or jsonb_typeof(term.value -> 'priceOptions') <> 'array'
        or jsonb_array_length(term.value -> 'priceOptions') = 0
        or exists (
          select 1
          from jsonb_array_elements(term.value -> 'priceOptions') as price_option(value)
          where not public.has_only_json_keys(
              price_option.value,
              array['label', 'price', 'bookingUrl']
            )
            or not public.is_nonempty_json_text(price_option.value -> 'label')
            or jsonb_typeof(price_option.value -> 'price') <> 'number'
            or (price_option.value ->> 'price')::numeric <= 0
            or not public.is_nonempty_json_text(price_option.value -> 'bookingUrl')
            or (price_option.value ->> 'bookingUrl') !~ '^https://[^[:space:]]+$'
        )
    );
$$;

create function public.is_valid_day_camp_content(p_content jsonb)
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.has_only_json_keys(
      p_content,
      array[
        'paragraphs', 'highlights', 'included', 'excluded', 'dayProgram', 'activityPlan',
        'venueDescription', 'parentInfo', 'terms'
      ]
    )
    and public.is_nonempty_json_text_array(p_content -> 'paragraphs')
    and public.is_nonempty_json_text_array(p_content -> 'highlights')
    and public.is_nonempty_json_text_array(p_content -> 'included')
    and public.is_nonempty_json_text_array(p_content -> 'excluded')
    and public.is_valid_json_schedule(p_content -> 'dayProgram', 'time', 'text')
    and public.is_valid_json_schedule(p_content -> 'activityPlan', 'title', 'text')
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
    and public.is_valid_day_camp_terms(p_content -> 'terms');
$$;

create function public.is_valid_published_offer_content(
  p_offer_kind public.offer_kind,
  p_content jsonb
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case p_offer_kind
    when 'trip' then public.is_valid_trip_content(p_content)
    when 'day_camp' then public.is_valid_day_camp_content(p_content)
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
     and not exists (
       select 1
       from public.offer_images
       where public.offer_images.offer_id = new.id
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

  return new;
end;
$$;

drop trigger offers_enforce_publication_readiness on public.offers;

create trigger offers_enforce_publication_readiness
before insert or update of status, hero_image, description, offer_kind, activity, booking_url
on public.offers
for each row
execute function public.enforce_offer_publication_readiness();

revoke all on function public.is_nonempty_json_text(jsonb) from public;
revoke all on function public.is_nonempty_json_text_array(jsonb) from public;
revoke all on function public.has_only_json_keys(jsonb, text[]) from public;
revoke all on function public.is_valid_json_iso_date(jsonb) from public;
revoke all on function public.is_valid_json_schedule(jsonb, text, text) from public;
revoke all on function public.is_valid_trip_content(jsonb) from public;
revoke all on function public.is_valid_day_camp_terms(jsonb) from public;
revoke all on function public.is_valid_day_camp_content(jsonb) from public;
revoke all on function public.is_valid_published_offer_content(public.offer_kind, jsonb) from public;
revoke all on function public.enforce_offer_publication_readiness() from public;
