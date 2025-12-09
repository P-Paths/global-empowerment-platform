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
        // Check if this is a demo user (demo login)
        const isDemoUser = user.id === '00000000-0000-0000-0000-000000000123';
        
        console.log('🔍 Checking if onboarding is complete for user:', user.id, { isDemoUser });
        const isComplete = await onboardingService.getOnboardingStatus(user.id);
        console.log('📊 Onboarding status:', { userId: user.id, isComplete });
        
        // For demo users, skip profile existence check and allow onboarding
        if (isDemoUser) {
          if (isComplete) {
            console.log('✅ Demo user onboarding complete - redirecting to dashboard');
            router.push('/dashboard');
            return;
          } else {
            console.log('🆕 Demo user - onboarding not complete, allowing to proceed');
            setCheckingOnboarding(false);
            return;
          }
        }
        
        // For real users, verify profile exists
        // Check if profile exists by trying to get it
        const { supabase } = await import('@/utils/supabase');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError || !profile) {
          // Profile doesn't exist - but don't sign out, allow onboarding to create it
          console.log('⚠️ Profile does not exist yet - allowing onboarding to create it');
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
          setCheckingOnboarding(false);
        }
      } catch (error) {
        console.warn('⚠️ Error checking onboarding status:', error);
        // For demo users, always allow onboarding
        const isDemoUser = user.id === '00000000-0000-0000-0000-000000000123';
        if (isDemoUser) {
          console.log('Demo user - allowing onboarding despite error');
          setCheckingOnboarding(false);
          return;
        }
        
        // For real users with errors, still allow onboarding (fail gracefully)
        // Don't sign out - let onboarding create the profile
        console.log('⚠️ Error checking onboarding, but allowing user to proceed');
        setCheckingOnboarding(false);
      }
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

