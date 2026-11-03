-- Run in a transaction against a disposable/local database.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id) values ('91000000-0000-4000-8000-000000000001');
insert into public.profiles(id, role) values ('91000000-0000-4000-8000-000000000001', 'admin');
insert into public.offers(id,slug,activity,title,subtitle,short_description,location,duration_days,price_from,booking_url,status,description)
values ('91000000-0000-4000-8000-000000000002','qa-story-images','snow','Test oferty','Podtytuł','Opis testowej oferty dla zdjęć.','Góry',7,100,'https://example.test','draft','{"paragraphs":[],"highlights":[],"included":[],"excluded":[],"schedule":[]}');
insert into public.offer_images(id,offer_id,storage_path,alt_text,category,position)
select ('92000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  '91000000-0000-4000-8000-000000000002', 'qa-story-' || n, 'Zdjęcie testowe', 'gallery', n
from generate_series(1,4) n;
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select lives_ok($$update public.offer_images set show_in_story=true where offer_id='91000000-0000-4000-8000-000000000002' and position <= 3$$, 'administrator selects three gallery photos');
select throws_ok($$update public.offer_images set show_in_story=true where offer_id='91000000-0000-4000-8000-000000000002' and position=4$$, '23514', 'Można wybrać maksymalnie trzy zdjęcia przy opisie.', 'fourth selection is rejected');
select lives_ok($$update public.offer_images set show_in_story=false where offer_id='91000000-0000-4000-8000-000000000002' and position=1$$, 'deselect a photo');
select lives_ok($$update public.offer_images set show_in_story=true where offer_id='91000000-0000-4000-8000-000000000002' and position=4$$, 'select another photo after deselection');
select is((select count(*)::integer from public.offer_images where offer_id='91000000-0000-4000-8000-000000000002' and show_in_story), 3, 'three selected images remain');
reset role;
select * from finish();
rollback;
