-- Settings: simple key-value store for app configuration
-- Used by server for portal popup config and as a general fallback store

create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_settings_key on public.settings (key);
