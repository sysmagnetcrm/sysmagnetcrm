-- Vibe CRM migrations
-- Safe to run repeatedly; uses IF NOT EXISTS and guards to avoid errors.

-- Users table supplemental columns
ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN availability TEXT DEFAULT 'available';
ALTER TABLE users ADD COLUMN roles_json TEXT;

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- Only create availability index if column exists (SQLite has no direct conditional, safe if column exists)
CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability);

-- Client tasks feature tables
CREATE TABLE IF NOT EXISTS client_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  created_by INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_roles TEXT,
  priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High','Urgent')),
  status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','In Progress','Submitted','Changes Requested','Closed')),
  due_date DATE,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_due ON client_tasks(due_date);

CREATE TABLE IF NOT EXISTS client_task_subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','In Progress','Submitted','Changes Requested','Closed')),
  estimated_hours REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_task_subtasks_task ON client_task_subtasks(task_id);

CREATE TABLE IF NOT EXISTS client_task_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL,
  assigned_to INTEGER NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('manual','round-robin','capacity')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_task_assignments_task ON client_task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_client_task_assignments_task_created ON client_task_assignments(task_id, created_at);

CREATE TABLE IF NOT EXISTS client_task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  actor_id INTEGER NOT NULL,
  actor_role TEXT NOT NULL CHECK(actor_role IN ('client','staff','admin')),
  message TEXT NOT NULL,
  attachments TEXT,
  time_spent_mins INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_task_logs_task ON client_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_client_task_logs_task_created ON client_task_logs(task_id, created_at);

CREATE TABLE IF NOT EXISTS client_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  filename TEXT,
  storage_path TEXT,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_attachments_task ON client_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_client_attachments_task_version ON client_attachments(task_id, version);

-- Notifications & Settings
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
