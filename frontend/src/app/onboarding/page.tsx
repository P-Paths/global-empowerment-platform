'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingContainer from '@/components/onboarding/OnboardingContainer';
import { onboardingService } from '@/services/onboardingService';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Wait for auth to finish loading
      if (loading) {
        console.log('⏳ Auth still loading...');
        return;
      }
      
      console.log('🔍 Checking onboarding status...', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        emailConfirmed: !!user?.email_confirmed_at
      });

      // If no user, redirect to login
      if (!user) {
        console.log('❌ No user found - redirecting to login');
        router.push('/login');
        setCheckingOnboarding(false);
        return;
      }

      // User exists, verify they actually exist in database (not just cached session)
      try {
        console.log('🔍 Checking if onboarding is complete for user:', user.id);
        const isComplete = await onboardingService.getOnboardingStatus(user.id);
        console.log('📊 Onboarding status:', { userId: user.id, isComplete });
        
        // If getOnboardingStatus returns false, it could mean:
        // 1. Profile doesn't exist (user was deleted)
        // 2. onboarding_complete is false/null
        // We need to verify the user actually exists
        
        // Check if profile exists by trying to get it
        const { supabase } = await import('@/utils/supabase');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError || !profile) {
          // Profile doesn't exist - user was deleted or doesn't exist
          console.log('❌ Profile does not exist - user may have been deleted. Clearing session and redirecting to login');
          // Clear the invalid session
          await supabase.auth.signOut();
          router.push('/login');
          setCheckingOnboarding(false);
          return;
        }
        
        if (isComplete) {
          // Already completed, redirect to dashboard
          console.log('✅ Onboarding already complete - redirecting to dashboard');
          router.push('/dashboard');
          return;
        } else {
          console.log('🆕 Onboarding not complete - user can proceed');
        }
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
        // If there's an error checking, verify user exists
        try {
          const { supabase } = await import('@/utils/supabase');
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!profile) {
            console.log('❌ Profile does not exist - clearing session');
            await supabase.auth.signOut();
            router.push('/login');
            setCheckingOnboarding(false);
            return;
          }
        } catch (verifyError) {
          console.error('Error verifying profile:', verifyError);
        }
        // If profile exists, continue with onboarding
        console.log('⚠️ Error checking status but profile exists - continuing with onboarding');
      }
      setCheckingOnboarding(false);
    };

    checkOnboarding();
  }, [user, loading, router]);

  // Show loading state while checking auth or onboarding
  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect in useEffect above)
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <OnboardingContainer onComplete={handleComplete} />
  );
}

