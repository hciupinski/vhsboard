create table public.portal_settings (
  id smallint primary key default 1 check (id = 1),
  theme text not null default 'original' check (theme in ('original', 'winter')),
  updated_at timestamptz not null default now()
);

insert into public.portal_settings (id, theme) values (1, 'original');

create trigger portal_settings_set_updated_at
before update on public.portal_settings
for each row execute function public.set_updated_at();

alter table public.portal_settings enable row level security;

revoke all on public.portal_settings from anon, authenticated;
grant select on public.portal_settings to anon, authenticated;
grant update (theme) on public.portal_settings to authenticated;

create policy "portal settings are publicly visible"
on public.portal_settings
for select to anon, authenticated
using (true);

create policy "cms administrators update portal settings"
on public.portal_settings
for update to authenticated
using ((select public.is_cms_admin()))
with check ((select public.is_cms_admin()));
