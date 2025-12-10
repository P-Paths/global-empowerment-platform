import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for browser-side operations
 * This is a function that returns a new client instance
 */
export function supabaseBrowser(): SupabaseClient {
  // Trim whitespace and validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const hasValidUrl = supabaseUrl && supabaseUrl.length > 0;
  const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 0;

  if (!hasValidUrl || !hasValidKey) {
    console.error('Missing or invalid Supabase environment variables:', {
      hasUrl: hasValidUrl,
      hasKey: hasValidKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
    });
    // Use fallback values to prevent "split" errors during module import
    // The actual error will be thrown when trying to use the client
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
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
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
}

// Export default for convenience
export default supabaseBrowser;

