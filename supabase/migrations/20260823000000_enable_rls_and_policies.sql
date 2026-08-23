-- Migration: Enable Row Level Security and Policies for Vibe CRM
-- Created: 2026-08-23

-- Helper function to fetch normalized current user role
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
as $$
  select lower(coalesce(role, 'client')) from public.users where id = auth.uid();
$$;

-- 1. USERS TABLE
alter table public.users enable row level security;

create policy "users_select_all_authenticated" on public.users
  for select using (auth.role() = 'authenticated');

create policy "users_insert_admin_or_self" on public.users
  for insert with check (auth.uid() = id or public.current_user_role() = 'admin');

create policy "users_update_admin_or_self" on public.users
  for update using (auth.uid() = id or public.current_user_role() = 'admin');

create policy "users_delete_admin" on public.users
  for delete using (public.current_user_role() = 'admin');

-- 2. LEADS TABLE
alter table public.leads enable row level security;

create policy "leads_select_staff" on public.leads
  for select using (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

create policy "leads_insert_staff" on public.leads
  for insert with check (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

create policy "leads_update_staff" on public.leads
  for update using (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

create policy "leads_delete_staff" on public.leads
  for delete using (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

-- 3. CLIENTS TABLE
alter table public.clients enable row level security;

create policy "clients_select_staff" on public.clients
  for select using (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

create policy "clients_insert_staff" on public.clients
  for insert with check (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

create policy "clients_update_staff" on public.clients
  for update using (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

create policy "clients_delete_staff" on public.clients
  for delete using (public.current_user_role() in ('admin', 'sales', 'digital_marketer'));

-- 4. PAYMENTS TABLE
alter table public.payments enable row level security;

create policy "payments_select_sales_admin" on public.payments
  for select using (public.current_user_role() in ('admin', 'sales'));

create policy "payments_insert_sales_admin" on public.payments
  for insert with check (public.current_user_role() in ('admin', 'sales'));

create policy "payments_update_sales_admin" on public.payments
  for update using (public.current_user_role() in ('admin', 'sales'));

create policy "payments_delete_sales_admin" on public.payments
  for delete using (public.current_user_role() in ('admin', 'sales'));

-- 5. CANDIDATES TABLE
alter table public.candidates enable row level security;

create policy "candidates_all_hr_admin" on public.candidates
  for all using (public.current_user_role() in ('admin', 'hr'));

-- 6. EMPLOYEES TABLE
alter table public.employees enable row level security;

create policy "employees_all_hr_admin" on public.employees
  for all using (public.current_user_role() in ('admin', 'hr'));

-- 7. ATTENDANCE TABLE
alter table public.attendance enable row level security;

create policy "attendance_all_hr_admin" on public.attendance
  for all using (public.current_user_role() in ('admin', 'hr'));

-- 8. TASKS TABLE
alter table public.tasks enable row level security;

create policy "tasks_select_staff" on public.tasks
  for select using (public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer', 'hr'));

create policy "tasks_insert_staff" on public.tasks
  for insert with check (public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer', 'hr'));

create policy "tasks_update_staff" on public.tasks
  for update using (public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer', 'hr'));

create policy "tasks_delete_staff" on public.tasks
  for delete using (public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer', 'hr'));

-- 9. CLIENT_TASKS TABLE
alter table public.client_tasks enable row level security;

create policy "client_tasks_select" on public.client_tasks
  for select using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  );

create policy "client_tasks_insert" on public.client_tasks
  for insert with check (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or created_by = auth.uid()
  );

create policy "client_tasks_update" on public.client_tasks
  for update using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  );

create policy "client_tasks_delete" on public.client_tasks
  for delete using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or created_by = auth.uid()
  );

-- 10. CLIENT_TASK_LOGS TABLE
alter table public.client_task_logs enable row level security;

create policy "client_task_logs_select" on public.client_task_logs
  for select using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or exists (
      select 1 from public.client_tasks t
      where t.id = task_id and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

create policy "client_task_logs_insert" on public.client_task_logs
  for insert with check (actor_id = auth.uid());

create policy "client_task_logs_update" on public.client_task_logs
  for update using (actor_id = auth.uid() or public.current_user_role() = 'admin');

create policy "client_task_logs_delete" on public.client_task_logs
  for delete using (actor_id = auth.uid() or public.current_user_role() = 'admin');

-- 11. CLIENT_ATTACHMENTS TABLE
alter table public.client_attachments enable row level security;

create policy "client_attachments_select" on public.client_attachments
  for select using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or exists (
      select 1 from public.client_tasks t
      where t.id = task_id and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

create policy "client_attachments_insert" on public.client_attachments
  for insert with check (uploaded_by = auth.uid());

create policy "client_attachments_delete" on public.client_attachments
  for delete using (uploaded_by = auth.uid() or public.current_user_role() = 'admin');

-- 12. CLIENT_TASK_ASSIGNMENTS TABLE
alter table public.client_task_assignments enable row level security;

create policy "client_task_assignments_select" on public.client_task_assignments
  for select using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer')
    or assigned_to = auth.uid()
  );

create policy "client_task_assignments_all_staff" on public.client_task_assignments
  for all using (public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer'));

-- 13. NOTIFICATIONS TABLE
alter table public.notifications enable row level security;

create policy "notifications_select_recipient" on public.notifications
  for select using (recipient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "notifications_insert_authenticated" on public.notifications
  for insert with check (auth.role() = 'authenticated');

create policy "notifications_update_recipient" on public.notifications
  for update using (recipient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "notifications_delete_recipient" on public.notifications
  for delete using (recipient_id = auth.uid() or public.current_user_role() = 'admin');

-- 14. ACTIVITIES TABLE
alter table public.activities enable row level security;

create policy "activities_select_staff" on public.activities
  for select using (
    public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer', 'hr')
    or user_id = auth.uid()
  );

create policy "activities_insert_authenticated" on public.activities
  for insert with check (auth.role() = 'authenticated');

create policy "activities_delete_admin" on public.activities
  for delete using (public.current_user_role() = 'admin');

-- 15. SETTINGS TABLE
alter table public.settings enable row level security;

create policy "settings_select_staff" on public.settings
  for select using (public.current_user_role() in ('admin', 'sales', 'digital_marketer', 'developer', 'hr'));

create policy "settings_all_admin" on public.settings
  for all using (public.current_user_role() = 'admin');
