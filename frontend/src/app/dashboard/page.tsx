'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { EmailVerification } from '@/components/EmailVerification';
import CreateListing from '@/components/listings/CreateListing';
import Header from '@/components/Header';
import DealerMode from '@/components/DealerMode';
import DashboardListing from '@/components/DashboardListing';
import { listingsService, Listing } from '@/services/listingsService';
import { onboardingService } from '@/services/onboardingService';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    totalRevenue: 0
  });
  const [logMsg, setLogMsg] = useState<string | null>(null);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [currentMode, setCurrentMode] = useState<'solo' | 'dealer'>('solo');
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

  // Load listings from Supabase database
  useEffect(() => {
    const loadListings = async () => {
      if (!user) {
        setIsLoadingListings(false);
        return;
      }

      try {
        setIsLoadingListings(true);
        
        // Load listings and stats in parallel for better performance
        const [userListings, listingStats] = await Promise.all([
          listingsService.getUserListings(),
          listingsService.getListingStats()
        ]);
        
        console.log('Dashboard loaded listings:', userListings.length, 'listings');
        console.log('Dashboard loaded stats:', listingStats);
        
        setListings(userListings);
        setStats(listingStats);
        
        // Only show message if there are listings or if there was an error
        if (userListings.length > 0) {
          setLogMsg(`Loaded ${userListings.length} listings from database`);
        } else {
          setLogMsg(null); // Don't show "loaded 0 listings" message
        }
        
        // Skip migration for demo users to prevent quota issues
        // Migration is only needed for real users with database access
        
      } catch (error) {
        console.error('Failed to load listings:', error);
        setLogMsg('Failed to load listings from database');
      } finally {
        setIsLoadingListings(false);
      }
    };

    loadListings();
  }, [user]);

  // Refresh listings when a new one is created
  const handleListingCreated = async () => {
    try {
      // Load listings and stats in parallel for better performance
      const [userListings, listingStats] = await Promise.all([
        listingsService.getUserListings(),
        listingsService.getListingStats()
      ]);
      
      setListings(userListings);
      setStats(listingStats);
      
      setShowCreateListing(false);
      setLogMsg('New listing created successfully!');
    } catch (error) {
      console.error('Failed to refresh listings:', error);
      setLogMsg('Failed to refresh listings');
    }
  };


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
        <Header currentMode={currentMode} onModeChange={(mode) => {
          if (mode === 'dealer') {
            window.location.href = '/dealer-dashboard';
          } else {
            setCurrentMode(mode);
          }
        }} />
      
      <main className="pb-20 relative z-0">
        {logMsg && (
          <div className="mx-4 my-2 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm shadow">
            {logMsg}
            <button className="ml-4 text-xs underline" onClick={() => setLogMsg(null)}>Dismiss</button>
          </div>
        )}

        {/* Enhanced Stats */}
        <div className="px-4 py-6 relative z-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 relative z-0">
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                {isLoadingListings ? '...' : stats.activeListings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Active Listings</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                {isLoadingListings ? '...' : stats.totalListings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Listings</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                {isLoadingListings ? '...' : stats.soldListings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Cars Sold</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                ${isLoadingListings ? '...' : stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Revenue</div>
            </div>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setShowCreateListing(true)}
              className="w-full bg-blue-500 dark:bg-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors duration-200 text-center flex items-center justify-center gap-3"
            >
              📸 Post New Car
            </button>
          </div>
        </div>



        {/* Active Listings */}
        {!isLoadingListings && listings.length > 0 && (
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Listings ({listings.length})</h2>
              <Link
                href="/listings"
                className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {listings.slice(0, 6).map((listing) => (
                <DashboardListing key={listing.id} listing={listing} />
              ))}
            </div>
            {listings.length > 6 && (
              <div className="text-center mt-4">
                <Link
                  href="/listings"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  View all {listings.length} listings →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Loading state for listings */}
        {isLoadingListings && (
          <div className="px-4 mb-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your listings...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingListings && listings.length === 0 && (
          <div className="px-4 mb-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No listings yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start by posting your first car!</p>
              <button
                onClick={() => setShowCreateListing(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Your First Listing
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 overflow-x-auto">
        <div className="flex justify-around items-center min-w-max">
          <Link href="/dashboard" className="flex flex-col items-center py-2 px-1 text-blue-600 dark:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🏠</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Home</span>
          </Link>
          <Link href="/listings" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🚗</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Listings</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">💬</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Messages</span>
          </Link>
          <Link href="/analytics" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">📊</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Analytics</span>
          </Link>
          <Link href="/market-intel" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🔍</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Intel</span>
          </Link>
          <Link href="/dashboard/connections" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🔗</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Links</span>
          </Link>
        </div>
      </nav>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <CreateListing 
          onClose={() => setShowCreateListing(false)}
          onListingCreated={handleListingCreated}
        />
      )}
      </div>
    </ThemeProvider>
  );
}