import { IAuthRepository, SessionUser } from './IAuthRepository';
import { supabase } from '../api/supabaseClient';

export class SupabaseAuthRepository implements IAuthRepository {
  async signUp(username: string, email: string, password: string): Promise<{ user: SessionUser | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) return { user: null, error };
      if (!data.user) return { user: null, error: new Error('User creation failed.') };

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.user_metadata?.username || username,
        },
        error: null,
      };
    } catch (err: any) {
      console.error('Sign up fetch error:', err);
      return { user: null, error: err instanceof Error ? err : new Error(err?.message || 'Failed to fetch') };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: SessionUser | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { user: null, error };
      if (!data.user) return { user: null, error: new Error('Sign in failed.') };

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.user_metadata?.username,
        },
        error: null,
      };
    } catch (err: any) {
      console.error('Sign in fetch error:', err);
      return { user: null, error: err instanceof Error ? err : new Error(err?.message || 'Failed to fetch') };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err: any) {
      console.error('Sign out fetch error:', err);
      return { error: err instanceof Error ? err : new Error(err?.message || 'Failed to fetch') };
    }
  }

  async getSessionUser(): Promise<SessionUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return null;

      return {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata?.username,
      };
    } catch (err: any) {
      console.error('Get session user fetch error:', err);
      return null;
    }
  }

  onAuthStateChange(callback: (userId: string | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}
