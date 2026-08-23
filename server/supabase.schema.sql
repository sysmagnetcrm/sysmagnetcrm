-- Supabase initial schema for Vibe CRM
-- Minimal columns required by server/server.supabase.js
-- Apply in Supabase SQL editor or via migration tooling.

-- NOTE: Enable RLS per table after verifying API behavior.
-- For admin-service operations from the backend, the service role bypasses RLS.

-- Users profile table (linked to auth.users.id)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  role text default 'client',
  created_at timestamp with time zone default now()
);

-- Leads
create table if not exists public.leads (
  id bigserial primary key,
  name text,
  email text,
  phone text,
  status text default 'New',
  priority text default 'Warm',
  source text,
  service text,
  external_id text,
  tags jsonb,
  assigned_to uuid,
  created_at timestamp with time zone default now()
);

-- Clients
create table if not exists public.clients (
  id bigserial primary key,
  name text,
  contact text,
  phone text,
  email text,
  status text,
  source text,
  notes text,
  "serviceType" text,
  due_date date,
  workStatus text,
  totalAmount numeric,
  paidAmount numeric,
  created_by uuid,
  created_at timestamp with time zone default now()
);

-- Payments
create table if not exists public.payments (
  id bigserial primary key,
  client_id bigint references public.clients (id) on delete set null,
  invoice_no text,
  amount numeric,
  paid_amount numeric,
  payment_date date,
  payment_status text,
  created_at timestamp with time zone default now()
);

-- Candidates (HR stubs)
create table if not exists public.candidates (
  id bigserial primary key,
  name text,
  position text,
  status text,
  created_at timestamp with time zone default now()
);

-- Employees (optional used by some routes)
create table if not exists public.employees (
  id bigserial primary key,
  name text,
  email text,
  department text,
  position text,
  status text default 'active',
  employee_id text,
  hire_date date,
  pay_type text default 'fixed',
  base_salary numeric,
  hourly_rate numeric,
  created_at timestamp with time zone default now()
);

-- Attendance (optional)
create table if not exists public.attendance (
  id bigserial primary key,
  employee_id bigint references public.employees (id) on delete cascade,
  date date,
  status text,
  hours numeric,
  created_at timestamp with time zone default now()
);

-- Tasks (referenced in dashboard summary)
create table if not exists public.tasks (
  id bigserial primary key,
  title text,
  due_date date,
  status text,
  created_by uuid,
  created_at timestamp with time zone default now()
);

-- Notifications
create table if not exists public.notifications (
  id bigserial primary key,
  recipient_id uuid,
  type text,
  title text,
  message text,
  data text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Activities
create table if not exists public.activities (
  id bigserial primary key,
  type text,
  message text,
  metadata text,
  user_id uuid,
  created_at timestamp with time zone default now()
);

-- Settings (key/value as text)
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamp with time zone default now()
);

-- Client tasks feature (lightweight supabase version)
create table if not exists public.client_tasks (
  id bigserial primary key,
  client_id uuid,
  created_by uuid,
  title text not null,
  description text,
  required_roles text,
  priority text,
  status text default 'New',
  due_date date,
  assigned_to uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.client_task_logs (
  id bigserial primary key,
  task_id bigint references public.client_tasks (id) on delete cascade,
  actor_id uuid,
  actor_role text,
  message text,
  attachments text,
  time_spent_mins int,
  created_at timestamp with time zone default now()
);

create table if not exists public.client_attachments (
  id bigserial primary key,
  task_id bigint references public.client_tasks (id) on delete cascade,
  uploaded_by uuid,
  filename text,
  storage_path text,
  version int,
  created_at timestamp with time zone default now()
);

create table if not exists public.client_task_assignments (
  id bigserial primary key,
  task_id bigint references public.client_tasks (id) on delete cascade,
  assigned_by uuid,
  assigned_to uuid,
  method text,
  created_at timestamp with time zone default now()
);

-- Indexes (basic)
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_priority on public.leads (priority);
create index if not exists idx_clients_email on public.clients (email);
create index if not exists idx_payments_client on public.payments (client_id);
create index if not exists idx_notifications_recipient on public.notifications (recipient_id);
create index if not exists idx_ctasks_assigned_to on public.client_tasks (assigned_to);

-- RLS suggestions (adjust to your needs)
-- alter table public.users enable row level security;
-- create policy "users self read" on public.users for select using (auth.uid() = id);
-- create policy "admin full" on public.users for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Repeat similar patterns per table if you intend to expose direct Supabase access from the client.
-- If all access goes through the backend with service role, you can delay RLS design.
