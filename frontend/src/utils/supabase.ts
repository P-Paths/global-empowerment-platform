import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client - SINGLE INSTANCE
// Trim whitespace and validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Validate environment variables before creating client
const hasValidUrl = supabaseUrl && supabaseUrl.length > 0;
const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 0;

if (!hasValidUrl || !hasValidKey) {
  console.error('Missing or invalid Supabase environment variables:', {
    hasUrl: hasValidUrl,
    hasKey: hasValidKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
  });
}

// Create a single instance that will be reused throughout the app
// Configure to handle refresh token errors gracefully
// Use fallback values to prevent "split" errors if env vars are missing or invalid
export const supabase: SupabaseClient = createClient(
  hasValidUrl ? supabaseUrl : 'https://placeholder.supabase.co',
  hasValidKey ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

// Export the client for use in other files
export default supabase;
