'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  passwordRecovery: false,
  updatePassword: async () => {},
  finishPasswordRecovery: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Supabase's implicit recovery flow includes type=recovery in the URL hash.
    // Read only the flow type; never retain or expose the token values.
    const recoveryType = new URLSearchParams(window.location.hash.slice(1)).get('type');
    if (recoveryType === 'recovery') setPasswordRecovery(true);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
    });
    return { error };
  };

  const updatePassword = async (password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const finishPasswordRecovery = () => {
    setPasswordRecovery(false);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, resetPassword,
      passwordRecovery, updatePassword, finishPasswordRecovery,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
