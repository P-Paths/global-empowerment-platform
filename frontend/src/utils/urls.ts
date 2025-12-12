/**
 * URL utilities for consistent handling across development and production
 */

export const getBaseUrl = (): string => {
  // Always prefer environment variable for production (Supabase email links)
  // This ensures email confirmation links go to production, not localhost
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback to window.location.origin only if no env var is set (local dev)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side rendering fallback
  return 'http://localhost:3000';
};

export const getAppUrl = (): string => {
  return `${getBaseUrl()}/dashboard`;
};

export const getHomeUrl = (): string => {
  return getBaseUrl();
};

export const getLoginUrl = (): string => {
  return `${getBaseUrl()}/`;
};

export const getDashboardUrl = (): string => {
  return `${getBaseUrl()}/dashboard`;
};
