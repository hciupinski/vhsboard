-- Preserve legacy group-size values while allowing an editorial audience label.
alter table public.offers add column audience text;
alter table public.offers add constraint offers_audience_length
  check (audience is null or char_length(audience) <= 240);

-- The legacy validators reject unknown keys. Validate the optional icon array
-- separately before removing it from the legacy projection.
create or replace function public.vhs_content_base(v jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb := v - array['schemaVersion','resort','training','transport','insurance','priceNote','showRentalLink','highlightIcons'];
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

create function public.vhs_valid_highlight_icons(v jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if not (v ? 'highlightIcons') then return true; end if;
  if jsonb_typeof(v -> 'highlightIcons') <> 'array' then return false; end if;
  return not exists (select 1 from jsonb_array_elements(v -> 'highlightIcons') i
    where jsonb_typeof(i) <> 'string' or char_length(i #>> '{}') > 40);
end;
$$;

create or replace function public.is_valid_trip_content(p_content jsonb)
returns boolean language sql stable set search_path = '' as $$
  select coalesce(public.vhs_valid_highlight_icons(p_content)
    and public.is_valid_trip_content_legacy(public.vhs_content_base(p_content))
    and public.is_valid_offer_sections(p_content,'trip',true), false);
$$;
create or replace function public.is_valid_day_camp_content(p_content jsonb)
returns boolean language sql stable set search_path = '' as $$
  select coalesce(public.vhs_valid_highlight_icons(p_content)
    and public.is_valid_day_camp_content_legacy(public.vhs_content_base(p_content))
    and public.is_valid_offer_sections(p_content,'day_camp',true), false);
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
  return new;
end;
$$;
