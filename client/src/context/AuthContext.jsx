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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser) => {
    if (!authUser) return null;
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      return {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || authUser.email,
        role: (profile?.role || 'client').toLowerCase(),
        created_at: profile?.created_at || authUser.created_at,
      };
    } catch {
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        role: 'client',
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      if (initialSession?.user) {
        const fullUser = await fetchUserProfile(initialSession.user);
        if (mounted) setUser(fullUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        const fullUser = await fetchUserProfile(currentSession.user);
        if (mounted) setUser(fullUser);
      } else {
        if (mounted) setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message || 'Invalid credentials' };
      }

      if (data?.user) {
        const fullUser = await fetchUserProfile(data.user);
        setUser(fullUser);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
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
