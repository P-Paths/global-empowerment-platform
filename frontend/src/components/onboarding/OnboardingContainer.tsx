'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import BusinessExperienceScreen from './screens/BusinessExperienceScreen';
import CategorySelectionScreen from './screens/CategorySelectionScreen';
import CompletionScreen from './screens/CompletionScreen';
import { onboardingService, OnboardingData } from '@/services/onboardingService';

interface OnboardingContainerProps {
  onComplete: () => void;
}

export default function OnboardingContainer({ onComplete }: OnboardingContainerProps) {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const totalScreens = 5; // Welcome, Profile, Business Experience, Category, Completion

  const handleNext = async (data?: Partial<OnboardingData>) => {
    // Prevent double-clicks
    if (isSaving) {
      console.log('⏸️ Already saving, ignoring duplicate click');
      return;
    }

    console.log('➡️ Moving to next screen:', {
      currentScreen,
      totalScreens,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasUser: !!user,
      userId: user?.id
    });

    if (data) {
      setIsSaving(true);
      const updatedData = { ...onboardingData, ...data };
      setOnboardingData(updatedData);

      // Save to Supabase
      if (user) {
        console.log('💾 Saving onboarding data to Supabase...', {
          userId: user.id,
          dataKeys: Object.keys(data)
        });
        try {
          const result = await onboardingService.updateOnboardingData(user.id, data);
          if (result.error) {
            console.error('❌ Error saving onboarding data:', result.error);
            // Check if it's a network error
            const isNetworkError = result.error.message?.includes('Failed to connect') || 
                                  result.error.message?.includes('network');
            if (isNetworkError) {
              alert(`Connection error: ${result.error.message}. Please check your internet connection and try again.`);
            } else {
              alert(`Failed to save: ${result.error.message}`);
            }
            setIsSaving(false);
            return; // Don't proceed to next screen if save failed
          } else {
            console.log('✅ Onboarding data saved successfully');
          }
        } catch (error: any) {
          console.error('❌ Exception saving onboarding data:', error);
          const errorMessage = error?.message || error?.toString() || 'An error occurred while saving.';
          const isNetworkError = errorMessage.includes('Failed to connect') || 
                                errorMessage.includes('network') ||
                                error?.isNetworkError;
          if (isNetworkError) {
            alert(`Connection error: ${errorMessage}. Please check your internet connection and try again.`);
          } else {
            alert(`An error occurred while saving: ${errorMessage}. Please try again.`);
          }
          setIsSaving(false);
          return;
        } finally {
          // Always reset saving state
          setIsSaving(false);
        }
      } else {
        console.warn('⚠️ No user found - cannot save onboarding data');
        setIsSaving(false);
      }
    } else {
      // No data to save, just advance
      setIsSaving(false);
    }

    // Advance to next screen
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // Last screen reached - completion screen will handle the completion
      // Don't call onComplete here, let the CompletionScreen handle it
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSkip = () => {
    // Allow skipping to completion (for testing)
    if (user) {
      onboardingService.completeOnboarding(user.id);
    }
    onComplete();
  };

  // Screen transition styles
  const getTransitionStyle = () => {
    if (isMobile) {
      return {
        transform: `translateX(-${currentScreen * 100}%)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      };
    } else {
      return {
        opacity: 1,
        transition: 'opacity 0.3s ease-in-out'
      };
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-10">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${((currentScreen + 1) / totalScreens) * 100}%` }}
        />
      </div>

      {/* Screen Container */}
      {isMobile ? (
        <div
          className="h-full flex relative"
          style={{
            transform: `translateX(-${currentScreen * 100}vw)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: `${totalScreens * 100}vw`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            isolation: 'isolate',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Screen 1: Welcome */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <WelcomeScreen onNext={() => handleNext()} />
          </div>
          {/* Screen 2: Profile Setup */}
          <div className="w-screen flex-shrink-0 h-full overflow-hidden">
            <ProfileSetupScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          </div>
          {/* Screen 3: Business Experience */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <BusinessExperienceScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          </div>
          {/* Screen 4: Category Selection */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <CategorySelectionScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          </div>
          {/* Screen 5: Completion */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <CompletionScreen onComplete={onComplete} />
          </div>
        </div>
      ) : (
        <div className="h-full w-full relative overflow-hidden">
          {/* Desktop: Show only current screen with fade */}
          {currentScreen === 0 && <WelcomeScreen onNext={() => handleNext()} />}
          {currentScreen === 1 && (
            <ProfileSetupScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          )}
          {currentScreen === 2 && (
            <BusinessExperienceScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          )}
          {currentScreen === 3 && (
            <CategorySelectionScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          )}
          {currentScreen === 4 && <CompletionScreen onComplete={onComplete} />}
        </div>
      )}

      {/* Skip Button (for testing - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleSkip}
          className="fixed bottom-4 right-4 text-xs text-gray-400 hover:text-gray-600 z-50"
        >
          Skip Onboarding
        </button>
      )}
    </div>
  );
}

