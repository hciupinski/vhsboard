-- Run against a disposable/local database; every mutation is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
select is(public.vhs_js_trim(E'\013v\013'), 'v', 'JavaScript trim removes vertical tab but preserves v');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"showRentalLink":true}', 'trip', true), 'rental link can be enabled');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"showRentalLink":false}', 'day_camp', false), 'rental link can be disabled');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"showRentalLink":"true"}', 'trip', false), 'rental link must be boolean');
select ok(public.is_valid_trip_content('{"schemaVersion":2,"showRentalLink":true,"paragraphs":["Opis wyjazdu"],"highlights":["Program"],"included":["Opieka"],"excluded":["Dojazd"],"schedule":[{"day":"Dzień 1","text":"Przyjazd"}]}'), 'trip content accepts rental setting');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"insurance":{"enabled":true,"description":"Opis ubezpieczenia","provider":"","informationUrl":"","packages":[],"extensions":[]}}', 'trip', true), 'insurance requires a package');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"insurance":{"enabled":true,"description":"Opis ubezpieczenia","provider":"","informationUrl":"","packages":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"Pakiet","description":"Opis pakietu","price":{"kind":"included","amount":0,"from":false,"unit":""},"risks":[{"id":"123e4567-e89b-12d3-a456-426614174001","label":"","value":""}]}],"extensions":[]}}', 'trip', true), 'blank insurance coverage row publishes');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"insurance":{"enabled":true,"description":"Opis ubezpieczenia","provider":"","informationUrl":"","packages":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"Pakiet","description":"Opis pakietu","price":{"kind":"included","amount":0,"from":false,"unit":""},"risks":[]}],"extensions":[]}}', 'trip', true), 'insurance package accepts no coverage rows');
select ok(public.is_valid_offer_sections(jsonb_build_object('schemaVersion',2,'insurance',jsonb_build_object('enabled',true,'description','Opis ubezpieczenia','provider','','informationUrl','','packages',jsonb_build_array(jsonb_build_object('id','123e4567-e89b-12d3-a456-426614174000','title','Pakiet','description','Opis pakietu','price',jsonb_build_object('kind','included','amount',0,'from',false,'unit',''),'risks',jsonb_build_array(jsonb_build_object('id','123e4567-e89b-12d3-a456-426614174001','label',E'\t\n','value',E'\t')))),'extensions','[]'::jsonb)), 'trip', true), 'whitespace-only coverage row is blank');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"insurance":{"enabled":true,"description":"Opis ubezpieczenia","provider":"","informationUrl":"","packages":[{"id":"123e4567-e89b-12d3-a456-426614174000","title":"Pakiet","description":"Opis pakietu","price":{"kind":"included","amount":0,"from":false,"unit":""},"risks":[{"id":"123e4567-e89b-12d3-a456-426614174001","label":"Koszty leczenia","value":""}]}],"extensions":[]}}', 'trip', true), 'partial insurance coverage row cannot publish');
select ok(public.is_valid_offer_sections('{"schemaVersion":2}', 'trip', true), 'all optional sections absent');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":false,"description":"","type":"coach","journeys":[]}}', 'trip', true), 'disabled incomplete transport publishes');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"","type":"coach","journeys":[]}}', 'trip', true), 'enabled incomplete transport cannot publish');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"","type":"coach","journeys":[]}}', 'trip', false), 'incomplete enabled transport can be a draft');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Dojazd własny na miejsce.","type":"own","journeys":[]}}', 'trip', true), 'own transport needs no invented dates');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Autokar testowy","type":"coach","journeys":[{"departureDate":"2027-02-30","departureTime":"","departurePlace":"Warszawa","returnDate":"2027-03-05","returnTime":"","returnPlace":"Warszawa","note":""}]}}', 'trip', true), 'invalid calendar date rejected');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Autokar testowy","type":"coach","journeys":[{"departureDate":"2027-03-02","departureTime":"","departurePlace":"Warszawa","returnDate":"2027-03-01","returnTime":"","returnPlace":"Warszawa","note":""}]}}', 'trip', true), 'return before departure rejected');
select ok(not public.is_valid_offer_sections('{"resort":{"enabled":true,"name":"test","description":"test","mapUrl":""}}', 'trip', true), 'new fields require version marker');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"resort":{"enabled":false,"name":"","description":"","mapUrl":""}}', 'trip', true), 'disabled resort retains incomplete fields');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"resort":{"enabled":true,"name":"test","description":"test","mapUrl":"javascript:alert(1)"}}', 'trip', true), 'unsafe URL rejected');
select ok(public.vhs_extra_price('{"kind":"extra","amount":12.34,"from":true,"unit":"osoba"}', true), 'decimal PLN supplement');
select ok(not public.vhs_extra_price('{"kind":"extra","amount":-1,"from":false,"unit":"osoba"}', true), 'negative supplement rejected');
select ok(not public.vhs_extra_price('{"kind":"extra","amount":12.345,"from":false,"unit":"osoba"}', true), 'sub-cent supplement rejected');
select ok(not public.vhs_extra_price('{"kind":"included","amount":50,"from":false,"unit":"osoba"}', true), 'included price cannot conceal a supplement');
select ok(public.is_valid_trip_content('{"schemaVersion":2,"paragraphs":["Opis wyjazdu"],"highlights":["Program"],"included":["Opieka"],"excluded":["Dojazd"],"schedule":[{"day":"Dzień 1","text":"Przyjazd"}],"accommodation":{"enabled":false,"description":""}}'), 'legacy base and disabled accommodation publish without photos');

select ok(public.is_valid_offer_sections('{"schemaVersion":2,"training":{"enabled":true,"description":"Lekcje na każdym poziomie.","items":[]}}', 'trip', true), 'training introduction publishes without cards');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"priceNote":"Dopłaty na miejscu.","transport":{"enabled":true,"description":"Dojazd samodzielny.","types":["own"],"journeys":[]}}', 'trip', true), 'own transport array needs no journey');
select ok(public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Dojazd z VHS.","types":["own","vhs_bus"],"journeys":[]}}', 'trip', false), 'multiple choices are stored in drafts');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Dojazd z VHS.","types":["own","vhs_bus"],"journeys":[]}}', 'trip', true), 'Bus VHS needs a journey even when own is selected');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Dojazd.","types":["own","own"],"journeys":[]}}', 'trip', false), 'duplicate choices rejected in drafts');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Dojazd.","types":["own",null],"journeys":[]}}', 'trip', false), 'malformed choices rejected');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"transport":{"enabled":true,"description":"Dojazd.","types":["own","other"],"journeys":[]}}', 'trip', true), 'custom mode needs a label');
select ok(not public.is_valid_offer_sections('{"schemaVersion":2,"priceNote":1}', 'trip', false), 'price note must be text');
select ok(not public.is_valid_offer_sections(jsonb_build_object('schemaVersion',2,'priceNote',repeat('a',1001)), 'trip', true), 'price note length is bounded');

insert into auth.users(id) values ('90000000-0000-4000-8000-000000000001'),('90000000-0000-4000-8000-000000000002');
insert into public.profiles(id,role) values ('90000000-0000-4000-8000-000000000001','admin'),('90000000-0000-4000-8000-000000000002','editor');
insert into public.offers(id,slug,activity,title,subtitle,short_description,location,duration_days,price_from,booking_url,status,description)
values ('90000000-0000-4000-8000-000000000003','qa-vhs020-local-only','snow','Test oferty','Podtytuł testowy','Opis oferty używanej wyłącznie do testu lokalnego.','Test',7,100,'https://example.test','draft','{"schemaVersion":2,"paragraphs":["Opis wyjazdu"],"highlights":["Program"],"included":["Opieka"],"excluded":["Dojazd"],"schedule":[{"day":"Dzień 1","text":"Przyjazd"}]}');
insert into storage.objects(bucket_id,name) values
('offer-images','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000004.webp'),
('offer-images','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000005.webp'),
('offer-images','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000006.webp'),
('offer-images','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000007.webp');
select throws_ok($$update public.offers set description=description-'schemaVersion' where id='90000000-0000-4000-8000-000000000003'$$, '23514', 'Odśwież CMS przed zapisaniem oferty.', 'old client cannot drop v2 content');
set local role anon;
select is((select count(*)::integer from public.offers where id='90000000-0000-4000-8000-000000000003'),0,'anonymous cannot read draft');
reset role;
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select * from public.replace_offer_resort_map('90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000004.webp','Mapa testowego resortu')$$,'42501','Brak uprawnień do mapy resortu.','non-admin cannot replace map');
reset role;
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select lives_ok($$select * from public.replace_offer_resort_map('90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000004.webp','Mapa testowego resortu')$$,'admin installs first map');
select lives_ok($$select * from public.replace_offer_resort_map('90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000005.webp','Nowa mapa testowego resortu')$$,'admin atomically replaces map');
select is((select count(*)::integer from public.offer_images where offer_id='90000000-0000-4000-8000-000000000003' and category='resort_map'),1,'exactly one active map after replacement');
select throws_ok($$select * from public.replace_offer_resort_map('90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000002/90000000-0000-4000-8000-000000000005.webp','Obca mapa testowa')$$,'22023','Nieprawidłowy obraz mapy.','cannot attach another offer storage path');
insert into public.offer_images(id,offer_id,storage_path,alt_text,category,position) values
('90000000-0000-4000-8000-000000000016','90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000006.webp','Szkolenie na stoku','training_gallery',0),
('90000000-0000-4000-8000-000000000017','90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000007.webp','Ćwiczenia w grupie','training_gallery',1);
select lives_ok($$select public.reorder_offer_images('90000000-0000-4000-8000-000000000003',array['90000000-0000-4000-8000-000000000017','90000000-0000-4000-8000-000000000016']::uuid[],'training_gallery')$$, 'admin reorders training photos');
select is((select position from public.offer_images where id='90000000-0000-4000-8000-000000000017'),0,'training photo moved to first position');
reset role;
set local role anon;
select is((select count(*)::integer from public.offer_images where offer_id='90000000-0000-4000-8000-000000000003'),0,'anonymous cannot read draft map');
reset role;
-- Exercise the real publication trigger as an administrator, not only helpers.
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000001',true);
set local role authenticated;
insert into public.offer_images(offer_id,storage_path,alt_text,category,position) values ('90000000-0000-4000-8000-000000000003','offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000004.webp','Zdjęcie główne testowej oferty','gallery',0);
update public.offers set hero_image='offers/90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-000000000004.webp' where id='90000000-0000-4000-8000-000000000003';
select lives_ok($$update public.offers set description=description || '{"transport":{"enabled":false,"type":"coach","description":"","journeys":[]},"accommodation":{"enabled":false,"description":""}}'::jsonb, status='published' where id='90000000-0000-4000-8000-000000000003'$$, 'v2 publishes with disabled incomplete transport and accommodation without accommodation photos');
select throws_ok($$update public.offers set description=jsonb_set(description,'{transport,enabled}','true') where id='90000000-0000-4000-8000-000000000003'$$,'23514','Opublikowana oferta wymaga kompletnej treści właściwej dla rodzaju.','direct API cannot publish incomplete enabled transport');
select is((select description #>> '{transport,enabled}' from public.offers where id='90000000-0000-4000-8000-000000000003'),'false','failed publication retains previous public data');
reset role;
set local role anon;
select is((select count(*)::integer from public.offer_images where offer_id='90000000-0000-4000-8000-000000000003' and category='resort_map'),1,'anonymous can read the published map');
reset role;
set local role authenticated;
select lives_ok($$update public.offers set description=description || '{"priceNote":"Dopłaty na miejscu.","training":{"enabled":true,"description":"Lekcje na każdym poziomie.","items":[]},"transport":{"enabled":true,"type":"own","description":"Dojazd samodzielny.","journeys":[]}}'::jsonb where id='90000000-0000-4000-8000-000000000003'$$, 'published offer accepts a price note and training without cards');
select lives_ok($$update public.offers set description=jsonb_set(description,'{transport}',((description -> 'transport') - 'type') || '{"types":["own"]}'::jsonb) where id='90000000-0000-4000-8000-000000000003'$$, 'published offer accepts the new transport array');
select throws_ok($$update public.offers set description=description-'priceNote' where id='90000000-0000-4000-8000-000000000003'$$,'23514','Odśwież CMS przed zapisaniem oferty.','stale editor cannot lose price note');
select throws_ok($$update public.offers set description=jsonb_set(description,'{transport}',((description -> 'transport') - 'types') || '{"type":"own"}'::jsonb) where id='90000000-0000-4000-8000-000000000003'$$,'23514','Odśwież CMS przed zapisaniem oferty.','stale editor cannot lose transport choices');
select lives_ok($$update public.offers set description=jsonb_set(description,'{priceNote}','""') where id='90000000-0000-4000-8000-000000000003'$$,'current editor can clear the price note');
reset role;
select * from finish();
rollback;
