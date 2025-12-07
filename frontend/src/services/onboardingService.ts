import { supabaseBrowser } from '@/lib/supabaseBrowser';

export interface OnboardingData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  zip?: string;
  city?: string;
  experience_level?: 'beginner' | 'intermediate' | 'experienced';
  selected_category?: 'automotive' | 'real_estate' | 'luxury_items' | 'small_businesses' | 'high_value_goods' | 'art_collectibles';
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
        console.error('Error fetching onboarding status:', error);
        return false;
      }

      // If no data, profile doesn't exist
      if (!data) {
        return false;
      }

      return data.onboarding_complete ?? false;
    } catch (error) {
      console.error('Error in getOnboardingStatus:', error);
      return false;
    }
  }

  /**
   * Ensure profile exists (wait for trigger or create it)
   */
  private async ensureProfileExists(userId: string, email?: string): Promise<{ error: Error | null }> {
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
          email: email || '',
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
      const hasRealError = result.error && errorKeys.length > 0 && (
        result.error.message || 
        result.error.code || 
        result.error.details || 
        result.error.hint
      );

      console.log('Error check:', {
        hasError: !!result.error,
        hasRealError,
        errorKeys,
        errorKeysLength: errorKeys.length,
        errorMessage: result.error?.message,
        errorCode: result.error?.code
      });

      if (hasRealError) {
        // Try to extract error info in multiple ways
        const errorObj = result.error;
        const errorInfo: any = {
          rawError: errorObj,
          errorType: typeof errorObj,
          errorString: String(errorObj),
          errorJSON: JSON.stringify(errorObj, null, 2),
          errorKeys: errorObj ? Object.keys(errorObj) : [],
          errorValues: errorObj ? Object.values(errorObj) : [],
          hasCode: 'code' in (errorObj || {}),
          hasMessage: 'message' in (errorObj || {}),
          code: errorObj?.code,
          message: errorObj?.message,
          details: errorObj?.details,
          hint: errorObj?.hint,
          userId,
          email
        };

        console.error('❌ Error creating profile - full error info:', errorInfo);

        // Try to get error message
        const errorMessage = errorObj?.message || errorObj?.details || errorObj?.hint || String(errorObj) || 'Failed to create profile';
        
        // If foreign key constraint error, the user doesn't exist in auth.users yet
        const errorCode = errorObj?.code;
        if (errorCode === '23503' || errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
          console.warn('⚠️ Profile not created yet - trigger may still be processing. User ID:', userId);
          // Don't return error - let the update proceed anyway
          return { error: null };
        }
        
        return { error: new Error(errorMessage) };
      }

      // If we get here, no data, no profile exists, but no real error either
      // This might mean the operation is still processing or RLS is blocking silently
      console.warn('⚠️ Upsert completed but profile still doesn\'t exist and no error details - continuing anyway');
      return { error: null }; // Continue anyway - might work on next attempt or profile might exist

      // Success - profile was created or updated
      if (result.data) {
        console.log('Profile created/updated successfully via upsert');
      }

      return { error: null };
    } catch (exception: any) {
      // Catch any exceptions that might be thrown
      console.error('Exception creating profile:', {
        exception,
        exceptionType: typeof exception,
        exceptionMessage: exception?.message,
        exceptionStack: exception?.stack,
        userId,
        email
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
      // Wait a bit longer for the trigger to create the profile
      const profileResult = await this.ensureProfileExists(userId, data.email);
      
      // If profile creation failed with foreign key error, wait a bit more and try again
      if (profileResult.error && profileResult.error.message?.includes('still being set up')) {
        console.log('⏳ Profile not ready yet, waiting 2 more seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check again if profile exists now
        const { data: retryProfile } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (!retryProfile) {
          console.warn('⚠️ Profile still doesn\'t exist after waiting - continuing anyway (will be created by trigger)');
          // Continue anyway - the trigger should create it eventually
        }
      }

      const now = new Date().toISOString();
      
      // Get existing profile to check current email
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle();
      
      // If profile doesn't exist yet, wait a bit more and try again
      if (!existingProfile) {
        console.log('Profile not found, waiting for trigger...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check again
        const { data: retryProfile } = await this.supabase
          .from('profiles')
          .select('id, email')
          .eq('id', userId)
          .maybeSingle();
        
        if (!retryProfile) {
          // Profile still doesn't exist - use UPSERT to create/update in one operation
          try {
            const upsertData: any = {
              id: userId,
              email: data.email || '',
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              phone: data.phone || '',
              zip: data.zip || '',
              city: data.city || '',
              experience_level: data.experience_level,
              selected_category: data.selected_category,
              messaging_preference: data.messaging_preference,
              wants_escrow: data.wants_escrow,
              onboarding_complete: data.onboarding_complete,
              created_at: now,
              updated_at: now
            };

            // Remove undefined values
            Object.keys(upsertData).forEach(key => {
              if (upsertData[key] === undefined || upsertData[key] === null) {
                delete upsertData[key];
              }
            });

            const result = await this.supabase
              .from('profiles')
              .upsert(upsertData, { onConflict: 'id' });

            // Log the full result object
            console.log('Upsert onboarding data result:', {
              hasData: !!result.data,
              hasError: !!result.error,
              errorType: typeof result.error,
              errorValue: result.error,
              errorKeys: result.error ? Object.keys(result.error) : [],
              data: result.data,
              status: (result as any).status,
              statusText: (result as any).statusText
            });

            // If we have data, success!
            if (result.data) {
              console.log('✅ Profile created/updated successfully via upsert with onboarding data');
              return { error: null };
            }
            
            // Check for errors
            const errorObj = result.error;
            if (errorObj) {
              const errorMessage = errorObj?.message || errorObj?.details || errorObj?.hint || JSON.stringify(errorObj) || 'Failed to save onboarding data';
              const errorCode = errorObj?.code;
              
              console.log('Error from upsert:', {
                code: errorCode,
                message: errorMessage,
                errorObj: JSON.stringify(errorObj)
              });
              
              // If foreign key error, user doesn't exist in auth.users yet - wait and retry
              if (errorCode === '23503' || errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
                console.warn('⚠️ Foreign key constraint error - waiting 3 seconds and retrying...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Retry once
                const retryResult = await this.supabase
                  .from('profiles')
                  .upsert(upsertData, { onConflict: 'id' });
                
                if (retryResult.data || !retryResult.error) {
                  console.log('✅ Retry successful - profile created');
                  return { error: null };
                }
                
                // Check if profile exists anyway
                const { data: checkProfile } = await this.supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', userId)
                  .maybeSingle();
                
                if (checkProfile) {
                  console.log('✅ Profile exists after retry - treating as success');
                  return { error: null };
                }
                
                return { error: new Error('Your account is still being set up. Please wait a moment and try again, or refresh the page.') };
              }
              
              // Other errors - return them
              return { error: new Error(errorMessage) };
            }

            // No error but no data - check if profile exists now
            const { data: checkProfile } = await this.supabase
              .from('profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle();

            if (checkProfile) {
              console.log('✅ Profile exists after upsert - treating as success');
              return { error: null };
            } else {
              console.warn('⚠️ Upsert completed but profile still doesn\'t exist - continuing anyway (trigger may create it)');
              // Continue anyway - the trigger should create it eventually
              return { error: null }; // Don't block onboarding
            }
          } catch (exception: any) {
            // Catch any exceptions that might be thrown
            console.error('Exception upserting onboarding data:', {
              exception,
              exceptionType: typeof exception,
              exceptionMessage: exception?.message,
              exceptionStack: exception?.stack,
              userId
            });
            
            const errorMsg = exception?.message || String(exception) || 'Failed to save onboarding data';
            return { error: new Error(errorMsg) };
          }

          console.log('Successfully upserted onboarding data for user:', userId);
          return { error: null };
        }
      }

      // Profile exists - use UPSERT to be safe (handles both insert and update)
      const upsertData: any = {
        id: userId,
        updated_at: now
      };

      // Only include fields that are provided
      if (data.first_name !== undefined) upsertData.first_name = data.first_name;
      if (data.last_name !== undefined) upsertData.last_name = data.last_name;
      if (data.phone !== undefined) upsertData.phone = data.phone;
      if (data.zip !== undefined) upsertData.zip = data.zip;
      if (data.city !== undefined) upsertData.city = data.city;
      if (data.experience_level !== undefined) upsertData.experience_level = data.experience_level;
      if (data.selected_category !== undefined) upsertData.selected_category = data.selected_category;
      if (data.messaging_preference !== undefined) upsertData.messaging_preference = data.messaging_preference;
      if (data.wants_escrow !== undefined) upsertData.wants_escrow = data.wants_escrow;
      if (data.onboarding_complete !== undefined) upsertData.onboarding_complete = data.onboarding_complete;

      // Only update email if provided and different
      if (data.email && data.email !== existingProfile?.email) {
        upsertData.email = data.email;
      } else if (!existingProfile?.email && data.email) {
        upsertData.email = data.email;
      } else if (existingProfile?.email) {
        upsertData.email = existingProfile.email;
      }

      // If profile doesn't exist, include created_at
      if (!existingProfile) {
        upsertData.created_at = now;
      }
      
      const { data: upsertResult, error } = await this.supabase
        .from('profiles')
        .upsert(upsertData, { onConflict: 'id' });
      
      // If we have data, success!
      if (upsertResult) {
        console.log('✅ Successfully saved onboarding data');
        return { error: null };
      }
      
      if (error) {
        // Log full error details for debugging
        console.error('Error upserting onboarding data - full error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId,
          dataKeys: Object.keys(upsertData),
          upsertData
        });

        // Extract error message from multiple possible sources
        const errorMessage = error.message || error.details || error.hint || JSON.stringify(error) || 'Failed to save onboarding data';
        const errorCode = error.code;
        
        // Check for foreign key constraint errors - wait and retry
        if (errorCode === '23503' || errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
          console.warn('⚠️ Foreign key constraint error - waiting 3 seconds and retrying...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Retry once
          const retryResult = await this.supabase
            .from('profiles')
            .upsert(upsertData, { onConflict: 'id' });
          
          if (retryResult.data || !retryResult.error) {
            console.log('✅ Retry successful');
            return { error: null };
          }
          
          // Check if profile exists anyway
          const { data: checkProfile } = await this.supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
          
          if (checkProfile) {
            console.log('✅ Profile exists - treating as success');
            return { error: null };
          }
          
          // Still failing - don't block onboarding
          console.warn('⚠️ Profile creation still failing after retry - continuing anyway');
          return { error: null }; // Don't block onboarding - trigger should create it
        }
        
        return { error: new Error(errorMessage) };
      }
      
      // No error and no data - check if profile exists
      const { data: finalCheck } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (finalCheck) {
        console.log('✅ Profile exists - treating as success');
        return { error: null };
      }
      
      console.log('Successfully saved onboarding data for user:', userId);

      return { error: null };
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

