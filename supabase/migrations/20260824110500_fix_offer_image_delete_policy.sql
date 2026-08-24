drop policy "cms administrators delete scoped offer image objects" on storage.objects;
create policy "cms administrators delete scoped offer image objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'offer-images'
  and (select public.is_cms_admin())
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = 'offers'
  and lower(name) ~ '^offers/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpeg|png|webp)$'
  and exists (
    select 1
    from public.offers
    where public.offers.id::text = (storage.foldername(name))[2]
  )
);
