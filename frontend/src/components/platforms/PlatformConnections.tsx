'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/api';
import { getBackendUrl } from '@/config/api';

interface PlatformConnection {
  platform: string;
  connected: boolean;
  user_info?: {
    name?: string;
    id?: string;
  };
  pages?: Array<{
    page_id: string;
    name: string;
    category: string;
  }>;
  last_used?: string;
  token_expires?: string;
  error?: string;
}

interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresAuth: boolean;
  authUrl?: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'facebook_marketplace',
    name: 'Facebook Marketplace',
    icon: '📘',
    description: 'Post to Facebook Marketplace',
    requiresAuth: true
  },
  {
    id: 'offerup',
    name: 'OfferUp',
    icon: '📱',
    description: 'Post to OfferUp',
    requiresAuth: true
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    icon: '📋',
    description: 'Post to Craigslist',
    requiresAuth: true
  },
  {
    id: 'ebay',
    name: 'eBay Motors',
    icon: '🛒',
    description: 'Post to eBay Motors',
    requiresAuth: true
  },
  {
    id: 'autotrader',
    name: 'AutoTrader',
    icon: '🚗',
    description: 'Post to AutoTrader',
    requiresAuth: true
  },
  {
    id: 'cars_com',
    name: 'Cars.com',
    icon: '🚙',
    description: 'Post to Cars.com',
    requiresAuth: true
  }
];

export default function PlatformConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Record<string, PlatformConnection>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listen for Facebook connection success message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'FACEBOOK_CONNECTED' && event.data?.success) {
        console.log('✅ Facebook connection successful! Reloading connections...');
        // Reload connections after a short delay to ensure backend has saved
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load connection statuses for all platforms
  useEffect(() => {
    if (!user) return;
    
    const loadConnections = async () => {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Connection loading timeout - setting loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        const connectionPromises = PLATFORMS.map(async (platform) => {
          try {
            // For Facebook, use the existing endpoint
            if (platform.id === 'facebook_marketplace') {
              const backendUrl = getBackendUrl();
              
              // Add timeout to the fetch request - shorter timeout for connection status
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout (backend has 3 second DB timeout)
              
              let response;
              try {
                response = await authenticatedFetch(`${backendUrl}/api/v1/facebook/connection-status`, {
                  signal: controller.signal
                });
                clearTimeout(timeout);
              } catch (fetchErr: any) {
                clearTimeout(timeout);
                if (fetchErr.name === 'AbortError' || fetchErr.message?.includes('timeout') || fetchErr.message?.includes('aborted')) {
                  console.warn('Facebook connection status request timed out or was aborted');
                  return {
                    platform: platform.id,
                    connected: false,
                    error: 'Request timed out'
                  };
                }
                // For network errors, return gracefully
                if (fetchErr.message?.includes('Failed to fetch') || fetchErr.message?.includes('network')) {
                  console.warn('Facebook connection status network error:', fetchErr.message);
                  return {
                    platform: platform.id,
                    connected: false,
                    error: 'Network error'
                  };
                }
                throw fetchErr;
              }
              
              // Check if response is OK and content type is JSON
              const contentType = response.headers.get('content-type');
              if (response.ok && contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return {
                  platform: platform.id,
                  connected: data.connected || false,
                  user_info: data.user_info,
                  pages: data.pages || [],
                  last_used: data.last_used,
                  token_expires: data.token_expires
                };
              } else {
                // If not JSON, try to get error message
                const text = await response.text();
                console.warn(`Non-JSON response for ${platform.id}:`, text.substring(0, 100));
                return {
                  platform: platform.id,
                  connected: false,
                  error: 'Invalid response format'
                };
              }
            }
            
            // For other platforms, check if connection endpoint exists
            // For now, return not connected
            return {
              platform: platform.id,
              connected: false,
              error: 'Connection not implemented yet'
            };
          } catch (err: any) {
            console.error(`Error loading ${platform.id} connection:`, err);
            // If it's a JSON parse error, provide a clearer message
            if (err instanceof SyntaxError && err.message.includes('JSON')) {
              return {
                platform: platform.id,
                connected: false,
                error: 'Server returned invalid response (not JSON)'
              };
            }
            return {
              platform: platform.id,
              connected: false,
              error: err.message || 'Failed to load connection status'
            };
          }
        });

        const results = await Promise.all(connectionPromises);
        const connectionMap: Record<string, PlatformConnection> = {};
        
        results.forEach((result) => {
          connectionMap[result.platform] = result;
        });

        setConnections(connectionMap);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Error loading connections:', err);
        setError('Failed to load platform connections');
        clearTimeout(timeoutId);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [user]);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    setError(null);

    try {
      if (platformId === 'facebook_marketplace') {
        // Initiate Facebook OAuth
        const backendUrl = getBackendUrl();
        console.log('🔄 Initiating Facebook connection...');
        const response = await authenticatedFetch(`${backendUrl}/api/v1/auth/facebook/connect`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Received authorization URL, opening popup...');
          if (data.authorization_url) {
            // Open Facebook authorization in popup
            // First, open Facebook logout to clear session, then redirect to OAuth
            // This allows user to select the correct account (Megan's, not Preston's)
            const logoutUrl = `https://www.facebook.com/logout.php?next=${encodeURIComponent(data.authorization_url)}&ref=logout`;
            
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            
            const popup = window.open(
              logoutUrl,
              'Facebook Connection',
              `width=${width},height=${height},left=${left},top=${top}`
            );
            
            // Facebook logout will automatically redirect to the OAuth URL
            // User can then log in with the correct account

            // Listen for success message from popup
            const handleMessage = (event: MessageEvent) => {
              if (event.origin !== window.location.origin) return;
              
              if (event.data?.type === 'FACEBOOK_CONNECTED' && event.data?.success) {
                console.log('✅ Received Facebook connection success message!', event.data);
                window.removeEventListener('message', handleMessage);
                clearInterval(checkClosed);
                // Reload connections after a short delay to ensure backend has saved
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }
            };
            
            window.addEventListener('message', handleMessage);
            
            // Poll for popup to close (fallback if message doesn't work)
            const checkClosed = setInterval(() => {
              if (popup?.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', handleMessage);
                // Reload connections after a short delay
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }, 500);

            // Timeout after 5 minutes
            setTimeout(() => {
              clearInterval(checkClosed);
              if (popup && !popup.closed) {
                popup.close();
              }
            }, 300000);
          } else {
            throw new Error('No authorization URL received');
          }
        } else {
          const errorText = await response.text();
          let errorMessage = 'Failed to initiate connection';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
            
            // If it's about missing credentials, provide helpful guidance
            if (errorMessage.includes('FACEBOOK_APP_ID') || errorMessage.includes('FACEBOOK_APP_SECRET')) {
              errorMessage = 'Facebook OAuth is not configured. The backend needs Facebook App credentials (FACEBOOK_APP_ID and FACEBOOK_APP_SECRET) to be set in environment variables. Please contact your administrator or set up a Facebook App in Facebook Developer Console.';
            }
          } catch {
            // If response isn't JSON, use the text
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
      } else {
        // Other platforms - not implemented yet
        setError(`${PLATFORMS.find(p => p.id === platformId)?.name || platformId} connection is not available yet`);
      }
    } catch (err: any) {
      console.error(`Error connecting to ${platformId}:`, err);
      setError(err.message || `Failed to connect to ${platformId}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (!confirm(`Are you sure you want to disconnect ${PLATFORMS.find(p => p.id === platformId)?.name || platformId}?`)) {
      return;
    }

    setConnecting(platformId);
    setError(null);

    try {
      // TODO: Implement disconnect endpoint
      setError('Disconnect not implemented yet');
    } catch (err: any) {
      console.error(`Error disconnecting ${platformId}:`, err);
      setError(err.message || `Failed to disconnect ${platformId}`);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading platform connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Connections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your accounts to post listings to multiple marketplaces automatically
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Platform Cards */}
        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const connection = connections[platform.id];
            const isConnected = connection?.connected || false;
            const isConnecting = connecting === platform.id;

            return (
              <div
                key={platform.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Platform Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{platform.icon}</span>
                      </div>
                    </div>

                    {/* Platform Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {platform.description}
                      </p>

                      {/* Connection Status */}
                      {isConnected ? (
                        <div className="space-y-2">
                          {connection.user_info?.name && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Connected as:</span> {connection.user_info.name}
                            </p>
                          )}
                          {connection.pages && connection.pages.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Connected Pages:
                              </p>
                              <ul className="list-disc list-inside space-y-1">
                                {connection.pages.map((page) => (
                                  <li key={page.page_id} className="text-sm text-gray-600 dark:text-gray-400">
                                    {page.name} ({page.category})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {connection.last_used && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Last used: {new Date(connection.last_used).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Not connected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Connect/Disconnect Button */}
                  <div className="flex-shrink-0 ml-4">
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={isConnecting}
                        className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isConnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isConnecting ? (
                          <span className="flex items-center">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            Connecting...
                          </span>
                        ) : (
                          'Connect'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2 text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                How it works
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Connect your accounts once, and we'll automatically post your listings to all selected platforms.
                You can manage which platforms to use for each listing when you create it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

