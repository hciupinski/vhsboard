create table public.contact_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  storage_path text not null unique check (
    lower(storage_path) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
  ),
  position integer not null unique check (position >= 0),
  created_at timestamptz not null default now()
);

create index contact_documents_position_idx on public.contact_documents (position);

grant select on public.contact_documents to anon, authenticated;
grant insert, update, delete on public.contact_documents to authenticated;

alter table public.contact_documents enable row level security;

create policy "contact documents are publicly visible"
on public.contact_documents
for select
to anon, authenticated
using (true);

create policy "cms administrators manage contact documents"
on public.contact_documents
as permissive
for all
to authenticated
using ((select public.is_cms_admin()))
with check ((select public.is_cms_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-documents',
  'contact-documents',
  false,
  10485760,
  array['application/pdf']::text[]
);

create policy "contact document objects are publicly readable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'contact-documents'
  and exists (
    select 1
    from public.contact_documents
    where public.contact_documents.storage_path = storage.objects.name
  )
);

create policy "cms administrators insert contact document objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'contact-documents'
  and (select public.is_cms_admin())
  and lower(name) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
);

create policy "cms administrators update contact document objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'contact-documents'
  and (select public.is_cms_admin())
  and lower(name) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
)
with check (
  bucket_id = 'contact-documents'
  and (select public.is_cms_admin())
  and lower(name) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
);

create policy "cms administrators delete contact document objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'contact-documents'
  and (select public.is_cms_admin())
  and lower(name) ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
);
