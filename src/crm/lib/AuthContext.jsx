/**
 * AuthContext.jsx
 * Supabase-backed auth context. Replaces the previous Base44 implementation.
 * The context contract (user, isLoadingAuth, etc.) is unchanged so all
 * consumers work without modification.
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@crm/api/supabaseClient';

const AuthContext = createContext();

/** Normalises a Supabase User object into the shape the CRM expects. */
function normaliseUser(supabaseUser) {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    full_name:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      '',
    role: supabaseUser.app_metadata?.role ?? supabaseUser.user_metadata?.role ?? 'user',
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const normalised = normaliseUser(session?.user ?? null);
      setUser(normalised);
      setIsAuthenticated(!!normalised);
      setIsLoadingAuth(false);
    });

    // Keep state in sync with auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const normalised = normaliseUser(session?.user ?? null);
      setUser(normalised);
      setIsAuthenticated(!!normalised);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/crm/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/crm/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // These kept for backward compatibility with components that destructure them
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

