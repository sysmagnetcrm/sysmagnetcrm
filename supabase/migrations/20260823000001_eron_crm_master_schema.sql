-- Eron-CRM Master Database Schema and RLS Policies
-- Created: 2026-08-23

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ROLES & PERMISSIONS (RBAC)
create table if not exists public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.permissions (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  category text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 2. USER PROFILES & USER ROLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- RBAC HELPER FUNCTIONS
create or replace function public.authorize(user_id uuid, required_permission text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on ur.role_id = rp.role_id
    join public.permissions p on rp.permission_id = p.id
    where ur.user_id = user_id
      and p.name = required_permission
  );
$$;

create or replace function public.has_role(user_id uuid, check_role text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = user_id
      and lower(r.name) = lower(check_role)
  );
$$;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select public.has_role(user_id, 'admin');
$$;

-- 3. ORGANIZATIONS & CLIENTS
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text,
  address text,
  phone text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  contact_person text,
  status text default 'Active',
  service_type text,
  total_amount numeric default 0 check (total_amount >= 0),
  paid_amount numeric default 0 check (paid_amount >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_contacts (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- 4. LEADS & PIPELINE
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  company text,
  status text default 'New',
  priority text default 'Warm',
  source text,
  service_type text,
  external_id text,
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  converted_at timestamptz,
  converted_client_id uuid references public.clients(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lead_activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.lead_assignments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.lead_status_history (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  old_status text,
  new_status text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 5. PROJECTS & TASKS
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  description text,
  status text default 'Active',
  start_date date,
  due_date date,
  budget numeric default 0 check (budget >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member',
  primary key (project_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  priority text default 'Medium',
  status text default 'New',
  due_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.task_attachments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  filename text not null,
  storage_path text not null,
  file_size bigint check (file_size > 0),
  mime_type text,
  created_at timestamptz default now()
);

create table if not exists public.task_status_history (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  old_status text,
  new_status text,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 6. INVOICES & PAYMENTS
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  invoice_number text unique not null,
  issue_date date default current_date,
  due_date date not null,
  subtotal numeric default 0 check (subtotal >= 0),
  tax numeric default 0 check (tax >= 0),
  discount numeric default 0 check (discount >= 0),
  total_amount numeric default 0 check (total_amount >= 0),
  paid_amount numeric default 0 check (paid_amount >= 0),
  status text default 'Unpaid',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric default 1 check (quantity > 0),
  unit_price numeric default 0 check (unit_price >= 0),
  amount numeric default 0 check (amount >= 0)
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete set null,
  client_id uuid references public.clients(id) on delete cascade,
  payment_number text,
  amount numeric not null check (amount > 0),
  payment_date date default current_date,
  payment_method text,
  transaction_id text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.payment_reminders (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  recipient_email text not null,
  sent_at timestamptz default now(),
  status text default 'Sent',
  notes text
);

-- 7. EMPLOYEES, ATTENDANCE & LEAVE
create table if not exists public.employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  employee_number text unique not null,
  full_name text not null,
  email text not null,
  phone text,
  department text,
  position text,
  hire_date date,
  pay_type text default 'monthly',
  base_salary numeric default 0 check (base_salary >= 0),
  hourly_rate numeric default 0 check (hourly_rate >= 0),
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references public.employees(id) on delete cascade,
  attendance_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_lat numeric,
  check_in_lng numeric,
  check_out_lat numeric,
  check_out_lng numeric,
  check_in_accuracy numeric,
  check_out_accuracy numeric,
  hours_worked numeric default 0 check (hours_worked >= 0),
  overtime_hours numeric default 0 check (overtime_hours >= 0),
  status text default 'Present',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, attendance_date)
);

create table if not exists public.leave_requests (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references public.employees(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'Pending',
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. PAYROLL
create table if not exists public.payroll_cycles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  start_date date not null,
  end_date date not null,
  status text default 'Draft',
  processed_at timestamptz,
  processed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.payroll_records (
  id uuid primary key default uuid_generate_v4(),
  cycle_id uuid references public.payroll_cycles(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  base_pay numeric default 0 check (base_pay >= 0),
  overtime_pay numeric default 0 check (overtime_pay >= 0),
  bonuses numeric default 0 check (bonuses >= 0),
  deductions numeric default 0 check (deductions >= 0),
  net_pay numeric default 0 check (net_pay >= 0),
  status text default 'Draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (cycle_id, employee_id)
);

create table if not exists public.payroll_adjustments (
  id uuid primary key default uuid_generate_v4(),
  record_id uuid references public.payroll_records(id) on delete cascade,
  type text not null,
  amount numeric not null,
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.payroll_bonuses (
  id uuid primary key default uuid_generate_v4(),
  record_id uuid references public.payroll_records(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz default now()
);

create table if not exists public.payroll_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  record_id uuid references public.payroll_records(id) on delete set null,
  action text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  details jsonb,
  created_at timestamptz default now()
);

-- 9. TICKETS, NOTIFICATIONS & ACTIVITIES
create table if not exists public.tickets (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  subject text not null,
  description text,
  priority text default 'Medium',
  status text default 'Open',
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  message text not null,
  attachments jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  title text not null,
  details text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- 10. CLIENT PORTAL & SETTINGS
create table if not exists public.portal_announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  target_client_id uuid references public.clients(id) on delete set null,
  published_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.portal_files (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_size bigint check (file_size > 0),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.portal_tasks (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  status text default 'New',
  due_date date,
  created_at timestamptz default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_leads_assigned on public.leads(assigned_to);
create index if not exists idx_clients_org on public.clients(organization_id);
create index if not exists idx_clients_user on public.clients(user_id);
create index if not exists idx_tasks_client on public.tasks(client_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_payments_client on public.payments(client_id);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_attendance_emp_date on public.attendance(employee_id, attendance_date);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);

-- ROW LEVEL SECURITY (RLS) POLICIES FOR ALL TABLES

alter table public.roles enable row level security;
create policy "roles_read" on public.roles for select using (auth.role() = 'authenticated');
create policy "roles_admin" on public.roles for all using (public.is_admin(auth.uid()));

alter table public.permissions enable row level security;
create policy "permissions_read" on public.permissions for select using (auth.role() = 'authenticated');

alter table public.role_permissions enable row level security;
create policy "role_permissions_read" on public.role_permissions for select using (auth.role() = 'authenticated');

alter table public.profiles enable row level security;
create policy "profiles_read_all" on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_self_or_admin" on public.profiles for update using (auth.uid() = id or public.is_admin(auth.uid()));

alter table public.user_roles enable row level security;
create policy "user_roles_read" on public.user_roles for select using (auth.role() = 'authenticated');
create policy "user_roles_admin" on public.user_roles for all using (public.is_admin(auth.uid()));

alter table public.organizations enable row level security;
create policy "organizations_staff" on public.organizations for all using (public.authorize(auth.uid(), 'clients.read') or public.is_admin(auth.uid()));

alter table public.clients enable row level security;
create policy "clients_staff_read" on public.clients for select using (
  public.authorize(auth.uid(), 'clients.read') or public.is_admin(auth.uid()) or user_id = auth.uid()
);
create policy "clients_staff_write" on public.clients for insert with check (public.authorize(auth.uid(), 'clients.create') or public.is_admin(auth.uid()));
create policy "clients_staff_update" on public.clients for update using (public.authorize(auth.uid(), 'clients.update') or public.is_admin(auth.uid()));
create policy "clients_staff_delete" on public.clients for delete using (public.authorize(auth.uid(), 'clients.delete') or public.is_admin(auth.uid()));

alter table public.leads enable row level security;
create policy "leads_staff_read" on public.leads for select using (public.authorize(auth.uid(), 'leads.read') or public.is_admin(auth.uid()));
create policy "leads_staff_create" on public.leads for insert with check (public.authorize(auth.uid(), 'leads.create') or public.is_admin(auth.uid()));
create policy "leads_staff_update" on public.leads for update using (public.authorize(auth.uid(), 'leads.update') or public.is_admin(auth.uid()));
create policy "leads_staff_delete" on public.leads for delete using (public.authorize(auth.uid(), 'leads.delete') or public.is_admin(auth.uid()));

alter table public.tasks enable row level security;
create policy "tasks_read" on public.tasks for select using (
  public.authorize(auth.uid(), 'tasks.read') or public.is_admin(auth.uid()) or assigned_to = auth.uid() or created_by = auth.uid()
);
create policy "tasks_write" on public.tasks for insert with check (
  public.authorize(auth.uid(), 'tasks.create') or public.is_admin(auth.uid()) or created_by = auth.uid()
);
create policy "tasks_update" on public.tasks for update using (
  public.authorize(auth.uid(), 'tasks.update') or public.is_admin(auth.uid()) or assigned_to = auth.uid() or created_by = auth.uid()
);

alter table public.invoices enable row level security;
create policy "invoices_read" on public.invoices for select using (
  public.authorize(auth.uid(), 'payments.read') or public.is_admin(auth.uid())
  or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
);

alter table public.payments enable row level security;
create policy "payments_read" on public.payments for select using (
  public.authorize(auth.uid(), 'payments.read') or public.is_admin(auth.uid())
  or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
);
create policy "payments_write" on public.payments for insert with check (public.authorize(auth.uid(), 'payments.create') or public.is_admin(auth.uid()));

alter table public.employees enable row level security;
create policy "employees_staff" on public.employees for all using (public.authorize(auth.uid(), 'users.read') or public.is_admin(auth.uid()));

alter table public.attendance enable row level security;
create policy "attendance_read" on public.attendance for select using (
  public.authorize(auth.uid(), 'users.read') or public.is_admin(auth.uid())
  or exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
);
create policy "attendance_write" on public.attendance for insert with check (
  public.authorize(auth.uid(), 'users.create') or public.is_admin(auth.uid())
  or exists (select 1 from public.employees e where e.id = employee_id and e.user_id = auth.uid())
);

alter table public.payroll_cycles enable row level security;
create policy "payroll_admin" on public.payroll_cycles for all using (public.authorize(auth.uid(), 'payroll.read') or public.is_admin(auth.uid()));

alter table public.payroll_records enable row level security;
create policy "payroll_records_admin" on public.payroll_records for all using (public.authorize(auth.uid(), 'payroll.read') or public.is_admin(auth.uid()));

alter table public.notifications enable row level security;
create policy "notifications_read" on public.notifications for select using (recipient_id = auth.uid() or public.is_admin(auth.uid()));
create policy "notifications_update" on public.notifications for update using (recipient_id = auth.uid() or public.is_admin(auth.uid()));

alter table public.activities enable row level security;
create policy "activities_read" on public.activities for select using (auth.role() = 'authenticated');
create policy "activities_insert" on public.activities for insert with check (auth.role() = 'authenticated');

alter table public.audit_logs enable row level security;
create policy "audit_logs_read" on public.audit_logs for select using (public.authorize(auth.uid(), 'audit_logs.read') or public.is_admin(auth.uid()));

alter table public.settings enable row level security;
create policy "settings_read" on public.settings for select using (auth.role() = 'authenticated');
create policy "settings_admin" on public.settings for all using (public.is_admin(auth.uid()));
