import { supabase } from './supabaseClient';

let apiStatus = {
  isOnline: true,
  isPaused: false,
  lastCheck: 0,
};

const API_CHECK_INTERVAL = 30000;

export const checkApiStatus = async () => {
  const now = Date.now();
  if (apiStatus.isOnline && (now - apiStatus.lastCheck) < API_CHECK_INTERVAL) {
    return apiStatus.isOnline;
  }
  
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      const msg = String(error?.message || '').toLowerCase();
      // Detect paused / maintenance states from message
      if (msg.includes('paused') || msg.includes('503') || msg.includes('project disabled')) {
        apiStatus.isPaused = true;
        apiStatus.isOnline = false;
      } else {
        apiStatus.isPaused = false;
        apiStatus.isOnline = true; // auth errors like missing session are still "online"
      }
    } else {
      apiStatus.isOnline = true;
      apiStatus.isPaused = false;
    }
  } catch (err) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('paused') || msg.includes('503')) {
      apiStatus.isPaused = true;
    }
    apiStatus.isOnline = false;
  }
  
  apiStatus.lastCheck = now;
  return apiStatus.isOnline;
};

export const isApiOnline = () => apiStatus.isOnline;
export const isSupabasePaused = () => apiStatus.isPaused;
