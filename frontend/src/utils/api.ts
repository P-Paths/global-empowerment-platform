import { supabase } from './supabase';

/**
 * Make an authenticated API call with Supabase JWT token
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    // Add authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Use provided signal or create a default timeout
    // Market intelligence calls need longer timeout (60 seconds) for Google Search API
    // Connection status checks should use shorter timeout (already provided by caller)
    let timeoutController: AbortController | null = null;
    let signal = options.signal;
    if (!signal) {
      timeoutController = new AbortController();
      // Check if this is a market intelligence call - needs longer timeout
      const isMarketIntelligence = url.includes('market-intelligence');
      // Connection status checks should be fast - use shorter timeout if not provided
      const isConnectionStatus = url.includes('connection-status');
      const timeout = isMarketIntelligence ? 60000 : (isConnectionStatus ? 10000 : 30000); // 60s for market intel, 10s for connection status, 30s for others
      setTimeout(() => timeoutController!.abort(), timeout);
      signal = timeoutController.signal;
    }
    
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      signal,
    };
    
    // Make the request with better error handling
    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (fetchError: any) {
      // Provide more context for network errors
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        const timeout = url.includes('market-intelligence') ? 60 : 30;
        throw new Error(`Request to ${url} timed out after ${timeout} seconds`);
      } else if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('network')) {
        // For connection status checks, return a rejected promise that can be caught gracefully
        // Don't throw a noisy error for backend connection checks
        const error = new Error(`Failed to connect to ${url}. Check your network connection.`);
        // Mark as network error so components can handle gracefully
        (error as any).isNetworkError = true;
        (error as any).isSilent = url.includes('connection-status'); // Mark connection-status checks as silent
        throw error;
      }
      throw fetchError;
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
}

/**
 * Make an authenticated API call and return JSON
 */
export async function authenticatedFetchJson<T = unknown>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Post form data with authentication and retry logic
 */
export async function postFormData(
  url: string, 
  formData: FormData
): Promise<unknown> {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Prepare headers
      const headers: Record<string, string> = {};
      
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Make the request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort('Request timeout after 300 seconds - image processing may be taking too long'), 300000); // 300 second timeout for car analysis with multiple large images
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${errorText}`);
      }
      
      return response.json();
      
    } catch (error: unknown) {
      console.error(`Post form data error (attempt ${retries + 1}):`, error);
      
      // Check if it's a network error that we should retry
      const errorObj = error as Error;
      if (errorObj.name === 'AbortError' || 
          (errorObj.message && errorObj.message.includes('Failed to fetch')) || 
          (errorObj.message && errorObj.message.includes('ERR_NETWORK_CHANGED')) ||
          (errorObj.message && errorObj.message.includes('ERR_INTERNET_DISCONNECTED'))) {
        
        if (retries < maxRetries - 1) {
          console.warn(`Network error encountered, retrying... Attempt ${retries + 1}/${maxRetries}`);
          retries++;
          // Exponential backoff: wait 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
          continue;
        }
      }
      
      // If it's not a network error or we've exhausted retries, throw the error
      throw error;
    }
  }
  
  throw new Error(`API call failed after ${maxRetries} retries due to network issues.`);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Export api object for backward compatibility
export const api = {
  authenticatedFetch,
  authenticatedFetchJson,
  postFormData,
  isAuthenticated,
  getCurrentUser,
  supabase,
  // HTTP method shortcuts
  get: (url: string) => authenticatedFetchJson(url, { method: 'GET' }),
  post: (url: string, data?: unknown) => authenticatedFetchJson(url, { 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  }),
  put: (url: string, data?: unknown) => authenticatedFetchJson(url, { 
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined 
  }),
  delete: (url: string) => authenticatedFetchJson(url, { method: 'DELETE' })
}; 