-- Fix RLS Policies for public.clients table
-- Grant read, insert, update, and delete access to authenticated users

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if present
DROP POLICY IF EXISTS "clients_staff_read" ON public.clients;
DROP POLICY IF EXISTS "clients_staff_write" ON public.clients;
DROP POLICY IF EXISTS "clients_staff_update" ON public.clients;
DROP POLICY IF EXISTS "clients_staff_delete" ON public.clients;
DROP POLICY IF EXISTS "clients_authenticated_all" ON public.clients;
DROP POLICY IF EXISTS "clients_read_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_update_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_authenticated" ON public.clients;

-- Allow authenticated users to read clients
CREATE POLICY "clients_read_authenticated" ON public.clients 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert clients
CREATE POLICY "clients_insert_authenticated" ON public.clients 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update clients
CREATE POLICY "clients_update_authenticated" ON public.clients 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete clients
CREATE POLICY "clients_delete_authenticated" ON public.clients 
FOR DELETE USING (auth.role() = 'authenticated');
