/**
 * useSupabaseSession Hook
 * Phase 0: Session persistence in Supabase only (no localStorage)
 * 
 * This hook ensures all session data is stored in Supabase, not localStorage.
 * It provides real-time sync across devices via Supabase Realtime.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useAuth } from '@/contexts/AuthContext';

interface SessionData {
  [key: string]: any;
}

interface UseSupabaseSessionReturn {
  sessionData: SessionData | null;
  updateSession: (data: Partial<SessionData>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useSupabaseSession(deviceId?: string): UseSupabaseSessionReturn {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = supabaseBrowser();

  // Generate device ID if not provided
  const getDeviceId = useCallback(() => {
    if (deviceId) return deviceId;
    
    // Generate a persistent device ID (stored in sessionStorage, not localStorage)
    // sessionStorage is OK for device ID as it's not critical data
    const storedDeviceId = sessionStorage.getItem('accorria_device_id');
    if (storedDeviceId) return storedDeviceId;
    
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('accorria_device_id', newDeviceId);
    return newDeviceId;
  }, [deviceId]);

  // Detect device type
  const getDeviceType = useCallback(() => {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
      return 'mobile';
    }
    if (/Tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }, []);

  // Load session from Supabase
  const loadSession = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const deviceId = getDeviceId();
      const deviceType = getDeviceType();

      // Fetch session from API (which queries Supabase)
      const response = await fetch('/api/v1/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        // No session exists, create one
        await updateSession({});
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const data = await response.json();
      setSessionData(data.session_data || {});
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsLoading(false);
    }
  }, [user, getDeviceId, getDeviceType]);

  // Update session in Supabase
  const updateSession = useCallback(async (data: Partial<SessionData>) => {
    if (!user) return;

    try {
      setError(null);

      const deviceId = getDeviceId();
      const deviceType = getDeviceType();
      const currentData = sessionData || {};

      // Merge new data with existing data
      const updatedData = { ...currentData, ...data };

      // Save to Supabase via API
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_data: updatedData,
          device_type: deviceType,
          device_id: deviceId,
          user_agent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      setSessionData(updatedData);
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, [user, sessionData, getDeviceId, getDeviceType]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Session updated via Realtime:', payload);
          if (payload.new && 'session_data' in payload.new) {
            setSessionData(payload.new.session_data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Load session on mount and when user changes
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    sessionData,
    updateSession,
    isLoading,
    error,
  };
}

/**
 * Helper function to ensure no critical data is stored in localStorage
 * This should be called at app initialization
 */
export function ensureNoLocalStorageUsage() {
  // Check for any localStorage usage of critical data
  const criticalKeys = [
    'accorria_listings',
    'accorria_drafts',
    'accorria_messages',
    'accorria_knowledge',
    'accorria_session',
  ];

  criticalKeys.forEach((key) => {
    if (localStorage.getItem(key)) {
      console.warn(
        `⚠️ CRITICAL: Found critical data in localStorage (${key}). ` +
        `This should be migrated to Supabase.`
      );
    }
  });
}













