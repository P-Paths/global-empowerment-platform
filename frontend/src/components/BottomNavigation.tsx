'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 overflow-x-auto shadow-lg z-50">
      <div className="flex justify-around items-center min-w-max max-w-7xl mx-auto">
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors ${
            isActive('/dashboard') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <span className="text-xl sm:text-2xl">🏠</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Home</span>
        </Link>
        <Link 
          href="/feed" 
          className={`flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors ${
            isActive('/feed') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <span className="text-xl sm:text-2xl">📱</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Feed</span>
        </Link>
        <Link 
          href="/growth" 
          className={`flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors ${
            isActive('/growth') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <span className="text-xl sm:text-2xl">📈</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Growth</span>
        </Link>
        <Link 
          href="/messages" 
          className={`flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors ${
            isActive('/messages') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <span className="text-xl sm:text-2xl">💬</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Messages</span>
        </Link>
        <Link 
          href="/funding-score" 
          className={`flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors ${
            isActive('/funding-score') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <span className="text-xl sm:text-2xl">💰</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Funding</span>
        </Link>
        <Link 
          href="/dashboard/connections" 
          className={`flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors ${
            isActive('/dashboard/connections') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <span className="text-xl sm:text-2xl">🔗</span>
          <span className="text-[10px] sm:text-xs mt-1 whitespace-nowrap">Links</span>
        </Link>
      </div>
    </nav>
  );
}

