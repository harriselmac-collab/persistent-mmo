import { IAuthRepository } from './IAuthRepository';
import { IGameRepository } from './IGameRepository';
import { MockAuthRepository } from './MockAuthRepository';
import { MockGameRepository } from './MockGameRepository';
import { SupabaseAuthRepository } from './SupabaseAuthRepository';
import { SupabaseGameRepository } from './SupabaseGameRepository';

// Check if we are running in the browser and the Supabase config is placeholder
const isPlaceholder = 
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-url') ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder-anon-key');

const defaultProvider = process.env.NEXT_PUBLIC_DATA_PROVIDER || 'supabase';

// Resolve provider type. Fall back to mock in the browser if Supabase configuration is placeholder.
let resolvedProvider = defaultProvider;
if (defaultProvider === 'supabase' && isPlaceholder && typeof window !== 'undefined') {
  console.warn('Supabase URL is a placeholder. Falling back to mock data provider.');
  resolvedProvider = 'mock';
}

let authRepository: IAuthRepository;
let gameRepository: IGameRepository;

if (resolvedProvider === 'supabase') {
  authRepository = new SupabaseAuthRepository();
  gameRepository = new SupabaseGameRepository();
} else {
  authRepository = new MockAuthRepository();
  gameRepository = new MockGameRepository();
}

export { authRepository, gameRepository };
export const activeProvider = resolvedProvider;

