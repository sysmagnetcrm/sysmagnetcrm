# Eron-CRM

Eron-CRM is a modern, low-cost, production-ready Customer Relationship Management (CRM) application built with React + Vite and powered exclusively by Supabase backend infrastructure.

---

## 🏗️ Architecture Overview

```
+-------------------------------------------------------------+
|                 Render Static Site (Frontend)               |
|                 React 18 + Vite SPA                         |
+-------------------------------------------------------------+
                               |
                               | Direct HTTPS / WebSockets
                               v
+-------------------------------------------------------------+
|               Supabase Infrastructure (Backend)             |
|                                                             |
|  +-------------------+  +--------------------------------+  |
|  | Supabase Auth     |  | Supabase PostgreSQL DB         |  |
|  | (OAuth & Password)|  | (RLS & RBAC Security Policies) |  |
|  +-------------------+  +--------------------------------+  |
|  +-------------------+  +--------------------------------+  |
|  | Supabase Storage  |  | Supabase Edge Functions        |  |
|  | (Attachments)     |  | (Deno / Serverless Logic)      |  |
|  +-------------------+  +--------------------------------+  |
+-------------------------------------------------------------+
```

- **Frontend Hosting**: Render Static Site (No persistent Node/Express server, AWS, EC2, VPS, or Docker container needed).
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Role-Based Access Control (RBAC).
- **Serverless Business Logic**: Supabase Edge Functions for privileged operations (Lead conversion, Payroll, User provisioning, Payment reminders).

---

## ⚙️ Environment Variables

Only public client credentials should be set in the frontend build environment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

> [!CAUTION]
> **Never** place `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` in frontend `.env` or `VITE_` variables.

---

## 🚀 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/eron-crm.git
   cd eron-crm/client
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. **Configure environment**:
   Create a `.env.local` file inside `client/`:
   ```env
   VITE_SUPABASE_URL=https://dtxhknskptazmvktuplz.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start local development server**:
   ```bash
   npm run dev
   ```

---

## 📦 Database Migrations & RLS

Migrations are stored in `supabase/migrations/`:
- `20260823000000_enable_rls_and_policies.sql` — Initial table RLS policies.
- `20260823000001_eron_crm_master_schema.sql` — Eron-CRM master PostgreSQL schema with full RBAC, UUID primary keys, and tenant isolation policies.

To apply migrations using the Supabase CLI:
```bash
npx supabase db push --linked
```

---

## ⚡ Supabase Edge Functions

Privileged serverless functions located in `supabase/functions/`:
- `lead-conversion`: Transactional lead conversion into active clients.
- `payroll-processing`: Permission-protected payroll calculation and cycle generation.
- `payment-reminder`: Sends email/notification workflow for due/overdue invoices.
- `create-user`: Admin-only user provisioning.
- `update-user` / `delete-user`: Admin-only user updates and account deletion.
- `reset-password-link`: Admin recovery link generation.
- `notify-role`: Targeted bulk notifications for specific roles.

Deploy Edge Functions via:
```bash
npx supabase functions deploy <function-name>
```

---

## 🌐 Render Deployment Guide

1. Log into [Render Dashboard](https://dashboard.render.com/) and create a **New Static Site**.
2. Connect your GitHub repository.
3. Configure Build Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. SPA Routing:
   Ensure `client/public/_redirects` contains:
   ```
   /*  /index.html  200
   ```

---

## 🔒 Security & Compliance

- **Tenant Isolation**: Row Level Security (RLS) ensures clients can only access their own organization's records.
- **Fail-Closed Auth**: Non-authenticated requests are denied by default.
- **Audit Logging**: Sensitive mutations (lead conversions, user changes, payments, payroll) produce immutable records in `public.audit_logs`.
