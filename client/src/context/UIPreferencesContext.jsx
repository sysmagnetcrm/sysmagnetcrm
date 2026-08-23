import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  DEFAULT_PREFERENCES,
  getLocalPreferences,
  setLocalPreferences,
  fetchServerPreferences,
  debouncedSyncServer,
} from '../services/uiPreferences.service';

const UIPreferencesContext = createContext();

export const UIPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [sidebarSections, setSidebarSectionsState] = useState(DEFAULT_PREFERENCES.sidebar_sections);
  const [lastRoute, setLastRouteState] = useState('/dashboard');
  const [preferences, setPreferencesState] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Load preferences when user ID changes
  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      // Unauthenticated / Logged out - reset to defaults
      setSidebarCollapsedState(false);
      setSidebarSectionsState(DEFAULT_PREFERENCES.sidebar_sections);
      setLastRouteState('/dashboard');
      setPreferencesState({});
      setInitialized(true);
      return;
    }

    // Step 1: Instantly load cached local preferences for this authenticated user
    const local = getLocalPreferences(userId);
    if (local) {
      setSidebarCollapsedState(local.sidebar_collapsed ?? false);
      setSidebarSectionsState(local.sidebar_sections ?? DEFAULT_PREFERENCES.sidebar_sections);
      setLastRouteState(local.last_route || '/dashboard');
      setPreferencesState(local.preferences || {});
    }

    // Step 2: Asynchronously fetch server preferences from Supabase
    fetchServerPreferences(userId).then(serverData => {
      if (!isMounted) return;

      if (serverData) {
        const mergedCollapsed = serverData.sidebar_collapsed ?? (local?.sidebar_collapsed ?? false);
        const mergedSections = {
          ...DEFAULT_PREFERENCES.sidebar_sections,
          ...(local?.sidebar_sections || {}),
          ...(serverData.sidebar_sections || {}),
        };
        const mergedLastRoute = serverData.last_route || local?.last_route || '/dashboard';
        const mergedExtra = { ...(local?.preferences || {}), ...(serverData.preferences || {}) };

        setSidebarCollapsedState(mergedCollapsed);
        setSidebarSectionsState(mergedSections);
        setLastRouteState(mergedLastRoute);
        setPreferencesState(mergedExtra);

        // Update local cache with merged server data
        setLocalPreferences(userId, {
          sidebar_collapsed: mergedCollapsed,
          sidebar_sections: mergedSections,
          last_route: mergedLastRoute,
          preferences: mergedExtra,
        });
      } else if (!local) {
        // First login with no local or server data - save defaults
        setLocalPreferences(userId, DEFAULT_PREFERENCES);
        debouncedSyncServer(userId, DEFAULT_PREFERENCES);
      }
      setInitialized(true);
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Setter: Sidebar Collapsed State
  const setSidebarCollapsed = useCallback((valueOrFn) => {
    setSidebarCollapsedState(prev => {
      const nextVal = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      if (userId) {
        const updated = {
          sidebar_collapsed: nextVal,
          sidebar_sections: sidebarSections,
          last_route: lastRoute,
          preferences,
        };
        setLocalPreferences(userId, updated);
        debouncedSyncServer(userId, updated);
      }
      return nextVal;
    });
  }, [userId, sidebarSections, lastRoute, preferences]);

  // Setter: Toggle Sidebar Section
  const toggleSection = useCallback((sectionKey) => {
    setSidebarSectionsState(prev => {
      const currentVal = prev[sectionKey] !== undefined ? prev[sectionKey] : true;
      const nextSections = {
        ...prev,
        [sectionKey]: !currentVal,
      };

      if (userId) {
        const updated = {
          sidebar_collapsed: sidebarCollapsed,
          sidebar_sections: nextSections,
          last_route: lastRoute,
          preferences,
        };
        setLocalPreferences(userId, updated);
        debouncedSyncServer(userId, updated);
      }

      return nextSections;
    });
  }, [userId, sidebarCollapsed, lastRoute, preferences]);

  // Setter: Set Last Route
  const setLastRoute = useCallback((route) => {
    // Avoid saving transient or auth routes
    if (!route || ['/login', '/logout', '/error', '/callback'].includes(route)) return;

    setLastRouteState(route);
    if (userId) {
      const updated = {
        sidebar_collapsed: sidebarCollapsed,
        sidebar_sections: sidebarSections,
        last_route: route,
        preferences,
      };
      setLocalPreferences(userId, updated);
      debouncedSyncServer(userId, updated);
    }
  }, [userId, sidebarCollapsed, sidebarSections, preferences]);

  const value = {
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarSections,
    toggleSection,
    lastRoute,
    setLastRoute,
    preferences,
    initialized,
  };

  return (
    <UIPreferencesContext.Provider value={value}>
      {children}
    </UIPreferencesContext.Provider>
  );
};

export const useUIPreferences = () => {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error('useUIPreferences must be used within a UIPreferencesProvider');
  }
  return context;
};
