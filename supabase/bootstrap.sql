-- ============================================================
-- Eron-CRM Bootstrap SQL — CLEAN INSTALL
-- Paste into: https://supabase.com/dashboard/project/phmwijxrqrzykfcaljwm/sql/new
-- Safe to run multiple times (drops and recreates everything).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DROP ALL APP TABLES (safe — no real data yet) ──────────
DROP TABLE IF EXISTS public.audit_logs        CASCADE;
DROP TABLE IF EXISTS public.activities        CASCADE;
DROP TABLE IF EXISTS public.notifications     CASCADE;
DROP TABLE IF EXISTS public.client_tasks      CASCADE;
DROP TABLE IF EXISTS public.settings          CASCADE;
DROP TABLE IF EXISTS public.payroll_records   CASCADE;
DROP TABLE IF EXISTS public.payroll_cycles    CASCADE;
DROP TABLE IF EXISTS public.attendance        CASCADE;
DROP TABLE IF EXISTS public.payments          CASCADE;
DROP TABLE IF EXISTS public.candidates        CASCADE;
DROP TABLE IF EXISTS public.employees         CASCADE;
DROP TABLE IF EXISTS public.tasks             CASCADE;
DROP TABLE IF EXISTS public.leads             CASCADE;
DROP TABLE IF EXISTS public.clients           CASCADE;
DROP TABLE IF EXISTS public.users             CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 1. USERS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  email       text,
  role        text NOT NULL DEFAULT 'client'
                CHECK (role IN ('admin','sales','developer','hr','finance','client','digital_marketer')),
  department  text,
  phone       text,
  avatar_url  text,
  is_active   boolean DEFAULT true,
  last_seen   timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users AS u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- ══════════════════════════════════════════════════════════════
-- 2. CLIENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  email         text,
  phone         text,
  contact       text,
  status        text DEFAULT 'Active',
  service_type  text,
  total_amount  numeric DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount   numeric DEFAULT 0 CHECK (paid_amount >= 0),
  notes         text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_read"   ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_write"  ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 3. LEADS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.leads (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                text NOT NULL,
  email               text,
  phone               text,
  contact             text,          -- Contact person name
  company             text,          -- Company / organization
  status              text DEFAULT 'New',
  priority            text DEFAULT 'Warm',
  source              text,
  service             text,          -- Interested service (UI alias)
  service_type        text,          -- Canonical service type (edge function)
  value               numeric,       -- Estimated deal value
  notes               text,
  assigned_to         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at        timestamptz,
  converted_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_read"   ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_write"  ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 4. TASKS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.tasks (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        text NOT NULL,
  description  text,
  status       text DEFAULT 'Pending',
  priority     text DEFAULT 'Medium',
  due_date     date,
  assigned_to  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id    uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_read"   ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_write"  ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 5. EMPLOYEES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.employees (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name        text NOT NULL,
  email       text,
  phone       text,
  position    text,
  department  text,
  salary      numeric DEFAULT 0 CHECK (salary >= 0),
  join_date   date,
  status      text DEFAULT 'Active',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_read"   ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_write"  ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 6. CANDIDATES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.candidates (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  email       text,
  phone       text,
  position    text,
  status      text DEFAULT 'Applied',
  experience  text,
  skills      text,
  notes       text,
  applied_at  date DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_read"   ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "candidates_write"  ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "candidates_update" ON public.candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "candidates_delete" ON public.candidates FOR DELETE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 7. PAYMENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.payments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_no      text,
  amount          numeric NOT NULL CHECK (amount > 0),
  payment_status  text DEFAULT 'Pending',
  payment_method  text,
  payment_date    date,
  due_date        date,
  notes           text,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_read"   ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_write"  ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "payments_delete" ON public.payments FOR DELETE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 8. ATTENDANCE
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.attendance (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id        uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  date               date NOT NULL,
  check_in_at        timestamptz,
  check_out_at       timestamptz,
  check_in_lat       numeric,
  check_in_lng       numeric,
  check_out_lat      numeric,
  check_out_lng      numeric,
  check_in_accuracy  numeric,
  check_out_accuracy numeric,
  hours_worked       numeric DEFAULT 0,
  overtime_hours     numeric DEFAULT 0,
  status             text DEFAULT 'Present',
  notes              text,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (employee_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_read"   ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance_write"  ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 9. PAYROLL
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.payroll_cycles (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start date NOT NULL,
  period_end   date NOT NULL,
  status       text DEFAULT 'Draft',
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.payroll_records (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id     uuid REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  employee_id  uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  base_salary  numeric DEFAULT 0,
  allowances   numeric DEFAULT 0,
  deductions   numeric DEFAULT 0,
  bonus        numeric DEFAULT 0,
  net_salary   numeric GENERATED ALWAYS AS (base_salary + allowances - deductions + bonus) STORED,
  status       text DEFAULT 'Pending',
  paid_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.payroll_cycles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_cycles_read"   ON public.payroll_cycles  FOR SELECT TO authenticated USING (true);
CREATE POLICY "payroll_cycles_write"  ON public.payroll_cycles  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payroll_records_read"  ON public.payroll_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "payroll_records_write" ON public.payroll_records FOR INSERT TO authenticated WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- 10. NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  message    text,
  type       text DEFAULT 'info',
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read"   ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- 11. ACTIVITIES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.activities (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_read"   ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- 12. AUDIT LOGS (append-only)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read"   ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
-- No UPDATE or DELETE policies — audit logs are append-only.

-- ══════════════════════════════════════════════════════════════
-- 13. SETTINGS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.settings (
  key        text PRIMARY KEY,
  value      jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_read"  ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write" ON public.settings FOR ALL    TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 14. CLIENT TASKS (portal tickets)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE public.client_tasks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text DEFAULT 'Open',
  priority    text DEFAULT 'Medium',
  due_date    date,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_tasks_read"   ON public.client_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_tasks_write"  ON public.client_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "client_tasks_update" ON public.client_tasks FOR UPDATE TO authenticated USING (true);

-- ══════════════════════════════════════════════════════════════
-- 15. USER UI PREFERENCES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_ui_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
  sidebar_sections JSONB NOT NULL DEFAULT '{"sales": true, "operations": true, "people": true, "support": true}'::jsonb,
  last_route TEXT DEFAULT '/dashboard',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ui_preferences_select" ON public.user_ui_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ui_preferences_insert" ON public.user_ui_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ui_preferences_update" ON public.user_ui_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ✅ Done — 15 tables created fresh with RLS enabled.

