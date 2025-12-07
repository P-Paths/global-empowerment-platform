'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

interface HeaderProps {
  currentMode?: 'solo' | 'dealer';
  onModeChange?: (mode: 'solo' | 'dealer') => void;
}

export default function Header({ currentMode = 'solo', onModeChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    experience_level?: string;
  } | null>(null);

  // Load profile data from profiles table
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, first_name, last_name, experience_level')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          if (data.avatar_url) {
            setProfilePhoto(data.avatar_url);
          }
          if (data.first_name || data.last_name || data.experience_level) {
            setProfileData({
              first_name: data.first_name,
              last_name: data.last_name,
              avatar_url: data.avatar_url,
              experience_level: data.experience_level
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user?.id]);
  return (
    <header className="sticky top-0 relative z-[80] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 sm:py-4 overflow-x-hidden">
      <div className="flex items-center justify-between max-w-full">
        <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
            <img 
              src="/LogoinBLUEONEword.png" 
              alt="Accorria" 
              className="h-6 w-auto sm:h-8"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Accorria</h1>
          </div>
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:scale-105 active:scale-95 transition-transform"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {user?.email}
            </span>
          </div>
          
          <div className="relative z-[100]">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-gray-200 dark:border-gray-600"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.user_metadata?.avatar_url || user?.user_metadata?.profile_photo ? (
                <img 
                  src={user.user_metadata.avatar_url || user.user_metadata.profile_photo} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.className = parent.className.replace('overflow-hidden', '') + ' bg-gradient-to-r from-green-400 to-blue-500';
                      parent.innerHTML = `<span class="text-white text-xs sm:text-sm font-semibold">${user?.email?.charAt(0).toUpperCase() || 'U'}</span>`;
                    }
                  }}
                />
              ) : (
                        <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                  {(profileData?.first_name?.charAt(0) || profileData?.last_name?.charAt(0) || user?.email?.charAt(0) || user?.user_metadata?.first_name?.charAt(0) || 'U').toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop to prevent clicks behind dropdown */}
                <div 
                  className="fixed inset-0 z-[90] bg-transparent"
                  onClick={() => setShowDropdown(false)}
                />
                <div 
                  className="fixed right-4 top-16 sm:top-20 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-[100]"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
                  }}
                >
                {/* User Info */}
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.className = parent.className.replace('overflow-hidden', '') + ' bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center';
                              parent.innerHTML = `<span class="text-white text-sm font-semibold">${user?.email?.charAt(0).toUpperCase() || user?.user_metadata?.first_name?.charAt(0).toUpperCase() || 'U'}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {(profileData?.first_name?.charAt(0) || profileData?.last_name?.charAt(0) || user?.email?.charAt(0) || user?.user_metadata?.first_name?.charAt(0) || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {profileData?.first_name || profileData?.last_name
                          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
                          : user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                            : user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mode Switcher - Only show if onModeChange is provided AND user is experienced */}
                {onModeChange && profileData?.experience_level === 'experienced' && (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      Switch Mode
                    </div>
                    <button
                      onClick={() => {
                        onModeChange('solo');
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                        currentMode === 'solo' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      👤 Solo Mode
                    </button>
                    <button
                      onClick={() => {
                        onModeChange('dealer');
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                        currentMode === 'dealer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      🏢 Dealer Mode
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  </>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    toggleDarkMode();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>

                {/* Sign Out */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    signOut();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 