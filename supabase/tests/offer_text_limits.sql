begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();
select ok(public.vhs_section_text('{"x":"a"}'::jsonb, 'x', 120, true), 'required section accepts one character');
select ok(not public.vhs_section_text(jsonb_build_object('x', E' \t\n'), 'x', 120, true), 'required section rejects whitespace');
select ok(public.is_valid_accommodation_content(jsonb_build_object('description', repeat('a', 5000))), 'accommodation accepts 5000 characters');
select ok(not public.is_valid_accommodation_content(jsonb_build_object('description', repeat('a', 5001))), 'accommodation rejects 5001 characters');
select ok(public.is_valid_offer_sections(jsonb_build_object('schemaVersion', 2, 'priceNote', repeat('a', 5000)), 'trip', false), 'draft price note accepts 5000 characters');
select ok(not public.is_valid_offer_sections(jsonb_build_object('schemaVersion', 2, 'priceNote', repeat('a', 5001)), 'trip', false), 'draft price note rejects 5001 characters');
select ok(public.is_valid_offer_sections(jsonb_build_object('schemaVersion', 2, 'resort', jsonb_build_object('enabled', true, 'name', 'a', 'description', 'a', 'mapUrl', '')), 'trip', true), 'published section accepts one character');
select ok(not public.is_valid_offer_sections(jsonb_build_object('schemaVersion', 2, 'resort', jsonb_build_object('enabled', true, 'name', E'\t', 'description', 'a', 'mapUrl', '')), 'trip', true), 'published section rejects whitespace name');

select ok(public.is_valid_offer_sections(jsonb_build_object('schemaVersion',2,'priceNote',repeat('😀',2500)), 'trip', false), '2500 astral characters fit 5000 UTF-16 units');
select ok(not public.is_valid_offer_sections(jsonb_build_object('schemaVersion',2,'priceNote',repeat('😀',2501)), 'trip', false), '2501 astral characters exceed 5000 UTF-16 units');
select ok(not public.is_nonempty_json_text(to_jsonb(E'\t\n'::text)), 'published nested text rejects whitespace');
-- Check each editable long section field at both boundaries using real section validation.
create temporary table text_section_fixtures(name, content, path) on commit drop as values
 ('accommodation', '{"schemaVersion":2,"accommodation":{"enabled":true,"description":"x"}}'::jsonb, '{accommodation,description}'::text[]),
 ('resort', '{"schemaVersion":2,"resort":{"enabled":true,"name":"x","description":"x","mapUrl":""}}'::jsonb, '{resort,description}'::text[]),
 ('training', '{"schemaVersion":2,"training":{"enabled":true,"description":"x","items":[]}}'::jsonb, '{training,description}'::text[]),
 ('training card description', '{"schemaVersion":2,"training":{"enabled":true,"description":"x","items":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"x","description":"x","price":{"kind":"included","amount":0,"from":false,"unit":""},"level":"","scope":""}]}}'::jsonb, '{training,items,0,description}'::text[]),
 ('training scope', '{"schemaVersion":2,"training":{"enabled":true,"description":"x","items":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"x","description":"x","price":{"kind":"included","amount":0,"from":false,"unit":""},"level":"","scope":""}]}}'::jsonb, '{training,items,0,scope}'::text[]),
 ('transport', '{"schemaVersion":2,"transport":{"enabled":true,"type":"own","description":"x","journeys":[]}}'::jsonb, '{transport,description}'::text[]),
 ('journey note', '{"schemaVersion":2,"transport":{"enabled":true,"type":"own","description":"x","journeys":[{"departureDate":"","departureTime":"","departurePlace":"","returnDate":"","returnTime":"","returnPlace":"","note":""}]}}'::jsonb, '{transport,journeys,0,note}'::text[]),
 ('insurance', '{"schemaVersion":2,"insurance":{"enabled":true,"description":"x","provider":"","informationUrl":"","packages":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"x","description":"x","price":{"kind":"included","amount":0,"from":false,"unit":""},"risks":[]}],"extensions":[]}}'::jsonb, '{insurance,description}'::text[]),
 ('insurance package', '{"schemaVersion":2,"insurance":{"enabled":true,"description":"x","provider":"","informationUrl":"","packages":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"x","description":"x","price":{"kind":"included","amount":0,"from":false,"unit":""},"risks":[]}],"extensions":[]}}'::jsonb, '{insurance,packages,0,description}'::text[]),
 ('insurance extension', '{"schemaVersion":2,"insurance":{"enabled":true,"description":"x","provider":"","informationUrl":"","packages":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"x","description":"x","price":{"kind":"included","amount":0,"from":false,"unit":""},"risks":[]}],"extensions":[{"id":"123e4567-e89b-12d3-a456-426614174001","title":"x","description":"x","price":{"kind":"included","amount":0,"from":false,"unit":""}}]}}'::jsonb, '{insurance,extensions,0,description}'::text[]);
select ok(public.is_valid_offer_sections(jsonb_set(content,path,to_jsonb(repeat('a',5000))),'trip',true),name || ' accepts 5000 on publication'),
 ok(not public.is_valid_offer_sections(jsonb_set(content,path,to_jsonb(repeat('a',5001))),'trip',false),name || ' rejects 5001 in draft') from text_section_fixtures;

-- Exercise column checks, hero publication and paragraph compatibility through real writes.
insert into public.offers(id,slug,activity,title,subtitle,short_description,location,duration_days,price_from,booking_url,status,description)
values ('91000000-0000-4000-8000-000000000001','qa-text-limits','snow','a','b','c','d',7,100,'https://example.test','draft',
'{"paragraphs":["a"],"highlights":["a"],"included":["a"],"excluded":["a"],"schedule":[{"day":"a","text":"a"}]}');
select throws_ok($$update public.offers set title=E' \t' where id='91000000-0000-4000-8000-000000000001'$$,'23514',null,'required offer text rejects whitespace');
select throws_ok($$update public.offers set description=jsonb_set(description,'{paragraphs}',jsonb_build_array(repeat('a',5001))) where id='91000000-0000-4000-8000-000000000001'$$,'23514','Opis przekracza dopuszczalną długość.','new overlong paragraph rejected');
select lives_ok($$update public.offers set description=jsonb_set(description,'{paragraphs}',jsonb_build_array(repeat('a',5000))) where id='91000000-0000-4000-8000-000000000001'$$,'5000 character paragraph accepted');
insert into storage.objects(bucket_id,name) values ('offer-images','offers/91000000-0000-4000-8000-000000000001/91000000-0000-4000-8000-000000000002.webp');
insert into public.offer_images(offer_id,storage_path,alt_text,category,position) values ('91000000-0000-4000-8000-000000000001','offers/91000000-0000-4000-8000-000000000001/91000000-0000-4000-8000-000000000002.webp','a','gallery',0);
select throws_ok($$update public.offer_images set alt_text=E' \t' where offer_id='91000000-0000-4000-8000-000000000001'$$,'23514',null,'alt rejects whitespace');
select lives_ok($$update public.offers set hero_image='offers/91000000-0000-4000-8000-000000000001/91000000-0000-4000-8000-000000000002.webp',status='published' where id='91000000-0000-4000-8000-000000000001'$$,'one character hero alt permits publication');
insert into storage.objects(bucket_id,name) values ('offer-images','offers/91000000-0000-4000-8000-000000000001/91000000-0000-4000-8000-000000000005.webp');
insert into public.offer_images(offer_id,storage_path,alt_text,category,position) values ('91000000-0000-4000-8000-000000000001','offers/91000000-0000-4000-8000-000000000001/91000000-0000-4000-8000-000000000005.webp','a','accommodation',0);
select lives_ok(format('update public.offers set description=(description - array[''accommodation'',''resort'',''training'',''transport'',''insurance'']) || %L::jsonb where id=%L', jsonb_set(content,path,to_jsonb(repeat('a',5000))), '91000000-0000-4000-8000-000000000001'),name || ' accepts 5000 on published write') from text_section_fixtures;
update public.offers set status='draft' where id='91000000-0000-4000-8000-000000000001';
select throws_ok(format('update public.offers set description=(description - array[''accommodation'',''resort'',''training'',''transport'',''insurance'']) || %L::jsonb where id=%L',jsonb_set(content,path,to_jsonb(repeat('a',5001))), '91000000-0000-4000-8000-000000000001'),'23514','Nieprawidłowa struktura sekcji oferty.',name || ' rejects 5001 on draft write') from text_section_fixtures;
update public.offers set description=description - array['accommodation','resort','training','transport','insurance'],status='published' where id='91000000-0000-4000-8000-000000000001';

insert into public.offers(id,slug,offer_kind,activity,title,subtitle,short_description,location,duration_days,price_from,booking_url,status,description)
values ('91000000-0000-4000-8000-000000000003','qa-camp-text','day_camp','snow','a','b','c','d',5,100,'https://example.test','draft',
'{"paragraphs":["a"],"highlights":["a"],"included":["a"],"excluded":["a"],"dayProgram":[{"time":"09:00","text":"a"}],"venueDescription":"a","parentInfo":{"ageRange":"a","supervision":"a","safety":"a","transport":"a","meals":"a"},"terms":[{"label":"a","startDate":"2027-02-01","endDate":"2027-02-05","bookingUrl":"https://example.test","priceOptions":[{"label":"a","price":100}]}]}');
insert into storage.objects(bucket_id,name) values ('offer-images','offers/91000000-0000-4000-8000-000000000003/91000000-0000-4000-8000-000000000004.webp');
insert into public.offer_images(offer_id,storage_path,alt_text,category,position) values ('91000000-0000-4000-8000-000000000003','offers/91000000-0000-4000-8000-000000000003/91000000-0000-4000-8000-000000000004.webp','a','gallery',0);
select lives_ok($$update public.offers set hero_image='offers/91000000-0000-4000-8000-000000000003/91000000-0000-4000-8000-000000000004.webp',status='published' where id='91000000-0000-4000-8000-000000000003'$$,'camp fixture publishes');
select lives_ok(format('update public.offers set description=jsonb_set(description,%L::text[],to_jsonb(repeat(''a'',5000))) where id=%L', path, '91000000-0000-4000-8000-000000000003'),name || ' accepts 5000 on published write')
from (values ('{dayProgram,0,text}','day program'),('{venueDescription}','venue'),('{parentInfo,supervision}','supervision'),('{parentInfo,safety}','safety'),('{parentInfo,transport}','parent transport'),('{parentInfo,meals}','meals')) f(path,name);
update public.offers set status='draft' where id='91000000-0000-4000-8000-000000000003';
select throws_ok(format('update public.offers set description=jsonb_set(description,%L::text[],to_jsonb(repeat(''a'',5001))) where id=%L', path, '91000000-0000-4000-8000-000000000003'),'23514','Opis przekracza dopuszczalną długość.',name || ' rejects 5001 on draft write')
from (values ('{dayProgram,0,text}','day program'),('{venueDescription}','venue'),('{parentInfo,supervision}','supervision'),('{parentInfo,safety}','safety'),('{parentInfo,transport}','parent transport'),('{parentInfo,meals}','meals')) f(path,name);

-- Legacy draft content has no schemaVersion or enabled flag.
select lives_ok($$update public.offers set description=jsonb_build_object('accommodation',jsonb_build_object('description',repeat('a',5000))) where id='91000000-0000-4000-8000-000000000003'$$,'legacy draft accommodation accepts 5000');
select throws_ok($$update public.offers set description=jsonb_build_object('accommodation',jsonb_build_object('description',repeat('a',5001))) where id='91000000-0000-4000-8000-000000000003'$$,'23514','Opis przekracza dopuszczalną długość.','legacy draft accommodation rejects 5001');
select lives_ok($$update public.offers set description='{"accommodation":{}}' where id='91000000-0000-4000-8000-000000000003'$$,'incomplete legacy accommodation remains a valid draft');

-- Simulate pre-migration data without changing the database's existing rows.
alter table public.offers disable trigger user;
update public.offers set description=jsonb_set(description,'{paragraphs}',jsonb_build_array(repeat('a',5001))) where id='91000000-0000-4000-8000-000000000001';
alter table public.offers enable trigger user;
select lives_ok($$update public.offers set description=jsonb_set(description,'{paragraphs}',jsonb_build_array('  ' || repeat('a',5001) || '  ')) where id='91000000-0000-4000-8000-000000000001'$$,'legacy paragraph normalization permits whitespace-only changes');
select lives_ok($$update public.offers set title='z' where id='91000000-0000-4000-8000-000000000001'$$,'legacy overlong paragraph permits unrelated update');
set local role anon;
select is((select count(*)::integer from public.offers where id='91000000-0000-4000-8000-000000000001'),1,'legacy published offer remains publicly readable');
reset role;
select throws_ok($$update public.offers set description=jsonb_set(description,'{paragraphs}',jsonb_build_array(repeat('a',5001),'new')) where id='91000000-0000-4000-8000-000000000001'$$,'23514','Opis przekracza dopuszczalną długość.','edited paragraph array enforces limit');

select * from finish();
rollback;
