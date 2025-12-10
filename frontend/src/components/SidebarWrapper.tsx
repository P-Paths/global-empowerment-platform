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
    // Removed '/community' - now uses authenticated layout when user is logged in
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
      {/* Sidebar - toggleable on all screen sizes */}
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      {/* Content area - shifts when sidebar is open */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {children}
      </div>
    </div>
  );
}

