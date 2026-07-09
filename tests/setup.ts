import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const supabaseUrl = process.env.TEST_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.TEST_SUPABASE_ANON_KEY || 'placeholder';

// Create a simple unauthenticated client
export const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

// Helper to create an authenticated user client
export async function createAuthenticatedClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  
  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw new Error(`Failed to authenticate client for ${email}: ${error.message}`);
  }
  
  return client;
}
