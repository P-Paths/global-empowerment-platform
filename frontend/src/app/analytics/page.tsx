'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerification } from '@/components/EmailVerification';
import Header from '@/components/Header';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  const { user, loading, isEmailVerified } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    totalListings: 0,
    totalViews: 0,
    totalMessages: 0,
    carsSold: 0,
    totalRevenue: 0,
    averageSalePrice: 0,
    profitMargin: 0,
    geographicData: {},
    recentActivity: []
  });

  useEffect(() => {
    // Load analytics data from localStorage
    const loadAnalyticsData = () => {
      try {
        // Get listings data
        const listings = JSON.parse(localStorage.getItem('testListings') || '[]');
        const analytics = JSON.parse(localStorage.getItem('listingAnalytics') || '[]');
        
        // Calculate metrics
        const totalListings = listings.length;
        const totalViews = listings.reduce((sum: number, listing: { clicks?: number }) => sum + (listing.clicks || 0), 0);
        const totalMessages = listings.reduce((sum: number, listing: { messages?: number }) => sum + (listing.messages || 0), 0);
        const carsSold = listings.filter((listing: { soldAt?: string }) => listing.soldAt).length;
        const totalRevenue = listings.reduce((sum: number, listing: { soldFor?: number }) => sum + (listing.soldFor || 0), 0);
        const averageSalePrice = carsSold > 0 ? totalRevenue / carsSold : 0;
        
        // Calculate geographic data (simulate based on Detroit area)
        const geographicData = {
          'West Bloomfield': Math.floor(Math.random() * 15) + 5,
          'Inkster': Math.floor(Math.random() * 12) + 3,
          'Woodhaven': Math.floor(Math.random() * 10) + 2,
          'Detroit': Math.floor(Math.random() * 20) + 8,
          'Romulus': Math.floor(Math.random() * 8) + 2,
          'Taylor': Math.floor(Math.random() * 6) + 1,
          'Dearborn': Math.floor(Math.random() * 10) + 3,
          'Livonia': Math.floor(Math.random() * 7) + 2
        };
        
        // Get recent activity
        const recentActivity = analytics.slice(-10).reverse();
        
        setAnalyticsData({
          totalListings,
          totalViews,
          totalMessages,
          carsSold,
          totalRevenue,
          averageSalePrice,
          profitMargin: 15, // Simulate 15% profit margin
          geographicData,
          recentActivity
        });
      } catch (error) {
        console.error('Error loading analytics data:', error);
      }
    };

    loadAnalyticsData();
  }, []);

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
          <p className="text-gray-600 mb-6">Please sign in to access your analytics.</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>
          
          {/* New Analytics Dashboard */}
          <div className="mb-8">
            <AnalyticsDashboard />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Listing Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Listings</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{analyticsData.totalListings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Views</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{analyticsData.totalViews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Messages</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{analyticsData.totalMessages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Cars Sold</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{analyticsData.carsSold}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                  <span className="font-semibold text-green-600">${analyticsData.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Sale Price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${Math.round(analyticsData.averageSalePrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Profit Margin</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{analyticsData.profitMargin}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Geographic Analytics */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📍 Geographic Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Where your buyers are coming from</p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analyticsData.geographicData).map(([location, count]: [string, number]) => (
                <div key={location} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{location}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{count} buyers</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            {analyticsData.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.recentActivity.map((activity: { 
                  action: string; 
                  title: string; 
                  timestamp: string; 
                  soldAt?: string; 
                  editedAt?: string; 
                  deletedAt?: string; 
                  soldFor?: number; 
                }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {activity.action === 'sold' ? '🎉' : 
                         activity.action === 'edited' ? '✏️' : 
                         activity.action === 'deleted' ? '🗑️' : '📊'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action === 'sold' ? `Sold ${activity.title}` :
                           activity.action === 'edited' ? `Edited ${activity.title}` :
                           activity.action === 'deleted' ? `Deleted ${activity.title}` :
                           'Listing activity'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.soldAt || activity.editedAt || activity.deletedAt || activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {activity.soldFor && (
                      <div className="text-sm font-bold text-green-600">
                        ${activity.soldFor.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-600 dark:text-gray-400">No analytics data yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create your first listing to see analytics</p>
              </div>
            )}
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
          <Link href="/analytics" className="flex flex-col items-center py-2 text-blue-600 dark:text-blue-400">
            <span className="text-2xl">📊</span>
            <span className="text-xs mt-1">Analytics</span>
          </Link>
          <Link href="/market-intel" className="flex flex-col items-center py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <span className="text-2xl">🔍</span>
            <span className="text-xs mt-1">Market Intel</span>
          </Link>
        </div>
      </nav>
      </div>
    </ThemeProvider>
  );
}

