import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.log('Supabase credentials not configured, using fallback');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Export default client for backward compatibility
export default getSupabaseClient;

