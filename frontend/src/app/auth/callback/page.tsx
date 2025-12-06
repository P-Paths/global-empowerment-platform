'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboardingService';
import { supabase } from '@/utils/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for hash fragments in URL (Supabase email verification)
        // This works in both browser and PWA contexts
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const searchParams = window.location.search;
          
          // Check both hash and query params (some email clients strip hash)
          const hasAuthHash = hash && (hash.includes('access_token') || hash.includes('type=email') || hash.includes('type=signup'));
          const hasAuthParams = searchParams && (searchParams.includes('access_token') || searchParams.includes('type=email'));
          
          if (hasAuthHash || hasAuthParams) {
            // Parse hash first (preferred), then fall back to query params
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            
            if (hash) {
              const hashParams = new URLSearchParams(hash.substring(1));
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }
            
            // If not in hash, check query params
            if (!accessToken && searchParams) {
              const queryParams = new URLSearchParams(searchParams);
              accessToken = queryParams.get('access_token');
              refreshToken = queryParams.get('refresh_token');
            }
            
            if (accessToken && refreshToken) {
              console.log('✅ Email verification tokens found, setting session...');
              
              // Set the session
              const { data: { session }, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error('❌ Session error:', sessionError);
                router.push('/login');
                return;
              }

              // Clear hash/query params from URL
              window.history.replaceState(null, '', window.location.pathname);

              // Wait for auth context to update
              await new Promise(resolve => setTimeout(resolve, 1500));

              // Check onboarding status
              if (session?.user) {
                try {
                  const isComplete = await onboardingService.getOnboardingStatus(session.user.id);
                  console.log('✅ Onboarding status after email verification:', { userId: session.user.id, isComplete });
                  
                  if (!isComplete) {
                    console.log('→ Redirecting to onboarding...');
                    router.push('/onboarding');
                  } else {
                    console.log('→ Redirecting to dashboard...');
                    router.push('/dashboard');
                  }
                } catch (error) {
                  console.error('❌ Error checking onboarding status:', error);
                  router.push('/onboarding');
                }
              } else {
                router.push('/login');
              }
              return;
            }
          }
        }

        // Fallback: Try to get existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          try {
            const isComplete = await onboardingService.getOnboardingStatus(session.user.id);
            if (!isComplete) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          } catch (error) {
            router.push('/onboarding');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error in callback handler:', error);
        router.push('/login');
      } finally {
        setChecking(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Verifying your account...</p>
      </div>
    </div>
  );
}

