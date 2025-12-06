'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/api';
import { getBackendUrl } from '@/config/api';

function FacebookCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Facebook connection...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');

      // Handle errors from Facebook
      if (error) {
        setStatus('error');
        setMessage(`Facebook connection failed: ${errorReason || error}`);
        setTimeout(() => {
          window.close(); // Close popup if opened in popup
          router.push('/dashboard/connections');
        }, 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code. Please try connecting again.');
        setTimeout(() => {
          window.close();
          router.push('/dashboard/connections');
        }, 3000);
        return;
      }

      try {
        // Exchange code for tokens via backend
        const backendUrl = getBackendUrl();
        console.log('🔄 Exchanging Facebook OAuth code for tokens...', { code: code.substring(0, 20) + '...', state: state.substring(0, 20) + '...' });
        const response = await authenticatedFetch(
          `${backendUrl}/api/v1/auth/facebook/callback?code=${code}&state=${state}`
        );
        console.log('📡 Backend callback response:', response.status, response.statusText);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.warn('Non-JSON response from backend:', text);
            setStatus('error');
            setMessage('Server returned invalid response format. Please try again.');
            setTimeout(() => {
              window.close();
              router.push('/dashboard/connections');
            }, 3000);
            return;
          }
          
          const data = await response.json();
          
          // Check if response has expected structure
          if (!data || !data.success) {
            console.error('Invalid response structure:', data);
            setStatus('error');
            setMessage(data?.message || 'Connection response was invalid. Please try again.');
            setTimeout(() => {
              window.close();
              router.push('/dashboard/connections');
            }, 3000);
            return;
          }
          
          setStatus('success');
          setMessage(data.message || 'Facebook account connected successfully!');
          
          console.log('✅ Facebook connection successful!', data);
          
          // Close popup if opened in popup, otherwise redirect
          setTimeout(() => {
            if (window.opener) {
              // Tell parent window that connection succeeded
              const origin = window.location.origin;
              console.log('📤 Sending success message to parent window:', origin);
              window.opener.postMessage({ 
                type: 'FACEBOOK_CONNECTED', 
                success: true,
                connectionId: data.connection_id,
                userInfo: data.user_info
              }, origin);
              // Give parent time to receive message before closing
              setTimeout(() => {
                window.close();
              }, 500);
            } else {
              // Redirect to connections page
              router.push('/dashboard/connections');
            }
          }, 1500);
        } else {
          let errorMessage = 'Failed to connect Facebook account';
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
            console.error('Facebook callback API error:', errorData);
          } catch (parseError) {
            const errorText = await response.text();
            errorMessage = errorText || `Server returned ${response.status} ${response.statusText}`;
            console.error('Facebook callback error (non-JSON):', errorMessage);
          }
          setStatus('error');
          setMessage(`Connection failed: ${errorMessage}. Please try connecting again.`);
          setTimeout(() => {
            window.close();
            router.push('/dashboard/connections');
          }, 3000);
        }
      } catch (err: any) {
        console.error('Facebook callback error:', err);
        setStatus('error');
        setMessage(err.message || 'An error occurred while connecting Facebook');
        setTimeout(() => {
          window.close();
          router.push('/dashboard/connections');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting to Facebook...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Redirecting...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Closing window...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <FacebookCallbackContent />
    </Suspense>
  );
}

