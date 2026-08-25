-- Migration: Enable Row Level Security and Policies for Vibe CRM (Idempotent)
-- Created: 2026-08-23
-- Updated: 2026-08-25 (Added DROP POLICY IF EXISTS before all policy creations for full idempotency)

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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_all_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin_or_self" ON public.users;
DROP POLICY IF EXISTS "users_update_admin_or_self" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_all_authenticated" ON public.users;

CREATE POLICY "users_all_authenticated" ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. LEADS TABLE
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select_staff" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_staff" ON public.leads;
DROP POLICY IF EXISTS "leads_update_staff" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_staff" ON public.leads;
DROP POLICY IF EXISTS "leads_all_authenticated" ON public.leads;

CREATE POLICY "leads_all_authenticated" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. CLIENTS TABLE
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_read" ON public.clients;
DROP POLICY IF EXISTS "clients_write" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
DROP POLICY IF EXISTS "clients_select_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_update_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_all_authenticated" ON public.clients;

CREATE POLICY "clients_all_authenticated" ON public.clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. PAYMENTS TABLE
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_sales_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_sales_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_update_sales_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_sales_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_all_authenticated" ON public.payments;

CREATE POLICY "payments_all_authenticated" ON public.payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. CANDIDATES TABLE
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidates_all_hr_admin" ON public.candidates;

CREATE POLICY "candidates_all_hr_admin" ON public.candidates
  FOR ALL USING (public.current_user_role() IN ('admin', 'hr'));

-- 6. EMPLOYEES TABLE
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_all_hr_admin" ON public.employees;

CREATE POLICY "employees_all_hr_admin" ON public.employees
  FOR ALL USING (public.current_user_role() IN ('admin', 'hr'));

-- 7. ATTENDANCE TABLE
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_all_hr_admin" ON public.attendance;

CREATE POLICY "attendance_all_hr_admin" ON public.attendance
  FOR ALL USING (public.current_user_role() IN ('admin', 'hr'));

-- 8. TASKS TABLE
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select_staff" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_staff" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_staff" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_staff" ON public.tasks;
DROP POLICY IF EXISTS "tasks_all_authenticated" ON public.tasks;

CREATE POLICY "tasks_all_authenticated" ON public.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. CLIENT_TASKS TABLE
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_tasks_select" ON public.client_tasks;
DROP POLICY IF EXISTS "client_tasks_insert" ON public.client_tasks;
DROP POLICY IF EXISTS "client_tasks_update" ON public.client_tasks;
DROP POLICY IF EXISTS "client_tasks_delete" ON public.client_tasks;

CREATE POLICY "client_tasks_select" ON public.client_tasks
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
  );

CREATE POLICY "client_tasks_insert" ON public.client_tasks
  FOR INSERT WITH CHECK (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR created_by = auth.uid()
  );

CREATE POLICY "client_tasks_update" ON public.client_tasks
  FOR UPDATE USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
  );

CREATE POLICY "client_tasks_delete" ON public.client_tasks
  FOR DELETE USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR created_by = auth.uid()
  );

-- 10. CLIENT_TASK_LOGS TABLE
ALTER TABLE public.client_task_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_task_logs_select" ON public.client_task_logs;
DROP POLICY IF EXISTS "client_task_logs_insert" ON public.client_task_logs;
DROP POLICY IF EXISTS "client_task_logs_update" ON public.client_task_logs;
DROP POLICY IF EXISTS "client_task_logs_delete" ON public.client_task_logs;

CREATE POLICY "client_task_logs_select" ON public.client_task_logs
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR EXISTS (
      SELECT 1 FROM public.client_tasks t
      WHERE t.id = task_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

CREATE POLICY "client_task_logs_insert" ON public.client_task_logs
  FOR INSERT WITH CHECK (actor_id = auth.uid());

CREATE POLICY "client_task_logs_update" ON public.client_task_logs
  FOR UPDATE USING (actor_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "client_task_logs_delete" ON public.client_task_logs
  FOR DELETE USING (actor_id = auth.uid() OR public.current_user_role() = 'admin');

-- 11. CLIENT_ATTACHMENTS TABLE
ALTER TABLE public.client_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_attachments_select" ON public.client_attachments;
DROP POLICY IF EXISTS "client_attachments_insert" ON public.client_attachments;
DROP POLICY IF EXISTS "client_attachments_delete" ON public.client_attachments;

CREATE POLICY "client_attachments_select" ON public.client_attachments
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR EXISTS (
      SELECT 1 FROM public.client_tasks t
      WHERE t.id = task_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

CREATE POLICY "client_attachments_insert" ON public.client_attachments
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "client_attachments_delete" ON public.client_attachments
  FOR DELETE USING (uploaded_by = auth.uid() OR public.current_user_role() = 'admin');

-- 12. CLIENT_TASK_ASSIGNMENTS TABLE
ALTER TABLE public.client_task_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_task_assignments_select" ON public.client_task_assignments;
DROP POLICY IF EXISTS "client_task_assignments_all_staff" ON public.client_task_assignments;

CREATE POLICY "client_task_assignments_select" ON public.client_task_assignments
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "client_task_assignments_all_staff" ON public.client_task_assignments
  FOR ALL USING (public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer'));

-- 13. NOTIFICATIONS TABLE
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_recipient" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_recipient" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_recipient" ON public.notifications;

CREATE POLICY "notifications_select_recipient" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_recipient" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "notifications_delete_recipient" ON public.notifications
  FOR DELETE USING (recipient_id = auth.uid() OR public.current_user_role() = 'admin');

-- 14. ACTIVITIES TABLE
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activities_select_staff" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_authenticated" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_admin" ON public.activities;

CREATE POLICY "activities_select_staff" ON public.activities
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer', 'hr')
    OR user_id = auth.uid()
  );

CREATE POLICY "activities_insert_authenticated" ON public.activities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "activities_delete_admin" ON public.activities
  FOR DELETE USING (public.current_user_role() = 'admin');

-- 15. SETTINGS TABLE
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select_staff" ON public.settings;
DROP POLICY IF EXISTS "settings_all_admin" ON public.settings;

CREATE POLICY "settings_select_staff" ON public.settings
  FOR SELECT USING (public.current_user_role() IN ('admin', 'sales', 'digital_marketer', 'developer', 'hr'));

CREATE POLICY "settings_all_admin" ON public.settings
  FOR ALL USING (public.current_user_role() = 'admin');
