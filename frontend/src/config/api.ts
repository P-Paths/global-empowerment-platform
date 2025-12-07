/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Production backend URLs (multiple options for redundancy)
// Accorria Beta backend (new service connected to Accorria_Beta repo)
const PRODUCTION_BACKEND_URL = 'https://accorria-backend-beta-19949436301.us-central1.run.app';
// Accorria Demo backend (old service connected to DEMO repo) - kept as fallback
const PRODUCTION_BACKEND_URL_ALT = 'https://accorria-backend-tv2qihivdq-uc.a.run.app';

// Development backend URL (if you want to use local backend during development)
const DEVELOPMENT_BACKEND_URL = 'http://localhost:8000';

/**
 * Get the backend URL based on environment
 */
export const getBackendUrl = (): string => {
  // Always check environment variable first (highest priority)
  // NEXT_PUBLIC_ variables are available in both server and client in Next.js
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // In browser environment, check if we're in development mode
  if (typeof window !== 'undefined') {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost');
    
    // For production domains, always use the deployed backend
    if (!isDevelopment) {
      return PRODUCTION_BACKEND_URL;
    }
    
    // For development (localhost), use local backend
    // This allows devs to use local backend if running, or override with env var
    return DEVELOPMENT_BACKEND_URL;
  }
  
  // Server-side rendering fallback (use production by default)
  return PRODUCTION_BACKEND_URL;
};

/**
 * Get the full API endpoint URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Export commonly used endpoints
export const API_ENDPOINTS = {
  HEALTH: getApiUrl('health'),
  ENHANCED_ANALYZE: getApiUrl('api/v1/enhanced-analyze'),
  CAR_LISTING_GENERATE: getApiUrl('api/v1/car-listing/generate'),
  MARKET_INTELLIGENCE_ANALYZE: getApiUrl('api/v1/market-intelligence/analyze'),
  MARKET_INTELLIGENCE_QUICK_ANALYSIS: getApiUrl('api/v1/market-intelligence/quick-analysis'),
  MARKET_INTELLIGENCE_PROFIT_THRESHOLDS: getApiUrl('api/v1/market-intelligence/profit-thresholds'),
  MARKET_INTELLIGENCE_COMPETITOR_SEARCH: getApiUrl('api/v1/market-intelligence/competitor-search'),
  PLATFORM_POSTING_ANALYZE_AND_POST: getApiUrl('api/v1/platform-posting/analyze-and-post'),
  USER_LOG_ACTION: getApiUrl('api/v1/user/log_action'),
  LISTENER_UPLOAD: getApiUrl('api/v1/listener/upload'),
  CHAT_ENHANCED: getApiUrl('api/chat/enhanced'),
} as const;

// Log the configuration for debugging
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration:', {
    backendUrl: getBackendUrl(),
    isDevelopment: window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.includes('localhost'),
    hostname: window.location.hostname,
    endpoints: API_ENDPOINTS
  });
}
