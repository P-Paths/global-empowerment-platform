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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isPublic = isPublicPage(pathname);
  
  // Always start with false (light mode) to match server render and avoid hydration mismatch
  // We'll update it after hydration in useEffect
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);
    
    // Now that we're on the client, read the actual theme preference
    if (!isPublic && typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // If no saved preference, check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
      }
    }
    
    // Apply theme immediately on mount
    const root = document.documentElement;
    
    // Public pages always use light mode (no dark class)
    if (isPublic) {
      root.classList.remove('dark');
    } else {
      // Authenticated pages use theme preference
      const currentTheme = typeof window !== 'undefined' 
        ? (localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))
        : false;
      
      if (currentTheme) {
        root.classList.add('dark');
        setIsDarkMode(true);
      } else {
        root.classList.remove('dark');
        setIsDarkMode(false);
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
