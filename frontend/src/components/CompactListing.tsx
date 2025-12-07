'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  price: number;
  description?: string;
  images: string[];
  mileage?: string;
  titleStatus?: string;
  status?: string;
  make?: string;
  model?: string;
  year?: number | string; // Accept both number and string for compatibility
}

interface CompactListingProps {
  listing: Listing;
}

export default function CompactListing({ listing }: CompactListingProps) {
  // Get first valid image
  const firstImage = listing.images?.find(image => 
    image && (
      image.startsWith('http://') || 
      image.startsWith('https://') || 
      image.startsWith('data:image/') ||
      image.startsWith('/')
    )
  ) || '/placeholder-car.jpg';

  // Extract key info from title or use make/model/year
  const yearString = listing.year ? String(listing.year) : '';
  const displayTitle = listing.title || `${yearString} ${listing.make || ''} ${listing.model || ''}`.trim();

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
        <div className="flex items-center gap-4 p-3">
          {/* Image - Fixed width */}
          <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {firstImage && firstImage !== '/placeholder-car.jpg' ? (
              <Image
                src={firstImage}
                alt={displayTitle}
                width={112}
                height={112}
                className="w-full h-full object-cover"
                unoptimized={firstImage.startsWith('data:image/')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-2xl">🚗</span>
              </div>
            )}
          </div>

          {/* Content - Flexible width */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1">
                {displayTitle}
              </h3>
              
              {/* Details row */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-1">
                {listing.mileage && (
                  <span className="truncate">{listing.mileage} miles</span>
                )}
                {listing.titleStatus && (
                  <span className="truncate">• {listing.titleStatus} title</span>
                )}
                {listing.status && (
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    listing.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    listing.status === 'sold' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {listing.status}
                  </span>
                )}
              </div>
              
              {/* Description preview (optional, truncated) */}
              {listing.description && (
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                  {listing.description.substring(0, 60)}...
                </p>
              )}
            </div>

            {/* Price - Fixed width */}
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                ${listing.price?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

