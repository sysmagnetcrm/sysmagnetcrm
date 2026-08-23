import { createClient } from '@supabase/supabase-js';

// Read from Vite env (define in .env or .env.local)
// VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
// VITE_SUPABASE_ANON_KEY=sb_publishable_G-cg0n_F0w2w_GsQ6va6d
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a helpful warning in dev
  typeof window !== 'undefined' && console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to your .env.local file.'
  );
}

export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default supabase;
