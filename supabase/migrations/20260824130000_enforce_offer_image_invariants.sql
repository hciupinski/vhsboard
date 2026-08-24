create function public.enforce_offer_publication_readiness()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (
       tg_op = 'INSERT'
       or old.status is distinct from 'published'
       or new.hero_image is distinct from old.hero_image
     )
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

  return new;
end;
$$;

create trigger offers_enforce_publication_readiness
before insert or update of status, hero_image on public.offers
for each row
execute function public.enforce_offer_publication_readiness();

revoke all on function public.enforce_offer_publication_readiness() from public;

create function public.reorder_offer_images(
  p_offer_id uuid,
  p_ordered_image_ids uuid[]
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
  if not public.is_cms_admin() then
    raise insufficient_privilege using message = 'Brak uprawnień do zmiany kolejności obrazów.';
  end if;

  perform 1
  from public.offers
  where public.offers.id = p_offer_id
  for update;

  if not found then
    raise invalid_parameter_value using message = 'Oferta nie istnieje.';
  end if;

  perform 1
  from public.offer_images
  where public.offer_images.offer_id = p_offer_id
  for update;

  select count(*), coalesce(max(public.offer_images.position), -1)
    into current_count, max_position
  from public.offer_images
  where public.offer_images.offer_id = p_offer_id;

  if p_ordered_image_ids is null
     or cardinality(p_ordered_image_ids) <> current_count then
    raise invalid_parameter_value
      using message = 'Kolejność musi zawierać wszystkie obrazy oferty.';
  end if;

  select count(distinct ordered_id)
    into supplied_count
  from unnest(p_ordered_image_ids) as ordered_id;

  if supplied_count <> current_count
     or exists (
       select 1
       from unnest(p_ordered_image_ids) as ordered_id
       where not exists (
         select 1
         from public.offer_images
         where public.offer_images.offer_id = p_offer_id
           and public.offer_images.id = ordered_id
       )
     ) then
    raise invalid_parameter_value
      using message = 'Kolejność musi zawierać wszystkie obrazy oferty.';
  end if;

  for image_id, target_position in
    select ordered_id, (ordinality - 1)::integer
    from unnest(p_ordered_image_ids) with ordinality as ordered(ordered_id, ordinality)
  loop
    update public.offer_images
    set position = max_position + current_count + target_position + 1
    where public.offer_images.id = image_id
      and public.offer_images.offer_id = p_offer_id;
  end loop;

  for image_id, target_position in
    select ordered_id, (ordinality - 1)::integer
    from unnest(p_ordered_image_ids) with ordinality as ordered(ordered_id, ordinality)
  loop
    update public.offer_images
    set position = target_position
    where public.offer_images.id = image_id
      and public.offer_images.offer_id = p_offer_id;
  end loop;
end;
$$;

revoke all on function public.reorder_offer_images(uuid, uuid[]) from public;
revoke all on function public.reorder_offer_images(uuid, uuid[]) from anon;
grant execute on function public.reorder_offer_images(uuid, uuid[]) to authenticated;
