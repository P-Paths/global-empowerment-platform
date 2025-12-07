'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerification } from '@/components/EmailVerification';
import DashboardListing from '@/components/DashboardListing';
import CreateListing from '@/components/listings/CreateListing';
import Header from '@/components/Header';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function ListingsPage() {
  const { user, loading, isEmailVerified } = useAuth();
  const [testListings, setTestListings] = useState<any[]>([]);
  const [showCreateListing, setShowCreateListing] = useState(false);

  // Load test listings from localStorage
  useEffect(() => {
    const savedTestListings = localStorage.getItem('demoListings');
    if (savedTestListings) {
      setTestListings(JSON.parse(savedTestListings));
    }
  }, []);

  // Listen for storage changes to update test listings
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTestListings = localStorage.getItem('demoListings');
      if (savedTestListings) {
        setTestListings(JSON.parse(savedTestListings));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Refresh listings when a new one is created
  const handleListingCreated = () => {
    const savedTestListings = localStorage.getItem('demoListings');
    if (savedTestListings) {
      setTestListings(JSON.parse(savedTestListings));
    }
    setShowCreateListing(false);
  };

  // Show loading state
  if (loading) {
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
          <p className="text-gray-600 mb-6">Please sign in to access your listings.</p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
      
      <main className="pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Listings</h1>
            <Link 
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + New Listing
            </Link>
          </div>

          {testListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testListings.map((listing) => (
                <DashboardListing key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚗</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No listings yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first listing to get started</p>
              <button 
                onClick={() => setShowCreateListing(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Create First Listing
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 overflow-x-auto">
        <div className="flex justify-around items-center min-w-max">
          <Link href="/dashboard" className="flex flex-col items-center py-2 px-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 min-w-[60px]">
            <span className="text-xl sm:text-2xl">🏠</span>
            <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Home</span>
          </Link>
          <Link href="/listings" className="flex flex-col items-center py-2 px-1 text-blue-600 dark:text-blue-400 min-w-[60px]">
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
