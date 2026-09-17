-- OrionHQ Supabase schema
-- Prefix all application data with OrionHQ_ to avoid collisions with other site data in the shared Supabase project.

create extension if not exists pgcrypto;

create table if not exists public."OrionHQ_pages" (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  icon text default '✦',
  kind text not null default 'link' check (kind in ('dashboard', 'link', 'income')),
  parent_id uuid references public."OrionHQ_pages"(id) on delete cascade,
  details jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."OrionHQ_ventures" (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'concept' check (status in ('concept', 'building', 'live', 'maintenance')),
  target_revenue numeric default 0,
  feasibility_score numeric,
  details jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."OrionHQ_venture_items" (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public."OrionHQ_ventures"(id) on delete cascade,
  item_type text not null check (item_type in ('stage', 'checklist', 'note', 'link', 'automation', 'financial')),
  title text not null,
  body jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_complete boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."OrionHQ_settings" (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sidebar_pinned boolean not null default false,
  theme text not null default 'dark',
  dashboard_layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public."OrionHQ_pages" enable row level security;
alter table public."OrionHQ_ventures" enable row level security;
alter table public."OrionHQ_venture_items" enable row level security;
alter table public."OrionHQ_settings" enable row level security;

create policy "OrionHQ pages readable by authenticated users"
on public."OrionHQ_pages"
for select
to authenticated
using (is_published = true or created_by = auth.uid());

create policy "OrionHQ admin can manage pages"
on public."OrionHQ_pages"
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'azzamunza@gmail.com')
with check ((auth.jwt() ->> 'email') = 'azzamunza@gmail.com');

create policy "OrionHQ ventures admin only"
on public."OrionHQ_ventures"
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'azzamunza@gmail.com')
with check ((auth.jwt() ->> 'email') = 'azzamunza@gmail.com');

create policy "OrionHQ venture items admin only"
on public."OrionHQ_venture_items"
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'azzamunza@gmail.com')
with check ((auth.jwt() ->> 'email') = 'azzamunza@gmail.com');

create policy "Users can read own settings"
on public."OrionHQ_settings"
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can upsert own settings"
on public."OrionHQ_settings"
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own settings"
on public."OrionHQ_settings"
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into public."OrionHQ_pages" (slug, title, icon, kind, sort_order)
values
  ('/', 'Dashboard', '⌂', 'dashboard', 0),
  ('/income-engine', 'Income engine', '↗', 'income', 1),
  ('/focus-board', 'Focus board', '◎', 'link', 2)
on conflict (slug) do nothing;
