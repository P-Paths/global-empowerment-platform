'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getAppUrl, getHomeUrl, getBaseUrl } from '@/utils/urls';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Using the imported supabase client directly

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Session check timeout - setting loading to false');
        setLoading(false);
      }, 5000); // 5 second timeout

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        
        // Handle refresh token errors gracefully
        if (error) {
          console.warn('⚠️ Session error (will clear invalid session):', {
            message: error.message,
            code: error.code,
            name: error.name
          });
          
          // If refresh token is missing or invalid, clear the session silently
          if (
            error.message?.includes('Refresh Token') || 
            error.message?.includes('refresh_token') ||
            error.message?.includes('Invalid Refresh Token') ||
            error.code === 'PGRST301' ||
            error.name === 'AuthApiError'
          ) {
            console.log('🧹 Clearing invalid session...');
            // Clear invalid session silently
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              // Ignore sign out errors - we're just cleaning up
              console.log('Note: Error during sign out cleanup (ignored)');
            }
            // Clear localStorage tokens manually
            if (typeof window !== 'undefined') {
              localStorage.removeItem('sb-' + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token');
            }
            setSession(null);
            setUser(null);
            setIsEmailVerified(false);
            setLoading(false);
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsEmailVerified(session?.user?.email_confirmed_at ? true : false);
        setLoading(false);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('❌ Error getting session:', {
          error,
          message: error?.message,
          code: error?.code,
          name: error?.name
        });
        
        // Clear session on any error, especially refresh token errors
        if (
          error?.message?.includes('Refresh Token') || 
          error?.message?.includes('refresh_token') ||
          error?.message?.includes('Invalid Refresh Token')
        ) {
          console.log('🧹 Clearing invalid session due to refresh token error...');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            // Ignore sign out errors
          }
          // Clear localStorage tokens manually
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sb-' + (process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token');
          }
        }
        
        setSession(null);
        setUser(null);
        setIsEmailVerified(false);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        });

        // Handle auth state changes
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          setIsEmailVerified(session?.user?.email_confirmed_at ? true : false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsEmailVerified(false);
        } else if (event === 'USER_UPDATED') {
          setSession(session);
          setUser(session?.user ?? null);
          setIsEmailVerified(session?.user?.email_confirmed_at ? true : false);
        } else {
          // Handle all other events (INITIAL_SESSION, PASSWORD_RECOVERY, etc.)
          setSession(session);
          setUser(session?.user ?? null);
          setIsEmailVerified(session?.user?.email_confirmed_at ? true : false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Simple dev login - use "user" as email and "register" as password
      if (email === 'user' && password === 'register') {
        const mockUser: User = {
          id: '00000000-0000-0000-0000-000000000123',
          email: 'demo@accorria.com',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          app_metadata: {},
          aud: 'authenticated',
          user_metadata: {
            first_name: firstName || 'Demo',
            last_name: lastName || 'User',
            full_name: `${firstName || 'Demo'} ${lastName || 'User'}`.trim(),
            phone: phone || ''
          }
        };
        
          setUser(mockUser as User);
        setIsEmailVerified(true);
        setLoading(false);
        return { error: null };
      }

      // Sign up with Supabase
      console.log('🔵 Attempting to sign up user:', { email, hasPassword: !!password });
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            full_name: `${firstName || ''} ${lastName || ''}`.trim()
          },
          emailRedirectTo: `${getBaseUrl()}/auth/callback?type=signup`
        }
      });

      console.log('🔵 Sign up response:', {
        hasData: !!signUpData,
        hasUser: !!signUpData?.user,
        userId: signUpData?.user?.id,
        email: signUpData?.user?.email,
        emailConfirmed: !!signUpData?.user?.email_confirmed_at,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        setError(error.message);
        return { error };
      }

      // Check if user was actually created
      if (!signUpData?.user) {
        console.error('❌ Sign up succeeded but no user object returned');
        setError('User account was not created. Please try again.');
        // Create AuthError by casting through unknown (required because __isAuthError is protected)
        const authError = {
          message: 'User account was not created',
          name: 'AuthError',
          __isAuthError: true,
          code: 'signup_failed',
          status: 400
        } as unknown as AuthError;
        return { error: authError };
      }

      console.log('✅ User created successfully:', signUpData.user.id);

      // Set the user in context if email is already confirmed (for testing)
      if (signUpData.user.email_confirmed_at) {
        setUser(signUpData.user);
        setIsEmailVerified(true);
      } else {
        // User needs to verify email
        console.log('📧 User needs to verify email');
      }

      // User will need to verify email before accessing dashboard
      return { error: null };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      // Create a proper AuthError object (cast through unknown because __isAuthError is protected)
      const authError = {
        message: errorMessage,
        name: 'AuthError',
        __isAuthError: true,
        code: 'registration_failed',
        status: 500
      } as unknown as AuthError;
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Simple dev login - use "user" as email and "register" as password
      if (email === 'user' && password === 'register') {
        const mockUser: User = {
          id: '00000000-0000-0000-0000-000000000123',
          email: 'demo@accorria.com',
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          app_metadata: {},
          aud: 'authenticated',
          user_metadata: {
            first_name: 'Demo',
            last_name: 'User',
            full_name: 'Demo User'
          }
        };
        
          setUser(mockUser as User);
        setIsEmailVerified(true);
        setLoading(false);
        return { error: null };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Improve error message for email confirmation
        let errorMessage = error.message;
        if (error.message.toLowerCase().includes('email not confirmed') || 
            error.message.toLowerCase().includes('email_not_confirmed')) {
          errorMessage = 'Please confirm your email to log in. Check your inbox for the confirmation link.';
        }
        setError(errorMessage);
        // Return the error as-is (it's already an AuthError from Supabase)
        return { error };
      }

      return { error: null };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      // Create a proper AuthError object (cast through unknown because __isAuthError is protected)
      const authError = {
        message: errorMessage,
        name: 'AuthError',
        __isAuthError: true,
        code: 'login_failed',
        status: 500
      } as unknown as AuthError;
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsEmailVerified(false);
      setError(null);
      // Redirect to homepage after sign out
      if (typeof window !== 'undefined') {
        window.location.href = getHomeUrl();
      }
    } catch (error) {
      setError('Logout failed');
      console.error('Error signing out:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    error,
    clearError,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
