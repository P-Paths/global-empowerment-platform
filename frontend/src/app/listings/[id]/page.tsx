'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  mileage: string;
  titleStatus: string;
  postedAt: string;
  status: string;
  platforms?: string[];
  messages?: number;
  clicks?: number;
  soldAt?: string;
  soldFor?: number;
  soldTo?: string;
  detectedFeatures?: string[];
  aiAnalysis?: string;
  finalDescription?: string;
  make?: string;
  model?: string;
  year?: string;
  city?: string;
  zipCode?: string;
}

export default function ListingPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleData, setSaleData] = useState({
    soldFor: '',
    soldTo: ''
  });

  useEffect(() => {
    // Load listing from localStorage (in real app, this would be an API call)
    const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
    const foundListing = existingListings.find((l: Listing) => l.id === listingId);
    
    if (foundListing) {
      setListing(foundListing);
    }
    setLoading(false);
  }, [listingId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextPhoto = () => {
    if (listing) {
      setCurrentPhotoIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevPhoto = () => {
    if (listing) {
      setCurrentPhotoIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Listing Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The listing you're looking for doesn't exist.</p>
          <Link 
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Listing Details
              </h1>
            </div>
            <Link 
              href="/dashboard"
              className="text-2xl font-bold text-blue-600 hover:text-blue-700"
            >
              Accorria
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={listing.images[currentPhotoIndex]}
                    alt={`${listing.title} - Image ${currentPhotoIndex + 1}`}
                    className="w-full h-96 object-cover"
                    width={800}
                    height={400}
                  />
                </div>
                
                {/* Navigation */}
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      ›
                    </button>
                  </>
                )}
                
                {/* Photo Counter */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} of {listing.images.length}
                </div>
              </div>
              
              {/* Thumbnails */}
              {listing.images.length > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2 overflow-x-auto">
                    {listing.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentPhotoIndex ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          width={80}
                          height={64}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {listing.title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Make:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.make || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Year:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.year || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.mileage} miles</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Title Status:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.titleStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {listing.city && listing.zipCode ? `${listing.city}, ${listing.zipCode}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Listing Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Listed Price:</span>
                      <span className="font-bold text-green-600 text-lg">${listing.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Posted:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(listing.postedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        listing.soldAt 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {listing.soldAt ? 'Sold' : 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Views:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.clicks || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Messages:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{listing.messages || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {listing.finalDescription || listing.description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platforms */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posted To</h3>
              <div className="space-y-3">
                {listing.platforms && listing.platforms.length > 0 ? (
                  listing.platforms.map((platform, index) => {
                    const platformInfo = {
                      'facebook_marketplace': { name: 'Facebook Marketplace', icon: '📘', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
                      'craigslist': { name: 'Craigslist', icon: '📋', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
                      'offerup': { name: 'OfferUp', icon: '📱', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
                      'ebay': { name: 'eBay Motors', icon: '🛒', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
                      'autotrader': { name: 'AutoTrader', icon: '🚗', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
                      'cars_com': { name: 'Cars.com', icon: '🚙', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300' },
                      'cargurus': { name: 'CarGurus', icon: '🔍', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
                      'vroom': { name: 'Vroom', icon: '💨', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' }
                    };
                    const info = platformInfo[platform as keyof typeof platformInfo];
                    if (!info) {
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="text-2xl">📱</span>
                          <span className="font-medium text-gray-900 dark:text-white">{platform}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${info.color}`}>
                        <span className="text-2xl">{info.icon}</span>
                        <span className="font-medium">{info.name}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No platforms specified</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const newMessages = (listing.messages || 0) + 1;
                    const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                    const updatedListings = existingListings.map((l: Listing) => 
                      l.id === listing.id ? { ...l, messages: newMessages } : l
                    );
                    localStorage.setItem('testListings', JSON.stringify(updatedListings));
                    setListing(prev => prev ? { ...prev, messages: newMessages } : null);
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  📱 Message ({listing.messages || 0})
                </button>
                
                <button 
                  onClick={() => {
                    const newClicks = (listing.clicks || 0) + 1;
                    const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                    const updatedListings = existingListings.map((l: Listing) => 
                      l.id === listing.id ? { ...l, clicks: newClicks } : l
                    );
                    localStorage.setItem('testListings', JSON.stringify(updatedListings));
                    setListing(prev => prev ? { ...prev, clicks: newClicks } : null);
                  }}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  👁️ View ({listing.clicks || 0})
                </button>
                
                <button 
                  onClick={() => {
                    // TODO: Implement edit functionality
                    alert('Edit functionality coming soon!');
                  }}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  ✏️ Edit Listing
                </button>
                
                {!listing.soldAt ? (
                  <button 
                    onClick={() => setShowSaleForm(true)}
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    🎉 Mark as Sold
                  </button>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="text-green-800 dark:text-green-200 font-semibold mb-1">
                      ✅ SOLD - ${listing.soldFor?.toLocaleString()}
                    </div>
                    <div className="text-green-600 dark:text-green-300 text-sm">
                      Sold to: {listing.soldTo} • {new Date(listing.soldAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  🗑️ Delete Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                🎉 Car Sold!
              </h3>
              <button
                onClick={() => setShowSaleForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How much did you sell it for?
                </label>
                <input
                  type="text"
                  value={saleData.soldFor}
                  onChange={(e) => setSaleData(prev => ({ ...prev, soldFor: e.target.value }))}
                  placeholder="e.g., 8500"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Who did you sell it to?
                </label>
                <input
                  type="text"
                  value={saleData.soldTo}
                  onChange={(e) => setSaleData(prev => ({ ...prev, soldTo: e.target.value }))}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSaleForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!saleData.soldFor || !saleData.soldTo) {
                    alert('Please fill in both fields');
                    return;
                  }
                  
                  const soldListing = {
                    ...listing,
                    soldAt: new Date().toISOString(),
                    soldFor: parseInt(saleData.soldFor),
                    soldTo: saleData.soldTo,
                    action: 'sold'
                  };
                  
                  const existingAnalytics = JSON.parse(localStorage.getItem('listingAnalytics') || '[]');
                  existingAnalytics.push(soldListing);
                  localStorage.setItem('listingAnalytics', JSON.stringify(existingAnalytics));
                  
                  const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                  const updatedListings = existingListings.map((l: Listing) => 
                    l.id === listing.id ? {
                      ...l,
                      soldAt: new Date().toISOString(),
                      soldFor: parseInt(saleData.soldFor),
                      soldTo: saleData.soldTo
                    } : l
                  );
                  localStorage.setItem('testListings', JSON.stringify(updatedListings));
                  
                  setListing(prev => prev ? {
                    ...prev,
                    soldAt: new Date().toISOString(),
                    soldFor: parseInt(saleData.soldFor),
                    soldTo: saleData.soldTo
                  } : null);
                  
                  setShowSaleForm(false);
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Mark as Sold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                🗑️ Delete Listing
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this listing? This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {listing.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ${listing.price.toLocaleString()} • {listing.mileage} miles
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const deletedListing = {
                    ...listing,
                    deletedAt: new Date().toISOString(),
                    action: 'deleted'
                  };
                  
                  try {
                    const existingAnalytics = JSON.parse(localStorage.getItem('listingAnalytics') || '[]');
                    existingAnalytics.push(deletedListing);
                    const trimmedAnalytics = existingAnalytics.slice(-50);
                    localStorage.setItem('listingAnalytics', JSON.stringify(trimmedAnalytics));
                  } catch (error) {
                    localStorage.removeItem('listingAnalytics');
                    localStorage.setItem('listingAnalytics', JSON.stringify([deletedListing]));
                  }
                  
                  const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                  const updatedListings = existingListings.filter((l: Listing) => l.id !== listing.id);
                  localStorage.setItem('testListings', JSON.stringify(updatedListings));
                  
                  setShowDeleteConfirm(false);
                  window.location.href = '/dashboard';
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
