/**
 * URL utilities for consistent handling across development and production
 */

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
