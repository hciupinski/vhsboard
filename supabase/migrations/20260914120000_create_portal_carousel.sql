create table public.portal_carousel_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null unique check (image_path ~ '^carousel/[a-zA-Z0-9._/-]+$'),
  position integer not null unique check (position >= 0),
  created_at timestamptz not null default now()
);

grant select on public.portal_carousel_images to anon, authenticated;
grant insert, update, delete on public.portal_carousel_images to authenticated;

alter table public.portal_carousel_images enable row level security;

create policy "portal carousel is publicly visible"
on public.portal_carousel_images
for select
to anon, authenticated
using (true);

create policy "cms administrators manage portal carousel"
on public.portal_carousel_images
for all
to authenticated
using ((select public.is_cms_admin()))
with check ((select public.is_cms_admin()));

create function public.set_portal_carousel_images(p_ordered_paths text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_count integer;
  max_position integer;
begin
  if not public.is_cms_admin() then
    raise insufficient_privilege
      using message = 'Brak uprawnień do zmiany karuzeli portalu.';
  end if;

  if p_ordered_paths is null
     or exists (
       select 1
       from unnest(p_ordered_paths) as supplied_path(image_path)
       where supplied_path.image_path is null
          or supplied_path.image_path !~ '^carousel/[a-zA-Z0-9._/-]+$'
     )
     or cardinality(p_ordered_paths) <> (
       select count(distinct supplied_path.image_path)
       from unnest(p_ordered_paths) as supplied_path(image_path)
     ) then
    raise invalid_parameter_value
      using message = 'Nieprawidłowa ścieżka obrazu karuzeli.';
  end if;

  perform 1
  from public.portal_carousel_images
  for update;

  select count(*), coalesce(max(portal_image.position), -1)
    into current_count, max_position
  from public.portal_carousel_images as portal_image;

  delete from public.portal_carousel_images as portal_image
  where not (portal_image.image_path = any(p_ordered_paths));

  insert into public.portal_carousel_images (image_path, position)
  select
    ordered_path.image_path,
    max_position
      + current_count
      + cardinality(p_ordered_paths)
      + ordered_path.ordinality::integer
  from unnest(p_ordered_paths) with ordinality as ordered_path(image_path, ordinality)
  on conflict (image_path) do update
    set position = excluded.position;

  update public.portal_carousel_images as portal_image
  set position = (ordered_path.ordinality - 1)::integer
  from unnest(p_ordered_paths) with ordinality as ordered_path(image_path, ordinality)
  where portal_image.image_path = ordered_path.image_path;
end;
$$;

revoke all on function public.set_portal_carousel_images(text[]) from public;
revoke all on function public.set_portal_carousel_images(text[]) from anon;
grant execute on function public.set_portal_carousel_images(text[]) to authenticated;
