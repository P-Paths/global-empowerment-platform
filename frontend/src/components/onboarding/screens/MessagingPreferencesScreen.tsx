'use client';

import React, { useState } from 'react';
import { OnboardingData } from '@/services/onboardingService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface MessagingPreferencesScreenProps {
  initialData?: Partial<OnboardingData>;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function MessagingPreferencesScreen({ initialData, onNext, onBack }: MessagingPreferencesScreenProps) {
  const [selected, setSelected] = useState<OnboardingData['messaging_preference']>(
    initialData?.messaging_preference || undefined
  );

  const options = [
    {
      value: 'auto_reply' as const,
      title: 'Auto-Reply',
      icon: '🤖',
      description: 'Accorria responds automatically to basic questions',
      shortExplanation: 'Perfect for saving time. Accorria answers repetitive questions like "Still available?" and "How many miles?" instantly. You only get notified for serious buyers or important decisions.',
      example: {
        buyer: 'Is this still available?',
        ai: 'Yes, it\'s still available! Would you like to schedule a viewing?',
        you: 'You don\'t need to do anything - Accorria handles it automatically'
      }
    },
    {
      value: 'human_in_loop' as const,
      title: 'Accorria Drafts → You Approve',
      icon: '✍️',
      description: 'Accorria writes messages, you review before sending',
      shortExplanation: 'Accorria drafts smart responses using your rules and knowledge, then you review and approve before they send. Perfect for negotiations and complex questions. Human-in-the-loop ensures you stay in control.',
      example: {
        buyer: 'Would you take $15,000?',
        ai: 'Draft: "I can do $16,500. That\'s my best price."',
        you: 'You review the draft, edit if needed, then approve to send'
      }
    },
    {
      value: 'manual' as const,
      title: 'You Write Everything',
      icon: '✉️',
      description: 'You write all messages yourself',
      shortExplanation: 'You write every message. Accorria just organizes all your conversations in one inbox.',
      example: {
        buyer: 'Is this still available?',
        ai: 'You write the response yourself',
        you: 'Full control - you write every word'
      }
    }
  ];

  const handleNext = () => {
    if (selected) {
      onNext({ messaging_preference: selected });
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col bg-white">
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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Messaging Preferences</h2>
              <p className="text-sm md:text-base text-gray-600">How do you want to communicate with buyers?</p>
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                selected === option.value
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{option.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{option.shortExplanation}</p>
                  
                  {/* Visual Example */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Buyer:</span>
                      <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-700 border border-gray-200">
                        "{option.example.buyer}"
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-blue-600 w-16 flex-shrink-0">Accorria:</span>
                      <div className="flex-1 bg-blue-50 rounded px-2 py-1 text-xs text-gray-700 border border-blue-200">
                        {option.example.ai}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-green-600 w-16 flex-shrink-0">You:</span>
                      <div className="flex-1 bg-green-50 rounded px-2 py-1 text-xs text-gray-700 border border-green-200">
                        {option.example.you}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* Continue Button */}
          <button
            onClick={handleNext}
            disabled={!selected}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

