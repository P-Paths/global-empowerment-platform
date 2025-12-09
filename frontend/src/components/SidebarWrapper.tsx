'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from './Sidebar';

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export default function SidebarWrapper({ children }: SidebarWrapperProps) {
  const { isOpen, toggle, close } = useSidebar();
  const pathname = usePathname();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      close();
    }
  }, [pathname, close]);

  // Don't show sidebar on admin pages, home page, or public landing pages
  const publicLandingPages = [
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
    '/community', // Community page should be public, accessible from landing page
  ];
  
  const hideSidebar = 
    pathname?.startsWith('/admin') || 
    publicLandingPages.includes(pathname || '') ||
    pathname?.startsWith('/auth');

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - fixed on mobile, relative on desktop */}
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      {/* Content area - shifts on desktop when sidebar is open */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

