'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingData } from '@/services/onboardingService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface CategorySelectionScreenProps {
  initialData?: Partial<OnboardingData>;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function CategorySelectionScreen({ initialData, onNext, onBack }: CategorySelectionScreenProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<OnboardingData['selected_category']>(
    initialData?.selected_category || undefined
  );
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonCategory, setComingSoonCategory] = useState<string>('');
  const [notifyEmail, setNotifyEmail] = useState(user?.email || '');

  const categories = [
    {
      value: 'automotive' as const,
      title: 'Automotive',
      icon: '🚗',
      status: 'active' as const
    },
    {
      value: 'real_estate' as const,
      title: 'Real Estate',
      icon: '🏠',
      status: 'coming_soon' as const
    },
    {
      value: 'luxury_items' as const,
      title: 'Luxury Items',
      icon: '💎',
      status: 'coming_soon' as const
    },
    {
      value: 'small_businesses' as const,
      title: 'Small Businesses',
      icon: '🏢',
      status: 'coming_soon' as const
    },
    {
      value: 'high_value_goods' as const,
      title: 'High-Value Goods',
      icon: '💰',
      status: 'coming_soon' as const
    },
    {
      value: 'art_collectibles' as const,
      title: 'Art & Collectibles',
      icon: '🎨',
      status: 'coming_soon' as const
    }
  ];

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (category.status === 'active') {
      setSelected(category.value);
    } else {
      setComingSoonCategory(category.value);
      setShowComingSoonModal(true);
    }
  };

  const handleNotifyMe = () => {
    // TODO: Save email notification preference to database
    console.log('Notify me for category:', comingSoonCategory, 'Email:', notifyEmail);
    setShowComingSoonModal(false);
    setComingSoonCategory('');
    // Still allow them to continue (they can select automotive)
  };

  const handleNext = () => {
    if (selected) {
      onNext({ selected_category: selected });
    }
  };

  return (
    <>
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
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">What Are You Selling?</h2>
                <p className="text-sm md:text-base text-gray-600">Select your primary category</p>
              </div>
              <div className="w-6"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryClick(category)}
                className={`p-6 rounded-lg border-2 text-center transition-all ${
                  selected === category.value
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : category.status === 'active'
                    ? 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {category.title}
                </h3>
                {category.status === 'coming_soon' && (
                  <p className="text-xs text-gray-500">Coming Soon</p>
                )}
              </button>
            ))}
          </div>

          {/* Continue Button */}
          {selected && (
            <div className="mt-8 max-w-md mx-auto">
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              This category is coming soon. Would you like to be notified when it's available?
            </p>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mb-4">
              We'll notify you when {categories.find(c => c.value === comingSoonCategory)?.title} becomes available.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowComingSoonModal(false);
                  setNotifyEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Maybe Later
              </button>
              <button
                onClick={handleNotifyMe}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

