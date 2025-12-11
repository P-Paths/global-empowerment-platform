'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Set up global error handlers to catch Event objects
    const handleError = (event: ErrorEvent) => {
      // Prevent default error handling if it's an Event object
      if (event.error && event.error.toString() === '[object Event]') {
        console.error('Caught Event object as error:', event.error);
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle promise rejections that might contain Event objects
      if (event.reason && event.reason.toString() === '[object Event]') {
        console.error('Caught Event object in promise rejection:', event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Log the error properly
  useEffect(() => {
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
          message: 'An event object was thrown instead of an error. This usually happens when a form handler or event listener throws the event object.',
        };
      } else {
        errorMessage = String(error) || errorMessage;
        errorDetails = {
          raw: error,
          stringified: String(error),
        };
      }
    }

    console.error('Global error boundary caught:', errorMessage, errorDetails);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error
                ? error.message || 'An unexpected error occurred'
                : 'An unexpected error occurred'}
            </p>
            {error.toString() === '[object Event]' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
                <p className="font-semibold mb-2">Event Object Error Detected</p>
                <p className="text-sm">
                  This error occurred because an Event object was thrown instead of an Error object.
                  This typically happens when a form submission or click handler accidentally throws
                  the event object. Check your form handlers and ensure they properly handle errors.
                </p>
              </div>
            )}
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
      </body>
    </html>
  );
}

