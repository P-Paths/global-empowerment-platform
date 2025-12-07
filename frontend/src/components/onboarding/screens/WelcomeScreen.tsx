'use client';

import React from 'react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center bg-white px-6 py-8">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Hero Icon/Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to Accorria
        </h1>

        {/* Subheader */}
        <p className="text-lg text-gray-600">
          Your trust layer for online marketplaces.
        </p>

        {/* CTA Button */}
        <button
          onClick={onNext}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

