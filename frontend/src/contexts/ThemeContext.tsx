'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isPublicPage: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Public pages that should always use fixed styling (no dark mode)
const PUBLIC_PAGES = [
  '/',
  '/about',
  '/how-it-works',
  '/pricing',
  '/demo',
  '/register',
  '/login',
  '/terms',
  '/privacy',
  '/cookies',
  '/contact',
  '/qa',
  '/beta-signup',
  '/get-paid',
];

// Helper function to check if current page is public
function isPublicPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PAGES.includes(pathname) || pathname.startsWith('/auth');
}

// Helper function to get initial theme (runs on both server and client)
function getInitialTheme(): boolean {
  if (typeof window === 'undefined') {
    return false; // Default to light mode on server
  }
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme === 'dark';
  }
  
  // If no saved preference, check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isPublic = isPublicPage(pathname);
  
  // Initialize with the theme from localStorage immediately
  const [isDarkMode, setIsDarkMode] = useState(() => getInitialTheme());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);
    
    // Apply theme immediately on mount
    const root = document.documentElement;
    
    // Public pages always use light mode (no dark class)
    if (isPublic) {
      root.classList.remove('dark');
    } else {
      // Authenticated pages use theme preference
      if (isDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [isPublic]);

  useEffect(() => {
    // Apply theme to document whenever it changes
    const root = document.documentElement;
    
    // Public pages always use light mode (no dark class)
    if (isPublic) {
      root.classList.remove('dark');
    } else {
      // Authenticated pages use theme preference
      if (isDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Save to localStorage (only for authenticated pages)
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      }
    }
  }, [isDarkMode, isPublic]);

  const toggleDarkMode = () => {
    // Only allow toggling on authenticated pages
    if (!isPublic) {
      setIsDarkMode(prev => !prev);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isPublicPage: isPublic }}>
      {children}
    </ThemeContext.Provider>
  );
};
