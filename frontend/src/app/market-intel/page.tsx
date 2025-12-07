'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerification } from '@/components/EmailVerification';
import Header from '@/components/Header';
import { ThemeProvider } from '@/contexts/ThemeContext';
import SimpleMarketSearch from '@/components/SimpleMarketSearch';
import HotCarsSection from '@/components/HotCarsSection';

export default function MarketIntelPage() {
  const { user, loading, isEmailVerified } = useAuth();
  const [showMarketSearch, setShowMarketSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Load search history
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const response = await fetch('/api/v1/search-history');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSearchHistory(data.history);
          }
        }
      } catch (error) {
        console.log('Failed to load search history:', error);
      }
    };

    if (user) {
      loadSearchHistory();
    }
  }, [user]);

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
          <p className="text-gray-600 mb-6">Please sign in to access market intelligence.</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Market Price Search</h1>
          
          <div className="space-y-6">
            {/* Hot Cars Section */}
            <HotCarsSection />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search Car Prices</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Search the market to see what cars are selling for in your area. Get real prices from multiple sources.
              </p>
              <button
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                onClick={() => setShowMarketSearch(true)}
              >
                🔍 Search Market Prices
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saved Car Searches</h3>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
              {searchHistory.length > 0 ? (
                <div className="space-y-4">
                  {searchHistory.map((search, index) => (
                    <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-4">
                        {/* Car Photo */}
                        <div className="flex-shrink-0">
                          <img 
                            src={search.carPhotoUrl} 
                            alt={`${search.make} ${search.model}`}
                            className="w-20 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=80&h=64&fit=crop&crop=center&auto=format&q=80';
                            }}
                          />
                        </div>
                        
                        {/* Search Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 truncate">
                              {search.year} {search.make} {search.model}
                            </h4>
                            <span className="text-xs text-blue-600 dark:text-blue-300">
                              {search.isGoogleSearch ? '🔍 Google Search' : '📊 Market Data'}
                            </span>
                          </div>
                          
                          <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                            <div>📍 {search.location} • {search.radius} miles</div>
                            <div>🔗 {search.resultCount} search results • {search.sources?.length || 0} sources</div>
                            {search.averagePrice > 0 && (
                              <div>💰 ${search.averagePrice.toLocaleString()} avg • ${search.priceRange?.min?.toLocaleString()} - ${search.priceRange?.max?.toLocaleString()}</div>
                            )}
                            <div>⏰ {new Date(search.timestamp).toLocaleString()}</div>
                          </div>
                          
                          {/* Quick Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                // Pre-fill the search form with this search
                                setShowMarketSearch(true);
                                // You could pass the search data to the modal here
                              }}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                            >
                              🔍 Search Again
                            </button>
                            {search.isDirectListings && (
                              <a
                                href={`/market-intel`}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                              >
                                🔍 View Listings
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🚗</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No saved searches yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Your market searches will be saved here automatically</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex justify-around items-center">
          <Link href="/dashboard" className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
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
          <Link href="/market-intel" className="flex flex-col items-center py-2 text-blue-600 dark:text-blue-400">
            <span className="text-2xl">🔍</span>
            <span className="text-xs mt-1">Market Intel</span>
          </Link>
        </div>
      </nav>

      {/* Market Search Modal */}
      {showMarketSearch && (
        <SimpleMarketSearch onClose={() => setShowMarketSearch(false)} />
      )}
      </div>
    </ThemeProvider>
  );
}
