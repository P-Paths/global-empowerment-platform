'use client';

import React, { useState } from 'react';
import { OnboardingData } from '@/services/onboardingService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BusinessExperienceScreenProps {
  initialData?: Partial<OnboardingData>;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function BusinessExperienceScreen({ initialData, onNext, onBack }: BusinessExperienceScreenProps) {
  const [selected, setSelected] = useState<OnboardingData['experience_level']>(
    initialData?.experience_level || undefined
  );

  const options = [
    {
      value: 'beginner' as const,
      title: 'New to Business',
      subtitle: 'Just starting out.',
      description: "You're new to entrepreneurship and building your first business. You're ready to learn and grow with the GEM Platform community.",
      icon: '🌱',
      color: 'green'
    },
    {
      value: 'intermediate' as const,
      title: 'Growing Business',
      subtitle: 'Building momentum.',
      description: "You have a business that's up and running. You're looking to scale, increase your digital presence, and prepare for funding opportunities.",
      icon: '📈',
      color: 'blue'
    },
    {
      value: 'experienced' as const,
      title: 'Established Business',
      subtitle: 'Ready to scale.',
      description: "You have an established business and are ready to take it to the next level. You're seeking funding, partnerships, and strategic growth.",
      icon: '🚀',
      color: 'purple'
    }
  ];

  const handleNext = () => {
    if (selected) {
      onNext({ experience_level: selected });
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Top Center Header Banner */}
      <div className="flex-shrink-0 w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Business Experience</h2>
              <p className="text-sm md:text-base text-gray-600">What stage is your business at?</p>
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Desktop: 3 columns side-by-side */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`p-6 rounded-xl border-2 text-left transition-all h-full ${
                  selected === option.value
                    ? option.color === 'green' 
                      ? 'border-green-600 bg-green-50 shadow-lg scale-[1.02]'
                      : option.color === 'blue'
                      ? 'border-blue-600 bg-blue-50 shadow-lg scale-[1.02]'
                      : 'border-purple-600 bg-purple-50 shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`text-5xl mb-3 ${selected === option.value ? 'scale-110' : ''} transition-transform`}>
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-700 mb-2">{option.subtitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{option.description}</p>
                  {selected === option.value && (
                    <div className="mt-auto">
                      <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Mobile: Stacked vertically */}
          <div className="md:hidden space-y-4">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  selected === option.value
                    ? option.color === 'green' 
                      ? 'border-green-600 bg-green-50 shadow-lg scale-[1.02]'
                      : option.color === 'blue'
                      ? 'border-blue-600 bg-blue-50 shadow-lg scale-[1.02]'
                      : 'border-purple-600 bg-purple-50 shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-4xl ${selected === option.value ? 'scale-110' : ''} transition-transform`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 mb-2">{option.subtitle}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{option.description}</p>
                  </div>
                  {selected === option.value && (
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
      
      {/* Continue Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10 px-6 py-4" style={{ borderTop: 'none' }}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleNext}
            disabled={!selected}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

