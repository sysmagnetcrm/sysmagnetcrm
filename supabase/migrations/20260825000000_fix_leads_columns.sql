-- Fix: Add missing columns to leads and users tables
-- Fixes 400 error on leads?select=* and heartbeat silent failures

-- Add missing columns to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contact    text,
  ADD COLUMN IF NOT EXISTS value      numeric,
  ADD COLUMN IF NOT EXISTS service    text;

-- Add last_seen to users table (used by presence heartbeat)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen  timestamptz;
