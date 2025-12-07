'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import SellingExperienceScreen from './screens/SellingExperienceScreen';
import CategorySelectionScreen from './screens/CategorySelectionScreen';
import MarketplaceEcosystemScreen from './screens/MarketplaceEcosystemScreen';
import MessagingPreferencesScreen from './screens/MessagingPreferencesScreen';
import EscrowPreviewScreen from './screens/EscrowPreviewScreen';
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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const totalScreens = 8;

  const handleNext = async (data?: Partial<OnboardingData>) => {
    console.log('➡️ Moving to next screen:', {
      currentScreen,
      totalScreens,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasUser: !!user,
      userId: user?.id
    });

    if (data) {
      const updatedData = { ...onboardingData, ...data };
      setOnboardingData(updatedData);

      // Save to Supabase
      if (user) {
        console.log('💾 Saving onboarding data to Supabase...', {
          userId: user.id,
          dataKeys: Object.keys(data)
        });
        const result = await onboardingService.updateOnboardingData(user.id, data);
        if (result.error) {
          console.error('❌ Error saving onboarding data:', result.error);
          alert(`Failed to save: ${result.error.message}`);
          return; // Don't proceed to next screen if save failed
        } else {
          console.log('✅ Onboarding data saved successfully');
        }
      } else {
        console.warn('⚠️ No user found - cannot save onboarding data');
      }
    }

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
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
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
            width: `${totalScreens * 100}vw`
          }}
        >
          {/* Screen 1: Welcome */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <WelcomeScreen onNext={() => handleNext()} />
          </div>
          {/* Screen 2: Profile Setup */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <ProfileSetupScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          </div>
          {/* Screen 3: Selling Experience */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <SellingExperienceScreen
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
          {/* Screen 5: Marketplace Ecosystem */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <MarketplaceEcosystemScreen
              category={onboardingData.selected_category}
              onNext={() => handleNext()}
              onBack={handleBack}
            />
          </div>
          {/* Screen 6: Messaging Preferences */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <MessagingPreferencesScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          </div>
          {/* Screen 7: Escrow Preview */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <EscrowPreviewScreen
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          </div>
          {/* Screen 8: Completion */}
          <div className="w-screen flex-shrink-0 h-full overflow-y-auto">
            <CompletionScreen onComplete={onComplete} />
          </div>
        </div>
      ) : (
        <div className="h-full w-full relative">
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
            <SellingExperienceScreen
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
          {currentScreen === 4 && (
            <MarketplaceEcosystemScreen
              category={onboardingData.selected_category}
              onNext={() => handleNext()}
              onBack={handleBack}
            />
          )}
          {currentScreen === 5 && (
            <MessagingPreferencesScreen
              initialData={onboardingData}
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          )}
          {currentScreen === 6 && (
            <EscrowPreviewScreen
              onNext={(data) => handleNext(data)}
              onBack={handleBack}
            />
          )}
          {currentScreen === 7 && <CompletionScreen onComplete={onComplete} />}
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

