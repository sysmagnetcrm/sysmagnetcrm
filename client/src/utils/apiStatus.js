import { supabase } from './supabaseClient';

let apiStatus = {
  isOnline: true,
  lastCheck: 0,
};

const API_CHECK_INTERVAL = 30000;

export const checkApiStatus = async () => {
  const now = Date.now();
  if (apiStatus.isOnline && (now - apiStatus.lastCheck) < API_CHECK_INTERVAL) {
    return apiStatus.isOnline;
  }
  
  try {
    const { error } = await supabase.from('settings').select('key').limit(1);
    apiStatus.isOnline = !error;
  } catch {
    apiStatus.isOnline = false;
  }
  
  apiStatus.lastCheck = now;
  return apiStatus.isOnline;
};

export const isApiOnline = () => apiStatus.isOnline;
