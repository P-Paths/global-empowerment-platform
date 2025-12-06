'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/api';
import { getBackendUrl } from '@/config/api';

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
  year?: number;
}

interface DashboardListingProps {
  listing: Listing;
}

export default function DashboardListing({ listing }: DashboardListingProps) {
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isPostingToFacebook, setIsPostingToFacebook] = useState(false);
  const [saleData, setSaleData] = useState({
    soldFor: '',
    soldTo: ''
  });
  const [editData, setEditData] = useState({
    title: listing.title,
    price: listing.price.toString(),
    description: listing.description,
    mileage: listing.mileage
  });

  // Check if Facebook is connected
  const checkFacebookConnection = async (): Promise<'connected' | 'not_connected' | 'database_error'> => {
    try {
      const backendUrl = getBackendUrl();
      const response = await authenticatedFetch(`${backendUrl}/api/v1/facebook/connection-status`);
      if (response.ok) {
        const data = await response.json();
        
        // If there's a database error, stop checking immediately
        if (data.error && (data.error.includes('Connection refused') || data.error.includes('Database error'))) {
          console.warn('Database connection error - stopping Facebook status checks:', data.error);
          setIsFacebookConnected(false);
          return 'database_error'; // Signal to stop polling
        }
        
        const isConnected = data.connected === true;
        setIsFacebookConnected(isConnected);
        if (isConnected) {
          console.log('✅ Facebook is connected! Showing Post button.');
          return 'connected';
        } else {
          console.log('❌ Facebook is not connected.');
          return 'not_connected';
        }
      } else {
        const errorText = await response.text();
        console.log('Facebook connection check failed:', response.status, errorText);
        setIsFacebookConnected(false);
        return 'not_connected';
      }
    } catch (error: any) {
      // Don't log database connection errors repeatedly
      if (error.message?.includes('Connection refused') || error.message?.includes('Failed to connect')) {
        console.debug('Database connection error - stopping status checks');
        setIsFacebookConnected(false);
        return 'database_error'; // Signal to stop polling
      }
      console.error('Error checking Facebook connection:', error);
      setIsFacebookConnected(false);
      return 'not_connected';
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isPolling = true;
    
    const startPolling = async () => {
      // Check immediately on mount
      const status = await checkFacebookConnection();
      
      // Stop immediately if there's a database error
      if (status === 'database_error') {
        console.log('Stopping Facebook status checks due to database error');
        return;
      }
      
      // Only start polling if no database errors
      // Check every 30 seconds instead of 5 seconds to reduce load
      if (isPolling) {
        interval = setInterval(async () => {
          if (document.visibilityState === 'visible' && isPolling) {
            const continueStatus = await checkFacebookConnection();
            // Stop polling immediately if we get a database error
            if (continueStatus === 'database_error') {
              isPolling = false;
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
            }
          }
        }, 30000); // Check every 30 seconds (reduced from 5 seconds)
      }
    };
    
    startPolling();
    
    return () => {
      isPolling = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Post listing to Facebook Marketplace
  const handlePostToFacebook = async () => {
    if (!isFacebookConnected) {
      // Redirect to connections page if not connected
      window.location.href = '/dashboard/connections';
      return;
    }

    setIsPostingToFacebook(true);
    try {
      const backendUrl = getBackendUrl();
      
      // Prepare listing data for Facebook
      const listingData = {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        make: listing.make || '',
        model: listing.model || '',
        year: listing.year || 0,
        mileage: parseInt(listing.mileage) || 0,
        condition: 'GOOD',
        post_to_marketplace: true
      };

      // Convert images to File objects for upload
      const imageFiles: File[] = [];
      for (const imageUrl of listing.images.slice(0, 10)) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const fileName = imageUrl.split('/').pop() || 'image.jpg';
          const file = new File([blob], fileName, { type: blob.type });
          imageFiles.push(file);
        } catch (error) {
          console.warn('Failed to fetch image:', imageUrl);
        }
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('title', listingData.title);
      formData.append('description', listingData.description);
      formData.append('price', listingData.price.toString());
      formData.append('make', listingData.make);
      formData.append('model', listingData.model);
      formData.append('year', listingData.year.toString());
      formData.append('mileage', listingData.mileage.toString());
      formData.append('condition', listingData.condition);
      formData.append('post_to_marketplace', 'true');
      
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await authenticatedFetch(`${backendUrl}/api/v1/user-facebook-posting/post-to-marketplace-playwright`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Listing posted to Facebook Marketplace!\n\n${result.message || 'Check Facebook Marketplace to review and publish.'}`);
        // Refresh the page to update platform badges
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to post to Facebook Marketplace');
      }
    } catch (error: any) {
      console.error('Error posting to Facebook:', error);
      alert(`❌ Failed to post to Facebook Marketplace: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPostingToFacebook(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Filter out invalid image URLs
  const validImages = listing.images.filter(image => 
    image && (
      image.startsWith('http://') || 
      image.startsWith('https://') || 
      image.startsWith('data:image/') ||
      image.startsWith('/')
    )
  );

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Images */}
      <div className="relative w-full overflow-hidden">
        <Link href={`/listings/${listing.id}`}>
          <div 
            className="grid grid-cols-2 gap-1 aspect-[2/1] cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setShowPhotoGallery(true);
            }}
          >
          {listing.images.slice(0, 2).map((image, index) => {
            // Check if image is a valid URL or data URL
            const isValidImage = image && (
              image.startsWith('http://') || 
              image.startsWith('https://') || 
              image.startsWith('data:image/') ||
              image.startsWith('/')
            );
            
            // Fallback image if invalid
            const imageSrc = isValidImage ? image : '/placeholder-car.jpg';
            
            return (
              <div key={index} className="relative w-full h-full overflow-hidden">
                {isValidImage ? (
                  <Image
                    src={imageSrc}
                    alt={`${listing.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    width={400}
                    height={200}
                    unoptimized={image.startsWith('data:image/')}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                {index === 1 && listing.images.length > 2 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg z-10">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      +{listing.images.length - 2}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </Link>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none">
          Click to view all {validImages.length} photos
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-6">
          {/* Title and Price */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <Link href={`/listings/${listing.id}`} className="hover:underline">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors break-words">
                  {listing.title}
                </h3>
              </Link>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {listing.mileage} miles • {listing.titleStatus} title
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                ${listing.price.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {formatDate(listing.postedAt)}
              </div>
            </div>
          </div>
        


        {/* Enhanced Listing Stats */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
          {/* Top Row - Posted Info & Status */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              🕒 {new Date(listing.postedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} @ {new Date(listing.postedAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                listing.soldAt 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              }`}>
                📊 {listing.soldAt ? 'Sold' : 'Active'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                #{listing.id.slice(-6)}
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-green-600">
              ${listing.price.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Listed Price</div>
          </div>
          
          {/* Platforms Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Posted to:</div>
              <div className="flex items-center gap-2">
                {isFacebookConnected ? (
                  <button
                    onClick={handlePostToFacebook}
                    disabled={isPostingToFacebook}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPostingToFacebook ? 'Posting...' : '📘 Post to Facebook'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={async () => {
                        console.log('🔄 Manually checking Facebook connection...');
                        const connected = await checkFacebookConnection();
                        if (connected) {
                          alert('✅ Facebook is connected! You can now post to Facebook Marketplace.');
                        } else {
                          alert('❌ Facebook is not connected. Click "Connect Platforms" to connect your account.');
                        }
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                      title="Check Facebook connection status"
                    >
                      🔍 Check
                    </button>
                    <Link 
                      href="/dashboard/connections"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
                    >
                      + Connect Platforms
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
              {listing.platforms && listing.platforms.length > 0 ? (
                listing.platforms.map((platform, index) => {
                  const platformInfo = {
                    'facebook_marketplace': { name: 'Facebook', icon: '📘', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
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
                      <span key={index} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 whitespace-nowrap">
                        📱 {platform}
                      </span>
                    );
                  }
                  return (
                    <span key={index} className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${info.color} whitespace-nowrap`}>
                      {info.icon} {info.name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Only on Accorria • <Link href="/dashboard/connections" className="text-blue-600 dark:text-blue-400 hover:underline">Connect platforms</Link>
                </span>
              )}
            </div>
          </div>

          {/* Activity Metrics */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
              <span>👁️ {listing.clicks || Math.floor(Math.random() * 50) + 10} views</span>
              <span>💬 {listing.messages || Math.floor(Math.random() * 5)} messages</span>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {(() => {
                const postedDate = new Date(listing.postedAt);
                const now = new Date();
                const diffInDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
                return diffInDays === 0 ? 'Today' : `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
              })()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button 
              onClick={() => {
                const newMessages = (listing.messages || 0) + 1;
                // Update the listing in localStorage
                const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                const updatedListings = existingListings.map((l: Listing) => 
                  l.id === listing.id ? { ...l, messages: newMessages } : l
                );
                localStorage.setItem('testListings', JSON.stringify(updatedListings));
                // Force re-render
                window.location.reload();
              }}
              className="bg-blue-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              📱 Message ({listing.messages || 0})
            </button>
            <button 
              onClick={() => {
                const newClicks = (listing.clicks || 0) + 1;
                // Update the listing in localStorage
                const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                const updatedListings = existingListings.map((l: Listing) => 
                  l.id === listing.id ? { ...l, clicks: newClicks } : l
                );
                localStorage.setItem('testListings', JSON.stringify(updatedListings));
                // Force re-render
                window.location.reload();
              }}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              👁️ View ({listing.clicks || 0})
            </button>
          </div>
          
          {/* Secondary Actions */}
          <div className="space-y-2">
            <button 
              onClick={() => setShowEditForm(true)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
            >
              ✏️ Edit Listing
            </button>
            
            {!listing.soldAt ? (
              <button 
                onClick={() => setShowSaleForm(true)}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
              >
                🎉 Mark as Sold
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="text-green-800 dark:text-green-200 text-sm font-semibold mb-1">
                  ✅ SOLD - ${listing.soldFor?.toLocaleString()}
                </div>
                <div className="text-green-600 dark:text-green-300 text-xs">
                  Sold to: {listing.soldTo} • {new Date(listing.soldAt).toLocaleDateString()}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => {
                console.log('Delete button clicked, showing confirmation modal');
                setShowDeleteConfirm(true);
              }}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
            >
              🗑️ Delete Listing
            </button>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {showPhotoGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowPhotoGallery(false)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            >
              ✕
            </button>
            
            {/* Photo Counter */}
            <div className="absolute top-4 left-4 text-white text-sm z-10">
              {currentPhotoIndex + 1} of {validImages.length}
            </div>
            
            {/* Main Image */}
            {(() => {
              const currentImage = validImages[currentPhotoIndex] || validImages[0] || '/placeholder-car.jpg';
              
              return (
                <Image
                  src={currentImage}
                  alt={`${listing.title} - Photo ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  width={800}
                  height={600}
                  unoptimized={currentImage.startsWith('data:image/')}
                />
              );
            })()}
            
            {/* Navigation Buttons */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10"
                >
                  ‹
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10"
                >
                  ›
                </button>
              </>
            )}
            
            {/* Thumbnail Strip */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {validImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-16 h-12 rounded overflow-hidden border-2 ${
                    index === currentPhotoIndex ? 'border-white' : 'border-gray-600'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    width={100}
                    height={75}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md my-4">
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
                  
                  // Store sold listing in analytics
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
                  
                  // Update the listing in localStorage
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
                  
                  setShowSaleForm(false);
                  window.location.reload();
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Mark as Sold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ✏️ Edit Listing
              </h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter listing title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Enter price"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mileage
                </label>
                <input
                  type="text"
                  value={editData.mileage}
                  onChange={(e) => setEditData(prev => ({ ...prev, mileage: e.target.value }))}
                  placeholder="Enter mileage (e.g., 55000)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  placeholder="Enter listing description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editData.title || !editData.price || !editData.mileage) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  
                  // Store edit action in analytics
                  const editAction = {
                    ...listing,
                    editedAt: new Date().toISOString(),
                    action: 'edited',
                    changes: {
                      title: { from: listing.title, to: editData.title },
                      price: { from: listing.price, to: parseInt(editData.price) },
                      mileage: { from: listing.mileage, to: editData.mileage },
                      description: { from: listing.description, to: editData.description }
                    }
                  };
                  
                  const existingAnalytics = JSON.parse(localStorage.getItem('listingAnalytics') || '[]');
                  existingAnalytics.push(editAction);
                  localStorage.setItem('listingAnalytics', JSON.stringify(existingAnalytics));
                  
                  // Update the listing in localStorage
                  const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                  const updatedListings = existingListings.map((l: Listing) => 
                    l.id === listing.id ? {
                      ...l,
                      title: editData.title,
                      price: parseInt(editData.price),
                      mileage: editData.mileage,
                      description: editData.description
                    } : l
                  );
                  localStorage.setItem('testListings', JSON.stringify(updatedListings));
                  
                  setShowEditForm(false);
                  window.location.reload();
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative my-4">
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
                onClick={async () => {
                  console.log('Delete button clicked for listing:', listing.id);
                  
                  try {
                    // Delete images from Supabase Storage first
                    if (listing.images && listing.images.length > 0) {
                      try {
                        const { supabase } = await import('@/utils/supabase');
                        const imagesToDelete: string[] = [];
                        
                        for (const imageUrl of listing.images) {
                          // Extract file path from Supabase Storage URL
                          // Format: https://[project].supabase.co/storage/v1/object/public/car-images/listings/[filename]
                          if (imageUrl.includes('/storage/v1/object/public/car-images/')) {
                            const urlParts = imageUrl.split('/car-images/');
                            if (urlParts.length > 1) {
                              const filePath = urlParts[1];
                              imagesToDelete.push(filePath);
                              console.log('Preparing to delete image:', filePath);
                            }
                          } else if (imageUrl.startsWith('data:image/')) {
                            // Skip data URLs (they're not in storage)
                            console.log('Skipping data URL image');
                          }
                        }
                        
                        // Delete all images at once
                        if (imagesToDelete.length > 0) {
                          console.log('Deleting', imagesToDelete.length, 'images from Supabase Storage...');
                          const { error: deleteError, data } = await supabase.storage
                            .from('car-images')
                            .remove(imagesToDelete);
                          
                          if (deleteError) {
                            console.error('Error deleting images:', deleteError);
                          } else {
                            console.log('Successfully deleted', imagesToDelete.length, 'images from storage');
                          }
                        }
                      } catch (storageError) {
                        console.error('Error deleting images from Supabase Storage:', storageError);
                        // Continue with listing deletion even if image deletion fails
                      }
                    }
                    
                    // Store deleted listing in analytics
                    const deletedListing = {
                      ...listing,
                      deletedAt: new Date().toISOString(),
                      action: 'deleted'
                    };
                    
                    try {
                      const existingAnalytics = JSON.parse(localStorage.getItem('listingAnalytics') || '[]');
                      existingAnalytics.push(deletedListing);
                      
                      // Keep only last 10 analytics entries to prevent quota issues
                      const trimmedAnalytics = existingAnalytics.slice(-10);
                      localStorage.setItem('listingAnalytics', JSON.stringify(trimmedAnalytics));
                      console.log('Analytics updated:', trimmedAnalytics);
                    } catch (error) {
                      console.warn('Could not save analytics (quota exceeded):', error);
                      // Clear all analytics data to free up space
                      try {
                        localStorage.removeItem('listingAnalytics');
                        localStorage.removeItem('demoListings');
                        localStorage.removeItem('testListings');
                        console.log('Cleared localStorage to free up space');
                      } catch (clearError) {
                        console.error('Failed to clear localStorage:', clearError);
                      }
                    }
                    
                    // Remove the listing from active listings (check both storage keys)
                    const testListings = JSON.parse(localStorage.getItem('testListings') || '[]');
                    const demoListings = JSON.parse(localStorage.getItem('demoListings') || '[]');
                    
                    console.log('Existing listings before delete:', { testListings: testListings.length, demoListings: demoListings.length });
                    
                    const updatedTestListings = testListings.filter((l: Listing) => l.id !== listing.id);
                    const updatedDemoListings = demoListings.filter((l: Listing) => l.id !== listing.id);
                    
                    localStorage.setItem('testListings', JSON.stringify(updatedTestListings));
                    localStorage.setItem('demoListings', JSON.stringify(updatedDemoListings));
                    
                    console.log('Updated listings after delete:', { testListings: updatedTestListings.length, demoListings: updatedDemoListings.length });
                    
                    // Also try to delete from database via listingsService
                    try {
                      const { listingsService } = await import('@/services/listingsService');
                      await listingsService.deleteListing(listing.id);
                    } catch (dbError) {
                      console.log('Database delete not needed or failed (listing was in localStorage):', dbError);
                    }
                    
                    setShowDeleteConfirm(false);
                    // Force a page reload to refresh the listings
                    window.location.reload();
                  } catch (error) {
                    console.error('Error during deletion:', error);
                    alert('Error deleting listing. Please try again.');
                    setShowDeleteConfirm(false);
                  }
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
