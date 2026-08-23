import { supabase } from '../utils/supabaseClient';

const LOCAL_STORAGE_PREFIX = 'eron-crm-ui-preferences:';

// Default preferences state
export const DEFAULT_PREFERENCES = {
  sidebar_collapsed: false,
  sidebar_sections: {
    sales: true,
    operations: true,
    people: true,
    support: true,
  },
  last_route: '/dashboard',
  preferences: {},
};

// Debounce timer registry per user
const debounceTimers = {};

/**
 * Get user-namespaced localStorage key
 */
const getStorageKey = (userId) => `${LOCAL_STORAGE_PREFIX}${userId}`;

/**
 * Read cached preferences from localStorage for a specific user
 */
export const getLocalPreferences = (userId) => {
  if (!userId) return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local UI preferences:', err);
    return null;
  }
};

/**
 * Write preferences to user-namespaced localStorage
 */
export const setLocalPreferences = (userId, data) => {
  if (!userId) return;
  try {
    const existing = getLocalPreferences(userId) || DEFAULT_PREFERENCES;
    const updated = {
      ...existing,
      ...data,
      client_timestamp: Date.now(),
    };
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save local UI preferences:', err);
  }
};

/**
 * Fetch UI preferences from Supabase for authenticated user
 */
export const fetchServerPreferences = async (userId) => {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_ui_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch user_ui_preferences error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Offline or failed to fetch UI preferences from server:', err);
    return null;
  }
};

/**
 * Upsert UI preferences to Supabase for authenticated user
 */
export const upsertServerPreferences = async (userId, preferenceData) => {
  if (!userId) return;
  try {
    const payload = {
      user_id: userId,
      sidebar_collapsed: preferenceData.sidebar_collapsed ?? false,
      sidebar_sections: preferenceData.sidebar_sections ?? DEFAULT_PREFERENCES.sidebar_sections,
      last_route: preferenceData.last_route || '/dashboard',
      preferences: preferenceData.preferences || {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_ui_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase upsert user_ui_preferences error:', error.message);
    }
  } catch (err) {
    console.warn('Network error upserting UI preferences to server:', err);
  }
};

/**
 * Debounced server synchronization (500ms debounce delay)
 */
export const debouncedSyncServer = (userId, preferenceData, delayMs = 500) => {
  if (!userId) return;

  if (debounceTimers[userId]) {
    clearTimeout(debounceTimers[userId]);
  }

  debounceTimers[userId] = setTimeout(() => {
    upsertServerPreferences(userId, preferenceData);
    delete debounceTimers[userId];
  }, delayMs);
};
