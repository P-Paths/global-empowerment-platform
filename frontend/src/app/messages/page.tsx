'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { EmailVerification } from '@/components/EmailVerification';
import Header from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';

export default function MessagesPage() {
  const { user, loading, isEmailVerified } = useAuth();
  const { isDarkMode } = useTheme();

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
          <p className="text-gray-600 mb-6">Please sign in to access your messages.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
      
      <main className="pb-20">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Messages</h1>
          
          <div className="space-y-4">
            {/* Mock Conversations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💬 Active Conversations</h3>
              
              {/* Conversation 1 */}
              <div className="border rounded-lg p-4 mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      J
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Janie on Facebook</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2019 Honda Civic • 2 minutes ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Ready to Buy
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200">"Hi! I'm interested in your Honda Civic. I have pre-approved financing and can come see it today. What's your best price?"</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From: Janie K. • 2 minutes ago</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">🤖 AI Agent Response:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">"Great! I can offer $18,200 for today's viewing. When would you like to schedule?"</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Auto-sent • 1 minute ago</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border-l-4 border-amber-400">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">👤 Human-in-the-Loop:</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">✅ Approved AI response - Good negotiation strategy</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">You approved • 30 seconds ago</p>
                  </div>
                </div>
              </div>

              {/* Conversation 2 */}
              <div className="border rounded-lg p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                      M
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Mike on Craigslist</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2017 Nissan Altima • 15 minutes ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Negotiating
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200">"Can I get more photos of the interior? Also, what's the lowest you'll take?"</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From: Mike R. • 15 minutes ago</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">🤖 AI Agent Response:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">"I can send more photos. My firm price is $12,500 - that's already below market value."</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Auto-sent • 12 minutes ago</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border-l-4 border-amber-400">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">👤 Human-in-the-Loop:</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">✅ Approved AI response - Good price positioning</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">You approved • 10 minutes ago</p>
                  </div>
                </div>
              </div>

              {/* Conversation 3 */}
              <div className="border rounded-lg p-4 mb-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      S
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Sarah on Facebook</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2020 Toyota Camry • 1 hour ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                    Scheduled
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200">"I'd like to schedule a test drive for tomorrow at 2pm. I'm pre-approved for $22,000."</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From: Sarah W. • 1 hour ago</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">🤖 AI Agent Response:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">"Perfect! 2pm tomorrow works. I'll send you the address. The car is priced at $22,500."</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Auto-sent • 55 minutes ago</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border-l-4 border-amber-400">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">👤 Human-in-the-Loop:</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">✅ Approved AI response - Good scheduling</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">You approved • 50 minutes ago</p>
                  </div>
                </div>
              </div>

              {/* Conversation 4 */}
              <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                      T
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Tom on Craigslist</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">2018 Ford F-150 • 3 hours ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs rounded-full">
                    Filtered Out
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200">"Is this still available? I'm looking for a truck under $25k. Can you send more pics?"</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From: Tom R. • 3 hours ago</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-red-400">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">🚫 AI Filtered:</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Low-quality inquiry - Generic message, no specific interest</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Auto-filtered • 3 hours ago</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border-l-4 border-amber-400">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">👤 Human-in-the-Loop:</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">✅ Confirmed filter - Good call by AI</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">You confirmed • 2 hours ago</p>
                  </div>
                </div>
              </div>
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
          <Link href="/messages" className="flex flex-col items-center py-2 text-blue-600 dark:text-blue-400">
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
      </div>
  );
}
