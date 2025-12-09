'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useState, useEffect } from 'react';
import { 
  Home, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Sparkles, 
  FileText, 
  Link as LinkIcon,
  Target,
  Settings,
  BarChart3,
  CheckSquare,
  Rss,
  X,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function Sidebar({ isOpen, onToggle, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  } | null>(null);
  
  const sidebarWidth = 256; // 64 * 4 = 256px (w-64)

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          if (data.avatar_url) {
            setProfilePhoto(data.avatar_url);
          }
          if (data.first_name || data.last_name) {
            setProfileData({
              first_name: data.first_name,
              last_name: data.last_name,
              avatar_url: data.avatar_url,
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user?.id]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const menuSections = [
    {
      title: 'Main',
      items: [
        { icon: Home, label: 'Dashboard', href: '/dashboard' },
        { icon: Rss, label: 'Social Media Feed', href: '/feed' },
        { icon: Users, label: 'Community Feed', href: '/community' },
        { icon: MessageSquare, label: 'Messages', href: '/messages' },
      ],
    },
    {
      title: 'Growth & Funding',
      items: [
        { icon: TrendingUp, label: 'Growth Coach', href: '/growth' },
        { icon: DollarSign, label: 'Funding Score', href: '/funding-score' },
        { icon: Target, label: 'Tasks', href: '/tasks' },
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
      ],
    },
    {
      title: 'Tools & Content',
      items: [
        { icon: Sparkles, label: 'Clone Studio', href: '/clone-studio' },
        { icon: FileText, label: 'Pitch Deck', href: '/pitchdeck' },
        { icon: LinkIcon, label: 'Connections', href: '/dashboard/connections' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: Settings, label: 'Settings', href: '/settings' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'lg:block' : 'lg:hidden'}
        ${className}
      `}>
        <div className="flex flex-col h-full">
          {/* Header - Minimal with close button - only on mobile */}
          <div className="flex items-center justify-end h-16 px-4 flex-shrink-0 lg:hidden border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onToggle}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto p-4">

        <nav className="space-y-6">
          {menuSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                        <span className="text-sm">{item.label}</span>
                        {active && (
                          <div className="ml-auto w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

            {/* Quick Stats */}
            <div className="mt-8 pt-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                Quick Stats
              </h3>
              <div className="space-y-2 px-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Funding Score</span>
                  <span className="font-semibold text-gray-900 dark:text-white">72</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tasks Done</span>
                  <span className="font-semibold text-gray-900 dark:text-white">12/15</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Connections</span>
                  <span className="font-semibold text-gray-900 dark:text-white">4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Account Controls */}
          <div className="p-4 flex-shrink-0 space-y-2">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {profilePhoto || user?.user_metadata?.avatar_url || user?.user_metadata?.profile_photo ? (
                    <img 
                      src={profilePhoto || user.user_metadata.avatar_url || user.user_metadata.profile_photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.className = parent.className.replace('overflow-hidden', '') + ' bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center';
                          parent.innerHTML = `<span class="text-white text-xs font-semibold">${user?.email?.charAt(0).toUpperCase() || 'U'}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                      {(profileData?.first_name?.charAt(0) || profileData?.last_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {profileData?.first_name || profileData?.last_name
                      ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
                      : user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Link */}
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Toggle dark mode"
            >
              <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="text-sm font-medium">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Logout */}
            {user && (
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

