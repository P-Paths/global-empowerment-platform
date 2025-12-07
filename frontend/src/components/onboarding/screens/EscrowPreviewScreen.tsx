'use client';

import React, { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import EscrowFlowVisual from './EscrowFlowVisual';

interface EscrowPreviewScreenProps {
  onNext: (data: { wants_escrow?: boolean }) => void;
  onBack: () => void;
}

export default function EscrowPreviewScreen({ onNext, onBack }: EscrowPreviewScreenProps) {
  const [wantsNotify, setWantsNotify] = useState(false);

  const handleNext = () => {
    onNext({ wants_escrow: wantsNotify });
  };

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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Smart Contract Service</h2>
              <p className="text-sm md:text-base text-gray-600">Coming Soon</p>
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Simple Explanation */}
          <div className="text-center space-y-3">
            <div className="text-5xl mb-2">🔒</div>
            <h3 className="text-xl font-bold text-gray-900">Smart Contract Service</h3>
            <p className="text-sm text-gray-600">
              Coming soon! Get notified when we launch secure payment protection for your transactions.
            </p>
          </div>

          {/* Visual Flow */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 text-center">How Escrow Works</h4>
            <EscrowFlowVisual />
          </div>

          {/* What is Smart Contracts Explanation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">What is Smart Contracts?</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <div className="font-semibold text-red-600 mb-1">❌ Without Smart Contracts (like Cash App):</div>
                <p className="text-gray-700">
                  You send money directly to the seller. If something goes wrong, you're out of luck. No protection, no way to get your money back. Buyer can back out weeks later over fake issues, wasting your time and money.
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="font-semibold text-green-600 mb-1">✅ With Accorria Smart Contracts:</div>
                <p className="text-gray-700">
                  Your money is held safely by Accorria using smart contracts until you receive the item and confirm everything is correct. Everything is checked and verified. Only then does the seller get paid. Both parties are protected. Locked down together - no backing out, no scams.
                </p>
              </div>
            </div>
          </div>

          {/* Simple Benefits */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-700">Buyer protection - money held safely until you confirm receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-700">Seller protection - no chargebacks or payment disputes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-700">Automatic release when both parties confirm</span>
              </div>
            </div>
          </div>

          {/* Notify Me Option */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={wantsNotify}
                onChange={(e) => setWantsNotify(e.target.checked)}
                className="mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Notify me when escrow is available</div>
              </div>
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

