-- OrionHQ D1 schema (ported from Supabase). Authorization is enforced in functions/api/[[path]].js.
-- Timestamps are ISO-8601 strings; JSON columns are stored as TEXT.

create table if not exists OrionHQ_pages (
  id text primary key default (lower(hex(randomblob(16)))),
  slug text not null unique,
  title text not null,
  icon text default '✦',
  kind text not null default 'link' check (kind in ('dashboard', 'link', 'income')),
  parent_id text references OrionHQ_pages(id) on delete cascade,
  details text not null default '{}',
  sort_order integer not null default 0,
  is_published integer not null default 1,
  created_by text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

create table if not exists OrionHQ_ventures (
  id text primary key default (lower(hex(randomblob(16)))),
  slug text not null unique,
  name text not null,
  status text not null default 'concept' check (status in ('concept', 'building', 'live', 'maintenance')),
  target_revenue real default 0,
  feasibility_score real,
  details text not null default '{}',
  created_by text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

create table if not exists OrionHQ_venture_items (
  id text primary key default (lower(hex(randomblob(16)))),
  venture_id text not null references OrionHQ_ventures(id) on delete cascade,
  item_type text not null check (item_type in ('stage', 'checklist', 'note', 'link', 'automation', 'financial')),
  title text not null,
  body text not null default '{}',
  sort_order integer not null default 0,
  is_complete integer default 0,
  created_by text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

create table if not exists OrionHQ_settings (
  user_id text primary key, -- Google account "sub"
  sidebar_pinned integer not null default 0,
  theme text not null default 'dark',
  dashboard_layout text not null default '[]',
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

insert or ignore into OrionHQ_pages (slug, title, icon, kind, sort_order) values
  ('/', 'Dashboard', '⌂', 'dashboard', 0),
  ('/income-engine', 'Income engine', '↗', 'income', 1),
  ('/focus-board', 'Focus board', '◎', 'link', 2);
