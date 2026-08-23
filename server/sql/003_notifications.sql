-- Notifications: used for toasts and system messages

create table if not exists public.notifications (
  id bigserial primary key,
  recipient_id uuid not null,
  type text,
  title text,
  message text,
  data text,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient on public.notifications (recipient_id);
create index if not exists idx_notifications_created_at on public.notifications (created_at desc);
