'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { EmailVerification } from '@/components/EmailVerification';
import Header from '@/components/Header';
import { onboardingService } from '@/services/onboardingService';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();
  const [logMsg, setLogMsg] = useState<string | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      // Wait for auth to finish loading
      if (loading) return;
      
      // If no user, redirect to login
      if (!user) {
        router.push('/login');
        setCheckingOnboarding(false);
        return;
      }

      // User exists, check onboarding status
      try {
        console.log('🔍 Dashboard: Checking onboarding status for user:', user.id);
        const isComplete = await onboardingService.getOnboardingStatus(user.id);
        console.log('📊 Dashboard: Onboarding status check result:', { userId: user.id, isComplete });
        
        if (!isComplete) {
          console.log('⚠️ Dashboard: Onboarding NOT complete - redirecting to /onboarding');
          // Always redirect to onboarding if not complete
          router.push('/onboarding');
          setCheckingOnboarding(false);
          return;
        }
        
        // Onboarding is complete, allow dashboard to load
        console.log('✅ Dashboard: Onboarding complete - loading dashboard');
        setCheckingOnboarding(false);
      } catch (error) {
        console.error('❌ Dashboard: Error checking onboarding status:', error);
        // If error, assume onboarding not complete and redirect
        console.log('⚠️ Dashboard: Error occurred - redirecting to /onboarding as fallback');
        router.push('/onboarding');
        setCheckingOnboarding(false);
        return;
      }
    };

    checkOnboarding();
  }, [user, loading, router]);

  // GEM Platform dashboard - no car listings needed


  // Show loading state
  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show email verification if user is not verified
  if (user && !isEmailVerified) {
    return <EmailVerification email={user.email || ''} />;
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <div className="space-y-3">
            <Link 
              href="/login" 
              className="inline-block w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="inline-block w-full border border-amber-500 text-amber-600 py-3 px-6 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
          <div className="mt-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
      
      <main className="pb-20 relative z-0">
        {logMsg && (
          <div className="mx-4 my-2 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm shadow">
            {logMsg}
            <button className="ml-4 text-xs underline" onClick={() => setLogMsg(null)}>Dismiss</button>
          </div>
        )}

        {/* GEM Platform Dashboard - Welcome Section */}
        <div className="px-4 py-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to GEM Platform</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your dashboard for growing your digital influence and preparing for funding.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Link href="/feed" className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-semibold text-gray-900 dark:text-white">Community Feed</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connect with members</div>
              </Link>
              <Link href="/growth" className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-semibold text-gray-900 dark:text-white">Growth Coach</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI-powered tasks</div>
              </Link>
              <Link href="/funding-score" className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold text-gray-900 dark:text-white">Funding Score</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Track readiness</div>
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 overflow-x-auto">
        <div className="flex justify-around items-center min-w-max">
          <Link href="/dashboard" className="flex flex-col items-center py-2 px-1 text-blue-600 dark:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🏠</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Home</span>
          </Link>
          <Link href="/feed" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">📱</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Feed</span>
          </Link>
          <Link href="/growth" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">📈</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Growth</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">💬</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Messages</span>
          </Link>
          <Link href="/funding-score" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">💰</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Funding</span>
          </Link>
          <Link href="/dashboard/connections" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🔗</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Links</span>
          </Link>
        </div>
      </nav>

      </div>
    </ThemeProvider>
  );
}