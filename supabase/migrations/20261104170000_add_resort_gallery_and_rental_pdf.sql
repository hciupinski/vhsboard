-- Resort photos are independent from the existing single resort map.
alter table public.offer_images drop constraint if exists offer_images_category_check;
alter table public.offer_images add constraint offer_images_category_check
  check (category in ('gallery', 'accommodation', 'resort_map', 'resort_gallery'));

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
  if p_category not in ('gallery', 'accommodation', 'resort_map', 'resort_gallery') then
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

-- Public can read only the current offer; writes stay restricted to CMS admins.
create table public.portal_rental_document (
  id integer primary key default 1 check (id = 1),
  storage_path text unique check (
    storage_path is null or lower(storage_path) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
  )
);
insert into public.portal_rental_document (id, storage_path) values (1, null);
alter table public.portal_rental_document enable row level security;
revoke all on public.portal_rental_document from anon, authenticated;
grant select on public.portal_rental_document to anon, authenticated;
grant update (storage_path) on public.portal_rental_document to authenticated;
create policy "portal rental document is publicly visible" on public.portal_rental_document
  for select to anon, authenticated using (true);
create policy "cms administrators update portal rental document" on public.portal_rental_document
  for update to authenticated using ((select public.is_cms_admin()))
  with check ((select public.is_cms_admin()));

create policy "current rental pdf is publicly readable" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'contact-documents' and exists (
      select 1 from public.portal_rental_document where storage_path = storage.objects.name
    )
  );

create function public.replace_portal_rental_document(p_path text)
returns text language plpgsql security invoker set search_path = '' as $$
declare old_path text;
begin
  if not public.is_cms_admin() then
    raise insufficient_privilege using message = 'Brak uprawnień administratora.';
  end if;
  if p_path is not null and lower(p_path) !~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$' then
    raise invalid_parameter_value using message = 'Nieprawidłowa ścieżka dokumentu.';
  end if;
  select storage_path into old_path from public.portal_rental_document where id = 1 for update;
  update public.portal_rental_document set storage_path = p_path where id = 1;
  return old_path;
end;
$$;
revoke all on function public.replace_portal_rental_document(text) from public, anon;
grant execute on function public.replace_portal_rental_document(text) to authenticated;
