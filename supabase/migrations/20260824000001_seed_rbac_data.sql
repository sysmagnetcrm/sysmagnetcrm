-- Migration: Idempotent RBAC Seed Data & Admin Bootstrap
-- Seeding Roles, Permissions, Role_Permissions, and Auto-assigning initial admin role

-- 1. SEED ROLES
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Full system access and administrative management'),
  ('sales', 'Lead management, sales pipeline, and client communication'),
  ('finance', 'Invoices, payments, financial reports, and payroll overview'),
  ('hr', 'Employee management, attendance tracking, payroll, and recruitment'),
  ('employee', 'General staff operational access for daily tasks and attendance'),
  ('client', 'Client portal access for support tickets and project tracking')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now();

-- 2. SEED PERMISSIONS
INSERT INTO public.permissions (name, category, description) VALUES
  -- Dashboard & Reports
  ('dashboard.read', 'Dashboard', 'View dashboard metrics and summaries'),
  ('reports.read', 'Reports', 'Access analytics and operational reports'),

  -- Leads
  ('leads.read', 'Leads', 'View leads and pipeline'),
  ('leads.create', 'Leads', 'Create new sales leads'),
  ('leads.update', 'Leads', 'Update lead status and details'),
  ('leads.delete', 'Leads', 'Delete sales leads'),

  -- Clients
  ('clients.read', 'Clients', 'View client list and details'),
  ('clients.create', 'Clients', 'Create new client accounts'),
  ('clients.update', 'Clients', 'Update client information'),
  ('clients.delete', 'Clients', 'Delete client accounts'),

  -- Tasks
  ('tasks.read', 'Tasks', 'View assigned and project tasks'),
  ('tasks.create', 'Tasks', 'Create new tasks'),
  ('tasks.update', 'Tasks', 'Update task status and comments'),
  ('tasks.delete', 'Tasks', 'Delete tasks'),

  -- Payments & Invoices
  ('payments.read', 'Payments', 'View invoices and payment history'),
  ('payments.create', 'Payments', 'Generate invoices and log payments'),
  ('payments.update', 'Payments', 'Modify invoice and payment details'),
  ('payments.delete', 'Payments', 'Void or delete payment records'),

  -- Users & Employees
  ('users.read', 'Users & HR', 'View user accounts and employee records'),
  ('users.create', 'Users & HR', 'Create user accounts and employees'),
  ('users.update', 'Users & HR', 'Update user roles and employee details'),
  ('users.delete', 'Users & HR', 'Delete or deactivate user accounts'),

  -- Payroll
  ('payroll.read', 'Payroll', 'View payroll cycles and pay stubs'),
  ('payroll.create', 'Payroll', 'Generate payroll runs'),
  ('payroll.update', 'Payroll', 'Modify payroll records'),

  -- Recruitment & HR
  ('recruitment.read', 'Recruitment', 'View job postings and candidates'),
  ('recruitment.create', 'Recruitment', 'Add candidates and schedule interviews'),
  ('recruitment.update', 'Recruitment', 'Approve or update candidate status'),

  -- Attendance
  ('attendance.read', 'Attendance', 'View attendance logs and summaries'),
  ('attendance.create', 'Attendance', 'Clock in / clock out attendance records'),
  ('attendance.update', 'Attendance', 'Approve or adjust attendance logs'),

  -- QA & Automation
  ('qa.read', 'Quality Assurance', 'View QA test runs and metrics'),
  ('qa.create', 'Quality Assurance', 'Execute QA test cases'),
  ('automation.read', 'Automation', 'View automated workflow runs'),
  ('automation.manage', 'Automation', 'Configure automation rules'),

  -- Tickets / Support
  ('tickets.read', 'Support Tickets', 'View support tickets'),
  ('tickets.create', 'Support Tickets', 'Submit support tickets'),
  ('tickets.update', 'Support Tickets', 'Respond to or resolve tickets'),

  -- Settings & Audit Logs
  ('settings.read', 'Settings', 'View system settings'),
  ('settings.update', 'Settings', 'Modify system settings'),
  ('audit_logs.read', 'Audit Logs', 'View administrative audit logs')
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- 3. SEED ROLE PERMISSIONS MATRIX
-- Helper function to map permission names to a role
DO $$
DECLARE
  v_admin_id UUID;
  v_sales_id UUID;
  v_finance_id UUID;
  v_hr_id UUID;
  v_emp_id UUID;
  v_client_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO v_sales_id FROM public.roles WHERE name = 'sales';
  SELECT id INTO v_finance_id FROM public.roles WHERE name = 'finance';
  SELECT id INTO v_hr_id FROM public.roles WHERE name = 'hr';
  SELECT id INTO v_emp_id FROM public.roles WHERE name = 'employee';
  SELECT id INTO v_client_id FROM public.roles WHERE name = 'client';

  -- Clear existing role permissions to apply clean matrix
  DELETE FROM public.role_permissions;

  -- ADMINISTRATOR: Gets ALL permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_admin_id, id FROM public.permissions;

  -- SALES: Leads, Clients, Tasks, Reports, Dashboard
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_sales_id, id FROM public.permissions
  WHERE name IN (
    'dashboard.read', 'reports.read',
    'leads.read', 'leads.create', 'leads.update', 'leads.delete',
    'clients.read', 'clients.create', 'clients.update',
    'tasks.read', 'tasks.create', 'tasks.update'
  );

  -- FINANCE: Payments, Invoices, Clients, Reports, Payroll
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_finance_id, id FROM public.permissions
  WHERE name IN (
    'dashboard.read', 'reports.read',
    'payments.read', 'payments.create', 'payments.update', 'payments.delete',
    'clients.read', 'payroll.read'
  );

  -- HR: Users, Employee, Payroll, Attendance, Recruitment
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_hr_id, id FROM public.permissions
  WHERE name IN (
    'dashboard.read',
    'users.read', 'users.create', 'users.update',
    'payroll.read', 'payroll.create', 'payroll.update',
    'attendance.read', 'attendance.create', 'attendance.update',
    'recruitment.read', 'recruitment.create', 'recruitment.update'
  );

  -- EMPLOYEE: Tasks, Attendance, Dashboard
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_emp_id, id FROM public.permissions
  WHERE name IN (
    'dashboard.read',
    'tasks.read', 'tasks.update',
    'attendance.read', 'attendance.create'
  );

  -- CLIENT: Tickets, Tasks read, Client portal
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_client_id, id FROM public.permissions
  WHERE name IN (
    'tickets.read', 'tickets.create', 'tickets.update',
    'tasks.read'
  );
END $$;

-- 4. ADMIN BOOTSTRAP FOR EXISTING USERS
-- Ensure all existing profiles in public.profiles have an entry in public.user_roles (default to admin)
DO $$
DECLARE
  v_admin_role_id UUID;
BEGIN
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';

  IF v_admin_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT p.id, v_admin_role_id
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
    )
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;
