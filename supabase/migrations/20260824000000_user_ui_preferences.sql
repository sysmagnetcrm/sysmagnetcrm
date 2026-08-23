-- Migration: User UI Preferences & Workspace Memory Table
-- Enables persistent, user-scoped UI preferences (sidebar collapse state, category accordions, last route)

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

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_ui_preferences_user_id ON public.user_ui_preferences(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can view own ui preferences" ON public.user_ui_preferences;
DROP POLICY IF EXISTS "Users can insert own ui preferences" ON public.user_ui_preferences;
DROP POLICY IF EXISTS "Users can update own ui preferences" ON public.user_ui_preferences;

-- User-scoped RLS policies
CREATE POLICY "Users can view own ui preferences"
  ON public.user_ui_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ui preferences"
  ON public.user_ui_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ui preferences"
  ON public.user_ui_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_user_ui_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_ui_preferences_timestamp ON public.user_ui_preferences;
CREATE TRIGGER tr_user_ui_preferences_timestamp
  BEFORE UPDATE ON public.user_ui_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ui_preferences_timestamp();
