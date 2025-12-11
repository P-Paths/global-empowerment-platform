'use client';

import React from 'react';

interface FeedUpdate {
  id: string;
  text: string;
}

const sampleUpdates: FeedUpdate[] = [
  { id: '1', text: 'Asia posted her new branding video' },
  { id: '2', text: 'Marcus just hit 1,000 followers!' },
  { id: '3', text: 'Nia reached a Funding Score of 72' },
  { id: '4', text: 'Jordan completed their AI Growth Coach task' },
];

export default function FeedTicker() {
  // Duplicate updates for seamless loop
  const updates = [...sampleUpdates, ...sampleUpdates];

  return (
    <div className="relative overflow-hidden mt-6 sm:mt-8">
      <div 
        className="flex gap-4 sm:gap-8"
        style={{
          animation: 'scroll 30s linear infinite',
        }}
      >
        {updates.map((update, index) => (
          <div
            key={`${update.id}-${index}`}
            className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm text-gray-300"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
            <span className="truncate max-w-[200px] sm:max-w-none">{update.text}</span>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

