begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

insert into auth.users (id) values
  ('50000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002');
insert into public.profiles (id, role) values
  ('50000000-0000-0000-0000-000000000001', 'admin'),
  ('50000000-0000-0000-0000-000000000002', 'editor');

set local role anon;
select is((select theme from public.portal_settings where id = 1), 'original', 'anonymous visitors read the default theme');
select throws_ok($$update public.portal_settings set theme = 'winter' where id = 1$$, '42501', null, 'anonymous visitors cannot change the theme');
select throws_ok($$insert into public.portal_settings (id, theme) values (1, 'winter')$$, '42501', null, 'anonymous visitors cannot insert settings');
select throws_ok($$delete from public.portal_settings where id = 1$$, '42501', null, 'anonymous visitors cannot remove settings');
reset role;

set local request.jwt.claim.sub = '50000000-0000-0000-0000-000000000002';
set local role authenticated;
select is((select theme from public.portal_settings where id = 1), 'original', 'non-admin users can read settings');
select results_eq(
  $$with changed as (update public.portal_settings set theme = 'winter' where id = 1 returning theme) select theme from changed$$,
  array[]::text[], 'RLS prevents non-admin updates, even through direct database requests'
);
reset role;

set local request.jwt.claim.sub = '50000000-0000-0000-0000-000000000001';
set local role authenticated;
select results_eq(
  $$with changed as (update public.portal_settings set theme = 'winter' where id = 1 returning theme) select theme from changed$$,
  array['winter']::text[], 'an administrator can publish winter globally'
);
select throws_ok($$update public.portal_settings set theme = 'unknown' where id = 1$$, '23514', null, 'unknown themes are rejected by the database');
select throws_ok($$update public.portal_settings set id = 2 where id = 1$$, '42501', null, 'an administrator cannot move the singleton');
select throws_ok($$insert into public.portal_settings (id, theme) values (1, 'winter')$$, '42501', null, 'an administrator cannot insert another settings row');
select throws_ok($$delete from public.portal_settings where id = 1$$, '42501', null, 'an administrator cannot remove settings');
reset role;

set local role anon;
select is((select theme from public.portal_settings where id = 1), 'winter', 'anonymous visitors see the published winter theme');
reset role;

set local request.jwt.claim.sub = '50000000-0000-0000-0000-000000000001';
set local role authenticated;
select results_eq(
  $$with changed as (update public.portal_settings set theme = 'original' where id = 1 returning theme) select theme from changed$$,
  array['original']::text[], 'an administrator can restore the original theme'
);
reset role;
select is((select count(*)::integer from public.portal_settings), 1, 'settings remain a singleton');

select * from finish();
rollback;
