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

  // Don't show sidebar on admin pages or home page
  const hideSidebar = pathname?.startsWith('/admin') || pathname === '/';

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - fixed on mobile, relative on desktop */}
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      {/* Content area - shifts on desktop when sidebar is open */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isOpen ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {children}
      </div>
    </div>
  );
}

