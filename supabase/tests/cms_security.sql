begin;

select plan(1);

do $$
declare
  admin_id constant uuid := '10000000-0000-0000-0000-000000000001';
  editor_id constant uuid := '10000000-0000-0000-0000-000000000002';
  bucket_is_public boolean;
  bucket_limit bigint;
  allowed_types text[];
  draft_offer_id uuid;
  published_offer_id uuid;
  archived_offer_id uuid;
  day_camp_draft_id uuid;
  day_camp_published_id uuid;
  managed_offer_id uuid;
  managed_image_id uuid;
  managed_jpeg_image_id uuid;
  managed_png_image_id uuid;
  published_path text;
  draft_path text;
  day_camp_published_path text;
  managed_path text;
  managed_jpeg_path text;
  managed_png_path text;
  malformed_delete_path text;
  out_of_scope_delete_path text;
  affected_rows integer;
begin
  select public, file_size_limit, allowed_mime_types
    into bucket_is_public, bucket_limit, allowed_types
  from storage.buckets
  where id = 'offer-images';

  if bucket_is_public
     or bucket_limit <> 8388608
     or allowed_types <> array['image/jpeg', 'image/png', 'image/webp']::text[] then
    raise exception 'offer-images must accept only the Task 060 image contract';
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
      'https://zapisy.example.test/szkic',
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
      'https://zapisy.example.test/opublikowana',
      'draft'
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
      'https://zapisy.example.test/archiwalna',
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

  if (select offer_kind from public.offers where id = draft_offer_id) <> 'trip' then
    raise exception 'existing offers must migrate to trip';
  end if;

  insert into public.offers (
    slug,
    offer_kind,
    activity,
    title,
    subtitle,
    short_description,
    description,
    location,
    duration_days,
    price_from,
    booking_url,
    status
  )
  values
    (
      'polkolonie-szkic',
      'day_camp',
      'wake',
      'Szkic półkolonii wakeboardowej',
      'Półkolonie niewidoczne publicznie',
      'Wystarczająco długi opis szkicu półkolonii wakeboardowej.',
      jsonb_build_object(
        'paragraphs', jsonb_build_array('Opis półkolonii dla rodziców.'),
        'highlights', jsonb_build_array('Wakeboard z instruktorami.'),
        'included', jsonb_build_array('Opieka instruktorów.'),
        'excluded', jsonb_build_array('Dojazd we własnym zakresie.'),
        'dayProgram', jsonb_build_array(jsonb_build_object('time', '09:00–10:00', 'text', 'Rozgrzewka.')),
        'venueDescription', 'Wakepark z zapleczem dla dzieci.',
        'parentInfo', jsonb_build_object(
          'ageRange', '7–12 lat',
          'supervision', 'Stała opieka instruktorów.',
          'safety', 'Zajęcia w kamizelkach i kaskach.'
        ),
        'terms', jsonb_build_array(
          jsonb_build_object(
            'label', 'Turnus 1',
            'startDate', '2026-07-06',
            'endDate', '2026-07-10',
            'bookingUrl', 'https://zapisy.example.test/wake-lato-2026-turnus-1',
            'priceOptions', jsonb_build_array(
              jsonb_build_object(
                'label', 'Wariant podstawowy',
                'price', 1200
              )
            )
          )
        )
      ),
      'Wrocław',
      5,
      1200,
      'https://zapisy.example.test/wake-lato-2026-turnus-1',
      'draft'
    ),
    (
      'polkolonie-opublikowane',
      'day_camp',
      'snow',
      'Opublikowane półkolonie snowboardowe',
      'Półkolonie widoczne publicznie',
      'Wystarczająco długi opis opublikowanej półkolonii snowboardowej.',
      jsonb_build_object(
        'paragraphs', jsonb_build_array('Opis półkolonii dla rodziców.'),
        'highlights', jsonb_build_array('Snowboard z instruktorami.'),
        'included', jsonb_build_array('Opieka instruktorów.'),
        'excluded', jsonb_build_array('Dojazd we własnym zakresie.'),
        'dayProgram', jsonb_build_array(jsonb_build_object('time', '09:00–10:00', 'text', 'Rozgrzewka.')),
        'venueDescription', 'Stok z zapleczem dla dzieci.',
        'parentInfo', jsonb_build_object(
          'ageRange', '7–12 lat',
          'supervision', 'Stała opieka instruktorów.',
          'safety', 'Zajęcia w kaskach pod opieką instruktorów.'
        ),
        'terms', jsonb_build_array(
          jsonb_build_object(
            'label', 'Turnus 1',
            'startDate', '2026-02-02',
            'endDate', '2026-02-06',
            'bookingUrl', 'https://zapisy.example.test/snow-zima-2026-turnus-1',
            'priceOptions', jsonb_build_array(
              jsonb_build_object(
                'label', 'Wariant podstawowy',
                'price', 1400
              )
            )
          )
        )
      ),
      'Szczyrk',
      5,
      1400,
      'https://zapisy.example.test/snow-zima-2026-turnus-1',
      'draft'
    );

  select id into day_camp_draft_id
  from public.offers
  where slug = 'polkolonie-szkic';

  select id into day_camp_published_id
  from public.offers
  where slug = 'polkolonie-opublikowane';

  update public.offers
  set description = jsonb_build_object(
    'paragraphs', jsonb_build_array('Kompletny opis opublikowanego wyjazdu.'),
    'highlights', jsonb_build_array('Najważniejszy moment wyjazdu.'),
    'included', jsonb_build_array('Zakwaterowanie.'),
    'excluded', jsonb_build_array('Dojazd.'),
    'schedule', jsonb_build_array(jsonb_build_object('day', 'Dzień 1', 'text', 'Przyjazd.'))
  )
  where id = published_offer_id;

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
  day_camp_published_path := format(
    'offers/%s/%s.jpg',
    day_camp_published_id,
    '20000000-0000-0000-0000-000000000012'
  );

  insert into public.offer_images (offer_id, storage_path, alt_text, position)
  values
    (published_offer_id, published_path, 'Testowe zdjęcie opublikowanej oferty', 0),
    (draft_offer_id, draft_path, 'Testowe zdjęcie szkicu oferty', 0),
    (
      day_camp_published_id,
      day_camp_published_path,
      'Dzieci uczą się jazdy na snowboardzie z instruktorem',
      0
    );

  update public.offers
  set hero_image = published_path,
      status = 'published'
  where id = published_offer_id;

  update public.offers
  set hero_image = day_camp_published_path,
      status = 'published'
  where id = day_camp_published_id;

  insert into storage.objects (bucket_id, name)
  values
    ('offer-images', published_path),
    ('offer-images', draft_path),
    ('offer-images', day_camp_published_path);

  execute 'set local role anon';

  if (select count(*) from public.offers) <> 2 then
    raise exception 'anon must see exactly two published offers';
  end if;

  if exists (select 1 from public.offers where id in (draft_offer_id, archived_offer_id, day_camp_draft_id)) then
    raise exception 'anon must not see draft or archived offers';
  end if;

  if not exists (select 1 from public.offers where id = day_camp_published_id and offer_kind = 'day_camp') then
    raise exception 'anon must see a published day camp';
  end if;

  if (select count(*) from public.offer_images) <> 2 then
    raise exception 'anon must see images from published offers only';
  end if;

  if (select count(*) from storage.objects where bucket_id = 'offer-images') <> 2 then
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
      'https://zapisy.example.test/anon-odmowa'
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

  if (select count(*) from public.offers) <> 2 then
    raise exception 'ordinary authenticated users must see published offers only';
  end if;

  begin
    perform public.reorder_offer_images(published_offer_id, array[]::uuid[]);
    raise exception 'ordinary authenticated users must not reorder offer images';
  exception
    when insufficient_privilege then null;
  end;

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
      'https://zapisy.example.test/odmowa'
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
    'https://zapisy.example.test/zarzadzany'
  )
  returning id into managed_offer_id;

  update public.offers
  set description = jsonb_build_object(
    'paragraphs', jsonb_build_array('Kompletny opis szkicu administratora.'),
    'highlights', jsonb_build_array('Najważniejszy moment wyjazdu.'),
    'included', jsonb_build_array('Zakwaterowanie.'),
    'excluded', jsonb_build_array('Dojazd.'),
    'schedule', jsonb_build_array(jsonb_build_object('day', 'Dzień 1', 'text', 'Przyjazd.'))
  )
  where id = managed_offer_id;

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
      booking_url,
      status
    )
    values (
      'bezposrednio-opublikowana',
      'surf',
      'Nieprawidłowa oferta',
      'Bez obrazu głównego nie wolno publikować',
      'Wystarczająco długi opis nieprawidłowej publikacji administratora.',
      'Peniche',
      6,
      1900,
      'https://zapisy.example.test/bezposrednia-publikacja',
      'published'
    );
    raise exception 'administrator must not insert an offer as published without a hero';
  exception
    when check_violation then null;
  end;

  begin
    update public.offers
    set status = 'published'
    where id = managed_offer_id;
    raise exception 'administrator must not publish without a matching hero image';
  exception
    when check_violation then null;
  end;

  begin
    update public.offers
    set hero_image = draft_path,
        status = 'published'
    where id = managed_offer_id;
    raise exception 'administrator must not publish with another offer image';
  exception
    when check_violation then null;
  end;

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
  managed_jpeg_path := format(
    'offers/%s/%s.jpeg',
    managed_offer_id,
    '20000000-0000-0000-0000-000000000009'
  );
  managed_png_path := format(
    'offers/%s/%s.png',
    managed_offer_id,
    '20000000-0000-0000-0000-000000000010'
  );

  insert into public.offer_images (offer_id, storage_path, alt_text, position)
  values (
    managed_offer_id,
    managed_path,
    'Zdjęcie dodane do oferty przez administratora',
    0
  )
  returning id into managed_image_id;

  insert into public.offer_images (offer_id, storage_path, alt_text, position)
  values (
    managed_offer_id,
    managed_jpeg_path,
    'Surfer wychodzi z wody po porannej sesji',
    1
  )
  returning id into managed_jpeg_image_id;

  insert into public.offer_images (offer_id, storage_path, alt_text, position)
  values (
    managed_offer_id,
    managed_png_path,
    'Deski czekają przed wejściem na plażę',
    2
  )
  returning id into managed_png_image_id;

  update public.offers
  set hero_image = managed_path,
      status = 'published'
  where id = managed_offer_id;

  if not exists (
    select 1
    from public.offers
    where id = managed_offer_id
      and status = 'published'
      and published_at is not null
  ) then
    raise exception 'administrator publication must require a matching hero and set published_at';
  end if;

  perform public.reorder_offer_images(
    managed_offer_id,
    array[managed_png_image_id, managed_image_id, managed_jpeg_image_id]
  );

  if not exists (
    select 1
    from public.offer_images
    where id = managed_png_image_id and position = 0
  ) or not exists (
    select 1
    from public.offer_images
    where id = managed_image_id and position = 1
  ) or not exists (
    select 1
    from public.offer_images
    where id = managed_jpeg_image_id and position = 2
  ) then
    raise exception 'administrator reorder must persist the complete requested order';
  end if;

  begin
    perform public.reorder_offer_images(
      managed_offer_id,
      array[managed_image_id, managed_jpeg_image_id, draft_offer_id]
    );
    raise exception 'reorder must reject an image outside the offer';
  exception
    when invalid_parameter_value then null;
  end;

  if not exists (
    select 1
    from public.offer_images
    where id = managed_png_image_id and position = 0
  ) or not exists (
    select 1
    from public.offer_images
    where id = managed_image_id and position = 1
  ) or not exists (
    select 1
    from public.offer_images
    where id = managed_jpeg_image_id and position = 2
  ) then
    raise exception 'rejected reorder must leave every position unchanged';
  end if;

  insert into storage.objects (bucket_id, name)
  values (
    'offer-images',
    managed_path
  ), (
    'offer-images',
    managed_jpeg_path
  ), (
    'offer-images',
    managed_png_path
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
      format('offers/%s/%s.gif', managed_offer_id, '20000000-0000-0000-0000-000000000008')
    );
    raise exception 'administrator storage path must use an allowed image extension';
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

  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects
  where bucket_id = 'offer-images'
    and name in (managed_path, managed_jpeg_path, managed_png_path);
  get diagnostics affected_rows = row_count;

  if affected_rows <> 3 then
    raise exception 'administrator must delete correctly scoped JPEG, PNG, and WebP objects';
  end if;

  malformed_delete_path := format(
    'offers/%s/not-a-uuid.jpeg',
    managed_offer_id
  );
  out_of_scope_delete_path :=
    'offers/30000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000011.png';

  execute 'set local role none';
  insert into storage.objects (bucket_id, name)
  values
    ('offer-images', malformed_delete_path),
    ('offer-images', out_of_scope_delete_path);
  execute 'set local role authenticated';

  delete from storage.objects
  where bucket_id = 'offer-images'
    and name in (malformed_delete_path, out_of_scope_delete_path);
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'administrator must not delete malformed or out-of-scope objects';
  end if;

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
