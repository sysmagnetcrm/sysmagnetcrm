import { supabase } from './supabaseClient';
import { logger } from './logger';

const PING_STORAGE_KEY = 'sysmagnet-crm:lastSupabasePing';
const PING_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours (safer than 48h)
let timerId = null;

/**
 * Execute a ping to Supabase to keep project active.
 * Uses a lightweight auth session check — no data is read/written.
 */
export const pingSupabase = async () => {
  try {
    // Use the REST endpoint with a limit=0 query — extremely lightweight
    const { error } = await supabase.from('clients').select('id').limit(1).maybeSingle();
    const timestamp = Date.now();
    localStorage.setItem(PING_STORAGE_KEY, timestamp.toString());

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found — that's fine, project is alive
      logger.warn('Supabase keep-alive ping returned error:', { code: error.code, message: error.message });
    } else {
      logger.info('✅ Supabase keep-alive ping OK', { timestamp: new Date(timestamp).toISOString() });
    }
    return true;
  } catch (err) {
    logger.error('Supabase keep-alive ping failed:', { error: err?.message || err });
    return false;
  }
};

/**
 * Start the automatic Supabase Keep-Alive service.
 * - Pings immediately if last ping was >24 hours ago or never done.
 * - Sets a recurring 24-hour interval.
 */
export const startSupabaseKeepAlive = () => {
  const lastPingStr = localStorage.getItem(PING_STORAGE_KEY);
  const lastPing = lastPingStr ? parseInt(lastPingStr, 10) : 0;
  const now = Date.now();

  if (!lastPing || (now - lastPing) >= PING_INTERVAL_MS) {
    logger.info('Executing Supabase keep-alive ping (due)...');
    pingSupabase();
  } else {
    const nextInHours = Math.round((PING_INTERVAL_MS - (now - lastPing)) / (1000 * 60 * 60));
    logger.info(`Supabase keep-alive active. Next ping in ~${nextInHours}h.`);
  }

  if (timerId) clearInterval(timerId);

  timerId = setInterval(() => {
    logger.info('24-hour Supabase keep-alive ping triggered.');
    pingSupabase();
  }, PING_INTERVAL_MS);

  return timerId;
};

/**
 * Stop the keep-alive service (call on logout/unmount).
 */
export const stopSupabaseKeepAlive = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    logger.info('Supabase keep-alive service stopped.');
  }
};
