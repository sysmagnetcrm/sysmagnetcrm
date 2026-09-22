import { supabase } from './supabaseClient';
import { logger } from './logger';

const PING_STORAGE_KEY = 'sysmagnet-crm:lastSupabasePing';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours in ms (172,800,000)
let timerId = null;

/**
 * Execute a ping to Supabase auth to keep project active (prevents 7-day pause timeout).
 */
export const pingSupabase = async () => {
  try {
    const { error } = await supabase.auth.getSession();
    const timestamp = Date.now();
    localStorage.setItem(PING_STORAGE_KEY, timestamp.toString());
    
    if (error) {
      logger.warn('Supabase keep-alive ping return error:', { message: error.message });
    } else {
      logger.info('Supabase keep-alive ping successful:', { timestamp: new Date(timestamp).toISOString() });
    }
    return true;
  } catch (err) {
    logger.error('Supabase keep-alive ping failed exception:', { error: err?.message || err });
    return false;
  }
};

/**
 * Start the automatic Supabase Keep-Alive service.
 * - Pings immediately if last ping was > 48 hours ago or never performed.
 * - Sets an interval to ping every 48 hours.
 */
export const startSupabaseKeepAlive = () => {
  const lastPingStr = localStorage.getItem(PING_STORAGE_KEY);
  const lastPing = lastPingStr ? parseInt(lastPingStr, 10) : 0;
  const now = Date.now();

  if (!lastPing || (now - lastPing) >= TWO_DAYS_MS) {
    logger.info('Executing scheduled Supabase keep-alive ping (due)...');
    pingSupabase();
  } else {
    const nextPingInHours = Math.round((TWO_DAYS_MS - (now - lastPing)) / (1000 * 60 * 60));
    logger.info(`Supabase keep-alive ping active. Next check due in ~${nextPingInHours} hours.`);
  }

  if (timerId) clearInterval(timerId);

  // Set recurring timer for every 48 hours
  timerId = setInterval(() => {
    logger.info('Recurring 48-hour Supabase keep-alive ping triggered.');
    pingSupabase();
  }, TWO_DAYS_MS);
};

/**
 * Stop the keep-alive service.
 */
export const stopSupabaseKeepAlive = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    logger.info('Supabase keep-alive service stopped.');
  }
};
