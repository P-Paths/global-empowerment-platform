'use client';

import React from 'react';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';

interface HeaderProps {
  currentMode?: 'solo' | 'dealer';
  onModeChange?: (mode: 'solo' | 'dealer') => void;
}

export default function Header({ currentMode = 'solo', onModeChange }: HeaderProps) {
  const { toggle: toggleSidebar, isOpen } = useSidebar();
  return (
    <header className="sticky top-0 relative z-[80] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className={`flex items-center h-16 transition-all duration-300 ${isOpen ? 'lg:pl-4' : 'px-3 sm:px-4 lg:pl-4'}`}>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity ml-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
            <img 
              src="/GEP LOGO.png" 
              alt="Global Empowerment Platform" 
              className="h-6 w-auto sm:h-8"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">GEP</h1>
          </div>
        </Link>
      </div>
    </header>
  );
} 