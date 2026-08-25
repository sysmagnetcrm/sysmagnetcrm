-- Migration: Enable Row Level Security and Policies for Vibe CRM
-- Created: 2026-08-23

-- Helper function to fetch normalized current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  u_role text;
  jwt_role text;
BEGIN
  SELECT lower(role) INTO u_role
  FROM public.users
  WHERE id = auth.uid();

  IF u_role IS NOT NULL AND u_role <> '' THEN
    RETURN u_role;
  END IF;

  jwt_role := lower(
    coalesce(
      auth.jwt() -> 'user_metadata' ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role',
      ''
    )
  );

  IF jwt_role IS NOT NULL AND jwt_role <> '' THEN
    RETURN jwt_role;
  END IF;

  IF auth.role() = 'authenticated' THEN
    RETURN 'admin';
  END IF;

  RETURN 'client';
END;
$$;

-- 1. USERS TABLE
alter table public.users enable row level security;

create policy "users_all_authenticated" on public.users
  for all to authenticated using (true) with check (true);

-- 2. LEADS TABLE
alter table public.leads enable row level security;

create policy "leads_all_authenticated" on public.leads
  for all to authenticated using (true) with check (true);

-- 3. CLIENTS TABLE
alter table public.clients enable row level security;

create policy "clients_all_authenticated" on public.clients
  for all to authenticated using (true) with check (true);

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
