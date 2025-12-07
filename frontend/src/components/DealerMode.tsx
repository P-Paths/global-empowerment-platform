'use client';

import React, { useState } from 'react';
import InventoryImporter from './InventoryImporter';

interface DealerModeProps {
  userTier?: string;
}

export default function DealerMode({ userTier = 'free_trial' }: DealerModeProps) {
  const [showImporter, setShowImporter] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const isDealerTier = userTier === 'dealer_monthly' || userTier === 'dealer_annual';

  const handleImportComplete = (result: any) => {
    setImportResult(result.message);
    setShowImporter(false);
  };

  // Always show dealer mode functionality - no upgrade block needed

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <span className="text-xl">🏢</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dealer Mode
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Import your inventory and let AI generate professional listings
          </p>
        </div>
      </div>

      {!showImporter ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Manage your entire inventory with AI-powered listings and multi-platform posting.
            </p>
            
            {/* Dealer-Specific Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowImporter(true)}
                className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                📊 Bulk CSV Import
              </button>
              <button
                onClick={() => window.location.href = '/dealer-dashboard?tab=listings'}
                className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                🚀 Post to Platforms
              </button>
            </div>
          </div>

          {importResult && (
            <div className={`p-3 rounded-lg text-sm ${
              importResult.includes('Successfully') 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {importResult}
            </div>
          )}
        </div>
      ) : (
        <div>
          <InventoryImporter onImportComplete={handleImportComplete} />
          <button
            onClick={() => setShowImporter(false)}
            className="mt-4 w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
