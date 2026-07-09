import { useState, useEffect } from 'react';
import { authRepository } from '../services/repository/provider';
import { SessionUser } from '../services/repository/IAuthRepository';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Set up auth state change listener
    const unsubscribe = authRepository.onAuthStateChange(async (uid) => {
      if (!active) return;
      setUserId(uid);
      
      if (uid) {
        const user = await authRepository.getSessionUser();
        if (active) {
          setSessionUser(user);
          setLoading(false);
        }
      } else {
        if (active) {
          setSessionUser(null);
          setLoading(false);
        }
      }
    });

    // Check session on mount
    async function checkSession() {
      try {
        const user = await authRepository.getSessionUser();
        if (active) {
          setSessionUser(user);
          setUserId(user?.id || null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    
    checkSession();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { user, error: signInError } = await authRepository.signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return { success: false, error: signInError.message };
    }
    setUserId(user?.id || null);
    setSessionUser(user);
    setLoading(false);
    return { success: true, error: null };
  };

  const signUp = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { user, error: signUpError } = await authRepository.signUp(username, email, password);
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return { success: false, error: signUpError.message };
    }
    setUserId(user?.id || null);
    setSessionUser(user);
    setLoading(false);
    return { success: true, error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await authRepository.signOut();
    setUserId(null);
    setSessionUser(null);
    setLoading(false);
  };

  return {
    userId,
    sessionUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!userId,
  };
}
