'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { EmailVerification } from '@/components/EmailVerification';
import CreateListing from '@/components/listings/CreateListing';
import Header from '@/components/Header';
import CompactListing from '@/components/CompactListing';
import DealerMode from '@/components/DealerMode';
import { listingsService, Listing } from '@/services/listingsService';

export default function DealerDashboard() {
  const { user, loading, isEmailVerified } = useAuth();
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

  // Refresh listings when a new one is created
  const handleListingCreated = () => {
    // Reload listings from database
    const loadListings = async () => {
      if (!user) {
        setIsLoadingListings(false);
        return;
      }
      try {
        setIsLoadingListings(true);
        const userListings = await listingsService.getUserListings();
        setListings(userListings);
        
        // Calculate stats
        const totalListings = userListings.length;
        const activeListings = userListings.filter(l => l.status === 'active').length;
        const soldListings = userListings.filter(l => l.status === 'sold').length;
        const totalRevenue = userListings
          .filter(l => l.status === 'sold' && l.price)
          .reduce((sum, l) => sum + l.price, 0);
        
        setStats({
          totalListings,
          activeListings,
          soldListings,
          totalRevenue
        });
      } catch (error) {
        console.error('Error loading listings:', error);
        setLogMsg('Error loading listings. Please try again.');
      } finally {
        setIsLoadingListings(false);
      }
    };
    loadListings();
    setShowCreateListing(false);
  };

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
        
        setListings(userListings);
        setStats(listingStats);
        
        // Only show message if there are listings or if there was an error
        if (userListings.length > 0) {
          setLogMsg(`Loaded ${userListings.length} listings from database`);
        } else {
          setLogMsg(null); // Don't show "loaded 0 listings" message
        }
        
        // Run migration in background after initial load (non-blocking)
        setTimeout(async () => {
          try {
            await listingsService.migrateLocalStorageData();
          } catch (error) {
            console.log('Background migration completed or failed:', error);
          }
        }, 100);
        
      } catch (error) {
        console.error('Failed to load listings:', error);
        setLogMsg('Failed to load listings from database');
      } finally {
        setIsLoadingListings(false);
      }
    };

    loadListings();
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
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
          <p className="text-gray-600 mb-6">Please sign in to access your dealer dashboard.</p>
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
        <Header currentMode="dealer" onModeChange={(mode) => {
          if (mode === 'solo') {
            window.location.href = '/dashboard';
          }
        }} />
      
      <main className="pb-20">
        {logMsg && (
          <div className="mx-4 my-2 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm shadow">
            {logMsg}
            <button className="ml-4 text-xs underline" onClick={() => setLogMsg(null)}>Dismiss</button>
          </div>
        )}

        {/* Dealer Header */}
        <div className="px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🏢 Dealer Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your entire inventory with AI-powered listings
            </p>
          </div>
          
          {/* Post Vehicle Button */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowCreateListing(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              🚗 Post Vehicle
            </button>
          </div>
        </div>

        {/* Inventory Management Blocks */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Upload Inventory</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Bulk import via CSV</p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Open CSV import functionality
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setLogMsg(`CSV file selected: ${file.name}. Processing...`);
                    }
                  };
                  input.click();
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Choose CSV File
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Check Inventory</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">View all vehicles</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/listings'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats for Dealers */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
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
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Inventory</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                {isLoadingListings ? '...' : stats.soldListings}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Vehicles Sold</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                ${isLoadingListings ? '...' : stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Revenue</div>
            </div>
          </div>
        </div>


        {/* Inventory Overview - Compact Horizontal Layout */}
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
            <div className="space-y-2">
              {listings.slice(0, 6).map((listing) => (
                <CompactListing key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingListings && listings.length === 0 && (
          <div className="px-4 mb-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No inventory yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start by adding your first vehicle!</p>
              <button
                onClick={() => setShowCreateListing(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Your First Vehicle
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex justify-around items-center">
          <Link href="/dealer-dashboard" className="flex flex-col items-center py-2 text-blue-600 dark:text-blue-400">
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/listings" className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span className="text-2xl">🚗</span>
            <span className="text-xs mt-1">Listings</span>
          </Link>
          <Link href="/messages" className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span className="text-2xl">💬</span>
            <span className="text-xs mt-1">Messages</span>
          </Link>
          <Link href="/analytics" className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span className="text-2xl">📊</span>
            <span className="text-xs mt-1">Analytics</span>
          </Link>
          <Link href="/market-intel" className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span className="text-2xl">🔍</span>
            <span className="text-xs mt-1">Market Intel</span>
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
