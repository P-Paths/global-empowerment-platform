'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService, MarketplaceIntegration } from '@/services/onboardingService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface MarketplaceEcosystemScreenProps {
  category?: string;
  onNext: () => void;
  onBack: () => void;
}

export default function MarketplaceEcosystemScreen({ category, onNext, onBack }: MarketplaceEcosystemScreenProps) {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(user?.email || '');

  useEffect(() => {
    const loadIntegrations = async () => {
      if (category) {
        setLoading(true);
        const data = await onboardingService.getMarketplaceIntegrations(category);
        setIntegrations(data);
        setLoading(false);
      }
    };
    loadIntegrations();
  }, [category]);

  // If no category selected, show placeholder
  if (!category) {
    return (
      <div className="h-full w-full flex flex-col bg-white">
        {/* Top Center Header Banner */}
        <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div className="flex-1 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Marketplace Ecosystem</h2>
                <p className="text-sm md:text-base text-gray-600">Select a category to see available marketplaces</p>
              </div>
              <div className="w-6"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Please select a category first</p>
        </div>
      </div>
    );
  }

  const isComingSoon = category !== 'automotive';

  const liveIntegrations = integrations.filter(i => i.status === 'live');
  const comingSoonIntegrations = integrations.filter(i => i.status === 'coming_soon');

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Top Center Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Marketplace Ecosystem</h2>
              <p className="text-sm md:text-base text-gray-600">Connect to platforms where you'll sell</p>
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading marketplaces...</p>
            </div>
          ) : (
            <>
              {/* Warning Banner for Coming Soon Categories */}
              {isComingSoon && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">This category is coming soon</h4>
                      <p className="text-sm text-amber-800">
                        The marketplaces below are not yet available for {category.replace('_', ' ')}. 
                        You can still see what's planned and get notified when they launch.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Marketplaces */}
              {liveIntegrations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Now</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {liveIntegrations.map((integration) => (
                      <div
                        key={integration.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isComingSoon 
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                            : 'border-blue-200 bg-blue-50 hover:shadow-md'
                        }`}
                      >
                        <div className="text-2xl mb-2">{integration.icon_url}</div>
                        <div className="text-sm font-semibold text-gray-900">{integration.name}</div>
                        <div className={`text-xs mt-1 ${isComingSoon ? 'text-gray-500' : 'text-blue-600'}`}>
                          {isComingSoon ? 'Not Available' : 'Live'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coming Soon Marketplaces */}
              {comingSoonIntegrations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Coming Soon</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {comingSoonIntegrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-75"
                      >
                        <div className="text-2xl mb-2">{integration.icon_url}</div>
                        <div className="text-sm font-semibold text-gray-900">{integration.name}</div>
                        <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Note */}
              {!isComingSoon && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> You can connect your marketplace accounts later in Settings → Connections. 
                    Marketplace connections are required before posting your first listing.
                  </p>
                </div>
              )}

              {/* Notify Me Button for Coming Soon Categories */}
              {isComingSoon && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Want to be notified when this launches?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    We'll email you as soon as {category.replace('_', ' ')} marketplaces become available.
                  </p>
                  <button
                    onClick={() => setShowNotifyModal(true)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Notify Me When Available
                  </button>
                </div>
              )}
            </>
          )}

          {/* Continue Button */}
          <button
            onClick={onNext}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 mt-8"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Get Notified</h3>
            <p className="text-gray-600 mb-4">
              We'll notify you when {category.replace('_', ' ')} marketplaces become available.
            </p>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotifyModal(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save notification preference
                  console.log('Notify:', notifyEmail, 'for category:', category);
                  setShowNotifyModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

