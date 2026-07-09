export interface SessionUser {
  id: string;
  email: string;
  username?: string;
}

export interface IAuthRepository {
  signUp(username: string, email: string, password: string): Promise<{ user: SessionUser | null; error: Error | null }>;
  signIn(email: string, password: string): Promise<{ user: SessionUser | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  getSessionUser(): Promise<SessionUser | null>;
  onAuthStateChange(callback: (userId: string | null) => void): () => void;
}
