-- Fix: Add missing columns to clients table
-- Ensures clients table matches all fields sent by Client Management UI

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS contact       text,
  ADD COLUMN IF NOT EXISTS source        text,
  ADD COLUMN IF NOT EXISTS service       text,
  ADD COLUMN IF NOT EXISTS service_type  text,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS status        text DEFAULT 'Active';

-- Update bootstrap.sql as well for canonical reference
