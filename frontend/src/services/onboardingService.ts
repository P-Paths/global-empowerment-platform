import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { getApiUrl, getBackendUrl } from '@/config/api';
import { authenticatedFetch } from '@/utils/api';

export interface OnboardingData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  zip?: string;
  city?: string;
  experience_level?: 'beginner' | 'intermediate' | 'experienced';
  selected_category?: 'social_media' | 'ecommerce' | 'consulting' | 'content_creation' | 'saas' | 'other';
  messaging_preference?: 'auto_reply' | 'human_in_loop' | 'manual';
  wants_escrow?: boolean;
  onboarding_complete?: boolean;
}

export interface MarketplaceIntegration {
  id: string;
  name: string;
  category: string;
  status: 'live' | 'coming_soon' | 'disabled';
  icon_url: string;
  region?: string;
  requires_auth: boolean;
  enabled: boolean;
  display_order: number;
}

export class OnboardingService {
  private supabase = supabaseBrowser();

  /**
   * Get user's onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<boolean> {
    try {
      // Check if this is a demo/mock user (demo login)
      if (userId === '00000000-0000-0000-0000-000000000123') {
        console.log('Demo user detected - skipping Supabase check');
        return false; // Demo users need to complete onboarding
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing rows gracefully

      if (error) {
        // Handle 406 (Not Acceptable) - might be RLS or API format issue
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          console.log('Profile does not exist yet or RLS issue, onboarding not complete');
          return false;
        }
        // Log error details for debugging
        console.warn('Error fetching onboarding status:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // Return false to allow onboarding to proceed
        return false;
      }

      // If no data, profile doesn't exist
      if (!data) {
        console.log('Profile does not exist - onboarding not complete');
        return false;
      }

      return data.onboarding_complete ?? false;
    } catch (error) {
      // Catch any unexpected errors and log them properly
      console.warn('Error in getOnboardingStatus:', {
        error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        userId
      });
      // Return false to allow onboarding to proceed (fail gracefully)
      return false;
    }
  }

  /**
   * Ensure profile exists (wait for trigger or create it)
   */
  private async ensureProfileExists(userId: string): Promise<{ error: Error | null }> {
    // Check if profile exists
    const { data: existingProfile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return { error: null };
    }

    // Profile doesn't exist - wait for trigger to create it
    // The trigger should create the profile automatically when user signs up
    // Wait up to 3 seconds (6 attempts x 500ms)
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      
      const { data: retryProfile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (retryProfile) {
        return { error: null };
      }
    }

    // Trigger didn't create it - try using UPSERT which handles both insert and update
    // UPSERT won't fail on foreign key if user doesn't exist, it will just return an error
    try {
      const now = new Date().toISOString();
      const result = await this.supabase
        .from('profiles')
        .upsert({
          id: userId,
          user_id: userId, // Use user_id instead of email (email is in auth.users)
          created_at: now,
          updated_at: now
        }, {
          onConflict: 'id'
        });

      // Log the full result object to see what we're getting
      console.log('Upsert result:', {
        hasData: !!result.data,
        hasError: !!result.error,
        errorType: typeof result.error,
        errorValue: result.error,
        errorKeys: result.error ? Object.keys(result.error) : [],
        data: result.data,
        status: (result as any).status,
        statusText: (result as any).statusText
      });

      // PRIORITY 1: If we have data, treat as success regardless of error object
      if (result.data) {
        console.log('✅ Profile created/updated successfully via upsert (data present)');
        return { error: null };
      }

      // PRIORITY 2: Check if profile exists now (upsert might succeed without returning data)
      const { data: checkProfile, error: checkError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkProfile && !checkError) {
        console.log('✅ Profile exists after upsert - treating as success');
        return { error: null };
      }

      // PRIORITY 3: Check if there's a real error (not just an empty object)
      const errorKeys = result.error ? Object.keys(result.error) : [];
      const errorObj = result.error;
      
      // Check if error has meaningful content
      const hasErrorContent = errorObj && (
        (errorKeys.length > 0 && (
          errorObj.message || 
          errorObj.code || 
          errorObj.details || 
          errorObj.hint ||
          // Check if any value is truthy
          Object.values(errorObj).some(val => val !== null && val !== undefined && val !== '')
        ))
      );

      console.log('Error check:', {
        hasError: !!result.error,
        hasErrorContent,
        errorKeys,
        errorKeysLength: errorKeys.length,
        errorMessage: errorObj?.message,
        errorCode: errorObj?.code,
        errorStringified: errorObj ? JSON.stringify(errorObj) : 'null'
      });

      // If error object exists but is empty or has no useful info, treat as success
      // This can happen with RLS policies that silently block but don't return errors
      if (result.error && !hasErrorContent) {
        console.log('ℹ️ Empty or invalid error object received - likely RLS policy blocking silently. Backend API will handle profile creation.');
        // Check one more time if profile exists (might have been created by trigger)
        const { data: finalCheck } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (finalCheck) {
          console.log('✅ Profile exists after empty error - success!');
          return { error: null };
        }
        
        // Profile still doesn't exist, but no real error - continue anyway
        // The backend API will create it via service role
        console.log('ℹ️ Profile not created via frontend client (expected - RLS blocking). Backend API will create it.');
        return { error: null };
      }

      if (hasErrorContent) {
        // Try to extract error info in multiple ways
        const errorMessage = errorObj?.message || errorObj?.details || errorObj?.hint || String(errorObj) || 'Failed to create profile';
        const errorCode = errorObj?.code;
        
        // If foreign key constraint error, the user doesn't exist in auth.users yet
        // This is expected for new users - backend API will handle it
        if (errorCode === '23503' || errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
          console.log('ℹ️ Foreign key constraint (expected for new users). Backend API will handle profile creation.');
          return { error: null };
        }
        
        // For other real errors, log but don't fail - backend API will try to create it
        console.warn('⚠️ Error creating profile via frontend client:', {
          code: errorCode,
          message: errorMessage,
          userId
        });
        console.log('ℹ️ Continuing anyway - backend API will attempt to create profile via service role.');
        return { error: null };
      }

      // If we get here, no error object at all - treat as success
      console.log('✅ No error object - treating as success');
      return { error: null };
    } catch (exception: any) {
      // Catch any exceptions that might be thrown
      console.error('Exception creating profile:', {
        exception,
        exceptionType: typeof exception,
        exceptionMessage: exception?.message,
        exceptionStack: exception?.stack,
        userId
      });
      
      const errorMsg = exception?.message || String(exception) || 'Failed to create profile';
      return { error: new Error(errorMsg) };
    }
  }

  /**
   * Update onboarding data
   */
  async updateOnboardingData(userId: string, data: Partial<OnboardingData>): Promise<{ error: Error | null }> {
    try {
      // Verify user is authenticated
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError || !session || session.user.id !== userId) {
        console.error('Session verification failed:', {
          sessionError,
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          providedUserId: userId
        });
        return { error: new Error('Authentication required. Please log in again.') };
      }

      // Try to ensure profile exists (non-blocking - won't fail if it doesn't exist yet)
      // The backend API will create the profile if it doesn't exist, so this is just a best-effort check
      try {
        const profileResult = await this.ensureProfileExists(userId);
        if (profileResult.error) {
          console.log('ℹ️ Profile not created via frontend client (expected). Backend API will create it.');
        }
      } catch (error) {
        // Don't fail the flow if ensureProfileExists throws - backend API will handle it
        console.log('ℹ️ Error in ensureProfileExists (non-critical). Backend API will create profile:', error);
      }

      // Use backend API to bypass RLS (uses service role)
      // The backend API handles both create and update (upsert)
      // Always use NEXT_PUBLIC_API_URL if set (should be the full base URL without /api/v1)
      // Example: NEXT_PUBLIC_API_URL=https://gem-backend-1094576259070.us-central1.run.app
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || getBackendUrl();
      // Ensure baseUrl doesn't end with /api/v1 or trailing slash (we'll add /api/v1)
      const cleanBaseUrl = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
      const apiUrl = `${cleanBaseUrl}/api/v1/profiles/onboarding`;
      
      console.log('🔗 Constructed API URL:', {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        baseUrl,
        cleanBaseUrl,
        finalUrl: apiUrl
      });
      
      const requestBody = {
        user_id: userId,
        first_name: data.first_name,
        last_name: data.last_name,
        city: data.city,
        selected_category: data.selected_category,
        onboarding_complete: data.onboarding_complete
      };
      
      // Verify we have a session before making the request
      const { data: { session: currentSession } } = await this.supabase.auth.getSession();
      if (!currentSession?.access_token) {
        console.error('❌ No access token available for API call');
        return { error: new Error('Not authenticated. Please log in again.') };
      }
      
      console.log('📤 Calling backend API to update profile:', { 
        apiUrl, 
        userId,
        hasToken: !!currentSession.access_token,
        tokenLength: currentSession.access_token.length
      });
      
      const response = await authenticatedFetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Backend API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          userId
        });
        return { error: new Error(errorMessage) };
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Successfully saved onboarding data via backend API');
        return { error: null };
      } else {
        console.error('❌ Backend API returned unsuccessful result:', result);
        return { error: new Error(result.message || 'Failed to save onboarding data') };
      }
    } catch (error) {
      console.error('Error in updateOnboardingData:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return { error: new Error(errorMessage) };
    }
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(userId: string): Promise<{ error: Error | null }> {
    return this.updateOnboardingData(userId, { onboarding_complete: true });
  }

  /**
   * Get marketplace integrations for a category
   */
  async getMarketplaceIntegrations(category: string): Promise<MarketplaceIntegration[]> {
    try {
      const { data, error } = await this.supabase
        .from('marketplace_integrations')
        .select('*')
        .eq('category', category)
        .eq('enabled', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching marketplace integrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMarketplaceIntegrations:', error);
      return [];
    }
  }

  /**
   * Get city from zip code (using a simple API or fallback)
   */
  async getCityFromZip(zip: string): Promise<string | null> {
    try {
      // Using a free zip code API
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (response.ok) {
        const data = await response.json();
        return data.places?.[0]?.['place name'] || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching city from zip:', error);
      return null;
    }
  }

  /**
   * Get all onboarding profiles (admin function)
   */
  async getAllOnboardingProfiles(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching onboarding profiles:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAllOnboardingProfiles:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Log training data (for backend learning agent)
   */
  async logTrainingData(
    userId: string,
    logType: 'user_edited_message' | 'rejected_ai_draft' | 'unanswered_question' | 'manual_response',
    data: {
      listing_id?: string;
      original_ai_draft?: string;
      user_edited_message?: string;
      buyer_question?: string;
      manual_response?: string;
      context?: Record<string, any>;
    }
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('conversation_training_logs')
        .insert({
          user_id: userId,
          log_type: logType,
          ...data
        });

      if (error) {
        console.error('Error logging training data:', error);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in logTrainingData:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}

export const onboardingService = new OnboardingService();

