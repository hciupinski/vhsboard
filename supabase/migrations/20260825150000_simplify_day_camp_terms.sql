create or replace function public.is_valid_day_camp_terms(p_terms jsonb)
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
          array['label', 'startDate', 'endDate', 'bookingUrl', 'priceOptions']
        )
        or not public.is_nonempty_json_text(term.value -> 'label')
        or not public.is_valid_json_iso_date(term.value -> 'startDate')
        or not public.is_valid_json_iso_date(term.value -> 'endDate')
        or (term.value ->> 'endDate') < (term.value ->> 'startDate')
        or not public.is_nonempty_json_text(term.value -> 'bookingUrl')
        or (term.value ->> 'bookingUrl') !~ '^https://[^[:space:]]+$'
        or jsonb_typeof(term.value -> 'priceOptions') <> 'array'
        or jsonb_array_length(term.value -> 'priceOptions') = 0
        or exists (
          select 1
          from jsonb_array_elements(term.value -> 'priceOptions') as price_option(value)
          where not public.has_only_json_keys(price_option.value, array['label', 'price'])
            or not public.is_nonempty_json_text(price_option.value -> 'label')
            or jsonb_typeof(price_option.value -> 'price') <> 'number'
            or (price_option.value ->> 'price')::numeric <= 0
        )
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
        'venueDescription', 'parentInfo', 'terms'
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
    and public.is_valid_day_camp_terms(p_content -> 'terms');
$$;

update public.offers as offer
set description = jsonb_set(
  offer.description - 'activityPlan',
  '{terms}',
  (
    select jsonb_agg(
      jsonb_set(
        jsonb_set(
          term.value,
          '{bookingUrl}',
          to_jsonb(
            coalesce(
              term.value ->> 'bookingUrl',
              term.value -> 'priceOptions' -> 0 ->> 'bookingUrl',
              offer.booking_url
            )
          )
        ),
        '{priceOptions}',
        (
          select jsonb_agg(price_option.value - 'bookingUrl')
          from jsonb_array_elements(term.value -> 'priceOptions') as price_option(value)
        )
      )
    )
    from jsonb_array_elements(offer.description -> 'terms') as term(value)
  )
)
where offer.offer_kind = 'day_camp';
