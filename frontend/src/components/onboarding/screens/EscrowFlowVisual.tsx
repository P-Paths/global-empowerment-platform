'use client';

import React from 'react';

/**
 * Visual flow diagram for escrow process
 * Shows: Blockchain → Two People → Car → Checkmarks → Transaction
 */
export default function EscrowFlowVisual() {
  return (
    <div className="w-full py-6">
      {/* Flow Steps */}
      <div className="flex items-center justify-between relative">
        {/* Step 1: Blockchain/Smart Contract */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-xs font-semibold text-gray-700 text-center">Smart Contract</div>
          <div className="text-xs text-gray-500 text-center mt-1">Secure blockchain</div>
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center px-2">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 2: Two People */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mb-2 relative">
            {/* Buyer */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-green-500">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {/* Seller */}
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-green-500">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {/* Handshake icon in center */}
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-xs font-semibold text-gray-700 text-center">Buyer & Seller</div>
          <div className="text-xs text-gray-500 text-center mt-1">Agree on deal</div>
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center px-2">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 3: Car */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="text-xs font-semibold text-gray-700 text-center">Vehicle</div>
          <div className="text-xs text-gray-500 text-center mt-1">Delivered on time</div>
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center px-2">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 4: Checkmarks */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
            <div className="flex items-center gap-1">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-700 text-center">Both Confirm</div>
          <div className="text-xs text-gray-500 text-center mt-1">Everything checks out</div>
        </div>

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center px-2">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 5: Transaction Complete */}
        <div className="flex flex-col items-center flex-1 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs font-semibold text-gray-700 text-center">Payment Released</div>
          <div className="text-xs text-gray-500 text-center mt-1">Transaction complete</div>
        </div>
      </div>

      {/* Caption */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 font-medium">
          "$15,000 → Take the car → Pay later"
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Money held securely until both parties confirm. No risk, no scams.
        </p>
      </div>
    </div>
  );
}

