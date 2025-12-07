'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsListing {
  id: string;
  title: string;
  price: number;
  soldFor?: number;
  soldTo?: string;
  soldAt?: string;
  deletedAt?: string;
  action: 'sold' | 'deleted';
  images: string[];
  mileage: string;
  titleStatus: string;
  postedAt: string;
  clicks?: number;
  messages?: number;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsListing[]>([]);
  const [filter, setFilter] = useState<'all' | 'sold' | 'deleted'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const savedAnalytics = localStorage.getItem('listingAnalytics');
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics));
    }
  }, []);

  const filteredAnalytics = analytics.filter(item => {
    if (filter === 'all') return true;
    return item.action === filter;
  });

  const totalRevenue = analytics
    .filter(item => item.action === 'sold' && item.soldFor)
    .reduce((sum, item) => sum + (item.soldFor || 0), 0);

  const totalListings = analytics.length;
  const soldCount = analytics.filter(item => item.action === 'sold').length;
  const deletedCount = analytics.filter(item => item.action === 'deleted').length;

  const clearAnalytics = () => {
    localStorage.removeItem('listingAnalytics');
    setAnalytics([]);
    setShowClearConfirm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Analytics
        </h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Clear All Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            {totalListings}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Total Actions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">
            {soldCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Cars Sold</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600 dark:text-red-300">
            {deletedCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Listings Deleted</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Total Revenue</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All ({totalListings})
        </button>
        <button
          onClick={() => setFilter('sold')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'sold'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Sold ({soldCount})
        </button>
        <button
          onClick={() => setFilter('deleted')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'deleted'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Deleted ({deletedCount})
        </button>
      </div>

      {/* Analytics List */}
      <div className="space-y-4">
        {filteredAnalytics.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No {filter === 'all' ? '' : filter} data available
          </div>
        ) : (
          filteredAnalytics.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.action === 'sold'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {item.action === 'sold' ? '✅ Sold' : '🗑️ Deleted'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        #{item.id.slice(-6)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      ${item.price.toLocaleString()} • {item.mileage} miles • {item.titleStatus} title
                    </div>
                    
                    {item.action === 'sold' && item.soldFor && (
                      <div className="text-sm text-green-600 dark:text-green-300 font-medium mb-1">
                        Sold for: ${item.soldFor.toLocaleString()} to {item.soldTo}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Posted: {formatDate(item.postedAt)}
                      {item.action === 'sold' && item.soldAt && (
                        <span> • Sold: {formatDate(item.soldAt)}</span>
                      )}
                      {item.action === 'deleted' && item.deletedAt && (
                        <span> • Deleted: {formatDate(item.deletedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  {item.images.length > 0 && (
                    <div className="ml-4">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                🗑️ Clear Analytics Data
              </h3>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to clear all analytics data? This will permanently delete all sold and deleted listing records.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearAnalytics}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
