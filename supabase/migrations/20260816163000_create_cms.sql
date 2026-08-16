create type public.offer_status as enum ('draft', 'published', 'archived');
create type public.offer_activity as enum ('surf', 'snow', 'combo');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  activity public.offer_activity not null,
  title text not null check (char_length(title) between 3 and 120),
  subtitle text not null check (char_length(subtitle) between 3 and 280),
  short_description text not null check (char_length(short_description) between 20 and 500),
  description jsonb not null default '{}'::jsonb,
  location text not null check (char_length(location) between 2 and 120),
  start_date date,
  end_date date,
  duration_days smallint not null check (duration_days between 1 and 60),
  group_size_min smallint check (group_size_min between 1 and 99),
  group_size_max smallint check (group_size_max between 1 and 99),
  price_from integer not null check (price_from >= 0),
  currency char(3) not null default 'PLN' check (currency = upper(currency)),
  booking_url text not null check (booking_url ~ '^https://'),
  hero_image text,
  status public.offer_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (group_size_max is null or group_size_min is null or group_size_max >= group_size_min),
  check ((status = 'published') = (published_at is not null))
);

create table public.offer_images (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null check (char_length(trim(alt_text)) between 5 and 180),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (offer_id, position)
);

create index offers_status_published_at_idx on public.offers (status, published_at desc);
create index offer_images_offer_id_position_idx on public.offer_images (offer_id, position);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.set_offer_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  elsif new.status <> 'published' then
    new.published_at = null;
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger offers_set_updated_at
before update on public.offers
for each row
execute function public.set_updated_at();

create trigger offers_set_published_at
before insert or update of status on public.offers
for each row
execute function public.set_offer_published_at();

create function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'
  );
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_offer_published_at() from public;
revoke all on function public.is_cms_admin() from public;
revoke all on function public.is_cms_admin() from anon;
grant execute on function public.is_cms_admin() to authenticated;

grant usage on schema public to anon, authenticated;
grant usage on type public.offer_status, public.offer_activity to anon, authenticated;
grant select on public.offers, public.offer_images to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update, delete on public.offers, public.offer_images to authenticated;

alter table public.profiles enable row level security;
alter table public.offers enable row level security;
alter table public.offer_images enable row level security;

create policy "profiles are visible to their owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "published offers are publicly visible"
on public.offers
for select
to anon, authenticated
using (status = 'published');

create policy "cms administrators manage all offers"
on public.offers
as permissive
for all
to authenticated
using ((select public.is_cms_admin()))
with check ((select public.is_cms_admin()));

create policy "published offer images are publicly visible"
on public.offer_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.offers
    where public.offers.id = offer_images.offer_id
      and public.offers.status = 'published'
  )
);

create policy "cms administrators manage all offer images"
on public.offer_images
as permissive
for all
to authenticated
using ((select public.is_cms_admin()))
with check ((select public.is_cms_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
);

create policy "published offer image objects are readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'offer-images'
  and exists (
    select 1
    from public.offer_images
    join public.offers on public.offers.id = public.offer_images.offer_id
    where public.offer_images.storage_path = storage.objects.name
      and public.offers.status = 'published'
  )
);

create policy "cms administrators read all offer image objects"
on storage.objects
for select
to authenticated
using (bucket_id = 'offer-images' and (select public.is_cms_admin()));

create policy "cms administrators insert scoped offer image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-images'
  and (select public.is_cms_admin())
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'offers'
  and lower(name) ~ '^offers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+$'
  and exists (
    select 1
    from public.offers
    where public.offers.id::text = (storage.foldername(name))[2]
  )
);

create policy "cms administrators update scoped offer image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offer-images'
  and (select public.is_cms_admin())
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'offers'
  and lower(name) ~ '^offers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+$'
  and exists (
    select 1
    from public.offers
    where public.offers.id::text = (storage.foldername(name))[2]
  )
)
with check (
  bucket_id = 'offer-images'
  and (select public.is_cms_admin())
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'offers'
  and lower(name) ~ '^offers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+$'
  and exists (
    select 1
    from public.offers
    where public.offers.id::text = (storage.foldername(name))[2]
  )
);

create policy "cms administrators delete scoped offer image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'offer-images'
  and (select public.is_cms_admin())
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'offers'
  and lower(name) ~ '^offers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+$'
  and exists (
    select 1
    from public.offers
    where public.offers.id::text = (storage.foldername(name))[2]
  )
);
