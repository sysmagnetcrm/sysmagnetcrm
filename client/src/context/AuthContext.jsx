import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Build a minimal user object immediately from Supabase auth data (no DB query)
const buildUserFromAuth = (authUser) => {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    role: (authUser.user_metadata?.role || 'admin').toLowerCase(),
    created_at: authUser.created_at,
  };
};

// Try to enrich user with DB profile (non-blocking, best-effort)
const enrichUserWithProfile = async (authUser) => {
  if (!authUser) return null;
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('name, role, email, avatar_url, department, phone, is_active')
      .eq('id', authUser.id)
      .maybeSingle();

    return {
      id: authUser.id,
      email: authUser.email,
      name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: (profile?.role || authUser.user_metadata?.role || 'admin').toLowerCase(),
      avatar_url: profile?.avatar_url || null,
      department: profile?.department || null,
      phone: profile?.phone || null,
      created_at: profile?.created_at || authUser.created_at,
    };
  } catch {
    // Return minimal user if DB lookup fails (table missing, RLS, network, etc.)
    return buildUserFromAuth(authUser);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // STEP 1: Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        // Set a minimal user immediately (no DB wait) so app renders fast
        setUser(buildUserFromAuth(currentSession.user));
        // Then enrich with DB profile asynchronously (non-blocking)
        enrichUserWithProfile(currentSession.user).then(enriched => {
          if (mounted && enriched) setUser(enriched);
        });
      } else {
        setUser(null);
      }
    });

    // STEP 2: Get initial session with a hard timeout safety net
    const getSessionWithTimeout = async () => {
      try {
        // Race: either getSession resolves, or 6 seconds pass (force-stop loading)
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session timeout')), 6000)
          ),
        ]);

        const { data: { session: initialSession } } = result;

        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          // Set a minimal user immediately from auth data (no DB wait)
          setUser(buildUserFromAuth(initialSession.user));
          // Enrich from DB asynchronously — loading is already false
          setLoading(false);
          enrichUserWithProfile(initialSession.user).then(enriched => {
            if (mounted && enriched) setUser(enriched);
          });
        } else {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        // Timeout or error — stop the loading spinner regardless
        if (mounted) {
          console.warn('Auth session check failed or timed out:', err?.message);
          setLoading(false);
        }
      }
    };

    getSessionWithTimeout();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message || 'Invalid credentials' };
      }

      if (data?.session && data?.user) {
        setSession(data.session);
        // Immediately set user from auth data for instant navigation
        setUser(buildUserFromAuth(data.user));
        // Enrich with DB profile in background
        enrichUserWithProfile(data.user).then(enriched => {
          if (enriched) setUser(enriched);
        });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const switchUser = (newUser) => {
    setUser(newUser);
  };

  const value = {
    user,
    session,
    token: session?.access_token || null,
    loading,
    login,
    logout,
    switchUser,
    isAuthenticated: !!session && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
