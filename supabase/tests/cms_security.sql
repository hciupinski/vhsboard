begin;

select plan(1);

do $$
declare
  admin_id constant uuid := '10000000-0000-0000-0000-000000000001';
  editor_id constant uuid := '10000000-0000-0000-0000-000000000002';
  draft_offer_id uuid;
  published_offer_id uuid;
  archived_offer_id uuid;
  managed_offer_id uuid;
  published_path text;
  draft_path text;
  managed_path text;
  affected_rows integer;
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'offer-images'
      and public = false
      and file_size_limit = 52428800
      and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
  ) then
    raise exception 'offer-images bucket must enforce image MIME types and a 50 MiB size limit';
  end if;

  insert into auth.users (id)
  values
    (admin_id),
    (editor_id);

  insert into public.profiles (id, role)
  values
    (admin_id, 'admin'),
    (editor_id, 'editor');

  insert into public.offers (
    slug,
    activity,
    title,
    subtitle,
    short_description,
    location,
    duration_days,
    price_from,
    booking_url,
    status
  )
  values
    (
      'testowy-szkic',
      'surf',
      'Testowy szkic',
      'Oferta niewidoczna publicznie',
      'Wystarczająco długi opis testowego szkicu oferty.',
      'Hel',
      7,
      1200,
      'https://tripahead.example.test/szkic',
      'draft'
    ),
    (
      'testowa-opublikowana',
      'snow',
      'Testowa oferta',
      'Oferta widoczna publicznie',
      'Wystarczająco długi opis opublikowanej oferty testowej.',
      'Szczyrk',
      5,
      1800,
      'https://tripahead.example.test/opublikowana',
      'published'
    ),
    (
      'testowa-archiwalna',
      'combo',
      'Testowe archiwum',
      'Oferta niewidoczna publicznie',
      'Wystarczająco długi opis archiwalnej oferty testowej.',
      'Fuerteventura',
      10,
      2500,
      'https://tripahead.example.test/archiwalna',
      'archived'
    );
  select id into published_offer_id
  from public.offers
  where slug = 'testowa-opublikowana';

  select id into draft_offer_id
  from public.offers
  where slug = 'testowy-szkic';

  select id into archived_offer_id
  from public.offers
  where slug = 'testowa-archiwalna';

  published_path := format(
    'offers/%s/%s.jpg',
    published_offer_id,
    '20000000-0000-0000-0000-000000000001'
  );
  draft_path := format(
    'offers/%s/%s.jpg',
    draft_offer_id,
    '20000000-0000-0000-0000-000000000002'
  );

  insert into public.offer_images (offer_id, storage_path, alt_text, position)
  values
    (published_offer_id, published_path, 'Testowe zdjęcie opublikowanej oferty', 0),
    (draft_offer_id, draft_path, 'Testowe zdjęcie szkicu oferty', 0);

  insert into storage.objects (bucket_id, name)
  values
    ('offer-images', published_path),
    ('offer-images', draft_path);

  execute 'set local role anon';

  if (select count(*) from public.offers) <> 1 then
    raise exception 'anon must see exactly one published offer';
  end if;

  if exists (select 1 from public.offers where id in (draft_offer_id, archived_offer_id)) then
    raise exception 'anon must not see draft or archived offers';
  end if;

  if (select count(*) from public.offer_images) <> 1 then
    raise exception 'anon must see images from published offers only';
  end if;

  if (select count(*) from storage.objects where bucket_id = 'offer-images') <> 1 then
    raise exception 'anon must read a private object only through published metadata';
  end if;

  begin
    insert into public.offers (
      slug,
      activity,
      title,
      subtitle,
      short_description,
      location,
      duration_days,
      price_from,
      booking_url
    )
    values (
      'anon-nieautoryzowany-wpis',
      'surf',
      'Anonim nie może utworzyć oferty',
      'Brak uprawnień do zapisu przez anonimową sesję',
      'Wystarczająco długi opis niedozwolonej operacji anonimowej.',
      'Hel',
      4,
      1000,
      'https://tripahead.example.test/anon-odmowa'
    );
    raise exception 'anon must not create offers';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name)
    values (
      'offer-images',
      format('offers/%s/%s.jpg', published_offer_id, '20000000-0000-0000-0000-000000000006')
    );
    raise exception 'anon must not create offer image objects';
  exception
    when insufficient_privilege then null;
  end;

  execute 'set local role none';
  perform set_config('request.jwt.claim.sub', editor_id::text, true);
  execute 'set local role authenticated';

  if (select count(*) from public.offers) <> 1 then
    raise exception 'ordinary authenticated users must see published offers only';
  end if;

  begin
    insert into public.offers (
      slug,
      activity,
      title,
      subtitle,
      short_description,
      location,
      duration_days,
      price_from,
      booking_url
    )
    values (
      'nieautoryzowany-wpis',
      'surf',
      'Nieautoryzowany wpis',
      'Zwykły użytkownik nie może zapisać oferty',
      'Wystarczająco długi opis niedozwolonej operacji zapisu.',
      'Hel',
      4,
      1000,
      'https://tripahead.example.test/odmowa'
    );
    raise exception 'ordinary authenticated users must not create offers';
  exception
    when insufficient_privilege then null;
  end;

  update public.offers
  set title = 'Nieautoryzowana zmiana'
  where id = published_offer_id;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'ordinary authenticated users must not update offers';
  end if;

  delete from public.offers where id = published_offer_id;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'ordinary authenticated users must not delete offers';
  end if;

  begin
    insert into public.offer_images (offer_id, storage_path, alt_text, position)
    values (
      published_offer_id,
      format('offers/%s/%s.jpg', published_offer_id, '20000000-0000-0000-0000-000000000003'),
      'Nieautoryzowana próba dodania zdjęcia',
      1
    );
    raise exception 'ordinary authenticated users must not create offer images';
  exception
    when insufficient_privilege then null;
  end;

  update public.offer_images
  set alt_text = 'Nieautoryzowana zmiana istniejącego zdjęcia'
  where offer_id = published_offer_id;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'ordinary authenticated users must not update offer images';
  end if;

  delete from public.offer_images where offer_id = published_offer_id;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'ordinary authenticated users must not delete offer images';
  end if;

  begin
    insert into storage.objects (bucket_id, name)
    values (
      'offer-images',
      format('offers/%s/%s.jpg', published_offer_id, '20000000-0000-0000-0000-000000000007')
    );
    raise exception 'ordinary authenticated users must not create offer image objects';
  exception
    when insufficient_privilege then null;
  end;

  execute 'set local role none';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  execute 'set local role authenticated';

  insert into public.offers (
    slug,
    activity,
    title,
    subtitle,
    short_description,
    location,
    duration_days,
    price_from,
    booking_url
  )
  values (
    'zarzadzany-szkic',
    'surf',
    'Szkic administratora',
    'Administrator może utworzyć i opublikować ofertę',
    'Wystarczająco długi opis szkicu tworzonego przez administratora.',
    'Peniche',
    6,
    1900,
    'https://tripahead.example.test/zarzadzany'
  )
  returning id into managed_offer_id;

  update public.offers
  set status = 'published'
  where id = managed_offer_id;

  if not exists (
    select 1
    from public.offers
    where id = managed_offer_id
      and status = 'published'
      and published_at is not null
  ) then
    raise exception 'administrator publication must set published_at';
  end if;

  update public.offers
  set title = 'Opublikowana oferta administratora'
  where id = managed_offer_id;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'administrator must update offers';
  end if;

  managed_path := format(
    'offers/%s/%s.webp',
    managed_offer_id,
    '20000000-0000-0000-0000-000000000004'
  );

  insert into public.offer_images (offer_id, storage_path, alt_text, position)
  values (
    managed_offer_id,
    managed_path,
    'Zdjęcie dodane do oferty przez administratora',
    0
  );

  insert into storage.objects (bucket_id, name)
  values (
    'offer-images',
    managed_path
  );

  update storage.objects
  set metadata = jsonb_build_object('verified', true)
  where bucket_id = 'offer-images'
    and name = managed_path;
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'administrator must update a scoped offer image object';
  end if;

  begin
    insert into storage.objects (bucket_id, name)
    values ('offer-images', format('offers/%s/not-uuid.jpg', managed_offer_id));
    raise exception 'administrator storage path must use a UUID filename';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name)
    values (
      'offer-images',
      'offers/30000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000005.jpg'
    );
    raise exception 'administrator storage path must reference an existing offer';
  exception
    when insufficient_privilege then null;
  end;

  delete from public.offer_images
  where offer_id = managed_offer_id;

  delete from public.offers
  where id = managed_offer_id;

  execute 'set local role none';
end;
$$;

select pass('CMS RLS and private Storage policies enforce publication and administrator boundaries');
select * from finish();

rollback;
