'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CRMSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const CRMSidebar: React.FC<CRMSidebarProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      current: pathname === '/admin'
    },
    {
      name: 'Leads',
      href: '/admin/leads',
      icon: '👥',
      current: pathname === '/admin/leads'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: '📈',
      current: pathname === '/admin/analytics'
    },
    {
      name: 'Email Campaigns',
      href: '/admin/email-campaigns',
      icon: '📧',
      current: pathname === '/admin/email-campaigns'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: '⚙️',
      current: pathname === '/admin/settings'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">Accorria CRM</span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${item.current
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 px-3">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Leads</span>
                <span className="font-semibold text-gray-900">7</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hot Leads</span>
                <span className="font-semibold text-red-600">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold text-green-600">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">P</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Preston Eaton</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CRMSidebar;
