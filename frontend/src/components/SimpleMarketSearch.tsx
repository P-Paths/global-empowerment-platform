'use client';

import React, { useState } from 'react';
import carDataRaw from '@/data/carData.json';
const carData = carDataRaw as Record<string, string[]>;

interface SimpleMarketSearchProps {
  onClose: () => void;
}

interface MarketResult {
  source: string;
  price: string;
  location: string;
  mileage?: string;
  year?: string;
  url: string;
  isDirectListing?: boolean;
}

export default function SimpleMarketSearch({ onClose }: SimpleMarketSearchProps) {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('United States');
  const [radius, setRadius] = useState(50);
  const [results, setResults] = useState<MarketResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRealData, setIsRealData] = useState(false);

  const makes = Object.keys(carData);
  const models = selectedMake ? carData[selectedMake] : [];

  const handleSearch = async () => {
    if (!selectedMake || !selectedModel) {
      setError('Please select both make and model');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);
    setSummary(null);

    try {
      const response = await fetch('/api/v1/market-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: `${year ? year + ' ' : ''}${selectedMake} ${selectedModel}`,
          location,
          radius
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setSummary(data.summary);
        setIsRealData(data.summary?.isRealData || false);
        
        // Auto-save search to history
        try {
          const saveResponse = await fetch('/api/v1/search-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              searchTerm: `${year ? year + ' ' : ''}${selectedMake} ${selectedModel}`,
              location,
              radius,
              results: data.results,
              summary: data.summary
            }),
          });
          
          if (saveResponse.ok) {
            console.log('Search automatically saved to history');
          }
        } catch (error) {
          console.log('Failed to auto-save search history:', error);
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (error) {
      setError('Failed to search market data. Please try again.');
      console.error('Market search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Market Price Search
          </h2>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? '🔄 Searching...' : '🔄 Refresh Data'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Make
              </label>
              <select
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Make</option>
                {makes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedMake}
              >
                <option value="">{selectedMake ? 'Select Model' : 'Select Make First'}</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year (Optional)
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Los Angeles, CA"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Radius (miles)
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
              >
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
                <option value={100}>100 miles</option>
                <option value={200}>200 miles</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full mt-4 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching Market...' : '🔍 Search Market Prices'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Market Results ({summary?.totalFound || results.length} found within {radius} miles)
            </h3>
            {isRealData ? (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>🔍 Direct Marketplace Links:</strong> Click any link below to go directly to {selectedMake} {selectedModel} search results on each marketplace. 
                  You'll see real listings with current prices, photos, and details on eBay Motors, CarGurus, Cars.com, and AutoTrader.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Demo Mode:</strong> These are sample results with realistic pricing data. 
                  In production, this would show real listings from actual marketplaces with working links to specific cars.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.price}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          from {result.source}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div>📍 {result.location}</div>
                        {result.mileage && <div>🛣️ {result.mileage}</div>}
                        {result.year && <div>📅 {result.year}</div>}
                      </div>
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      {result.isDirectListing ? `View Listing` : `View on ${result.source}`}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {summary && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📊 Market Summary
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {summary.isGoogleSearch ? (
                    <>
                      <div>• Search Results: {summary.totalListings} Google search links</div>
                      <div>• Click any link above to see real prices and listings</div>
                      <div>• Sources: {Array.isArray(summary.sources) ? summary.sources.join(', ') : Object.keys(summary.sources || {}).join(', ')}</div>
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        💡 Each link opens a real Google search with actual car listings and prices
                      </div>
                    </>
                  ) : (
                    <>
                      <div>• Average Price: ${summary.averagePrice?.toLocaleString()}</div>
                      <div>• Price Range: ${summary.priceRange?.min?.toLocaleString()} - ${summary.priceRange?.max?.toLocaleString()}</div>
                      <div>• Found {summary.totalFound} listings within {summary.searchRadius}</div>
                      <div>• Sources: {Array.isArray(summary.sources) ? summary.sources.join(', ') : Object.keys(summary.sources || {}).join(', ')}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Searching market data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
