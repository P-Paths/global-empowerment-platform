'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error properly, handling Event objects
    let errorMessage = 'An error occurred';
    let errorDetails: any = null;

    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
      errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error && typeof error === 'object') {
      // Handle Event objects or other non-Error objects
      if (error.toString() === '[object Event]' || error.constructor?.name === 'Event') {
        errorMessage = 'An unexpected event error occurred';
        errorDetails = {
          type: 'Event',
          message: 'An event object was thrown instead of an error',
        };
      } else {
        // Try to extract useful information
        errorMessage = String(error) || errorMessage;
        errorDetails = {
          raw: error,
          stringified: String(error),
        };
      }
    }

    console.error('Error boundary caught:', errorMessage, errorDetails);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">
          {error instanceof Error
            ? error.message || 'An unexpected error occurred'
            : 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

