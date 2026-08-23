-- Client Portal Updates: managed by admins, consumed by client dashboard

create table if not exists public.portal_updates (
  id bigserial primary key,
  title text not null,
  message text not null,
  status text not null default 'ongoing', -- ongoing | completed | paused
  audience text not null default 'all',   -- all | specific
  client_id uuid null,                    -- optional specific target
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portal_updates_updated_at on public.portal_updates (updated_at desc);
create index if not exists idx_portal_updates_client on public.portal_updates (client_id);
