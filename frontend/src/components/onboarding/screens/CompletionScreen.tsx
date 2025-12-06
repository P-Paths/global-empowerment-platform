'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/onboardingService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';

interface CompletionScreenProps {
  onComplete: () => void;
}

export default function CompletionScreen({ onComplete }: CompletionScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [confettiFired, setConfettiFired] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!confettiFired) {
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      setConfettiFired(true);
    }
  }, [confettiFired]);

  const handleCreateListing = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      // Ensure onboarding is marked complete in database
      if (user) {
        const result = await onboardingService.completeOnboarding(user.id);
        if (result.error) {
          console.error('Error completing onboarding:', result.error);
          const errorMsg = result.error.message || 'Unknown error';
          alert(`Failed to complete onboarding: ${errorMsg}. Please try again or contact support.`);
          setIsCompleting(false);
          return;
        }
        // Wait for database to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify it was saved
        const isComplete = await onboardingService.getOnboardingStatus(user.id);
        if (!isComplete) {
          console.warn('Onboarding completion not saved, retrying...');
          // Retry once
          const retryResult = await onboardingService.completeOnboarding(user.id);
          if (retryResult.error) {
            alert(`Failed to save onboarding completion. Error: ${retryResult.error.message}. You can still continue to dashboard.`);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Call the onComplete callback
      onComplete();
      
      // Use window.location to force full page reload and ensure onboarding check passes
      window.location.href = '/dashboard?action=create';
    } catch (error: any) {
      console.error('Error in handleCreateListing:', error);
      alert(`An error occurred: ${error?.message || 'Unknown error'}. You can try refreshing the page.`);
      setIsCompleting(false);
    }
  };

  const handleGoToDashboard = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      // Ensure onboarding is marked complete in database
      if (user) {
        const result = await onboardingService.completeOnboarding(user.id);
        if (result.error) {
          console.error('Error completing onboarding:', result.error);
          const errorMsg = result.error.message || 'Unknown error';
          alert(`Failed to complete onboarding: ${errorMsg}. Please try again or contact support.`);
          setIsCompleting(false);
          return;
        }
        // Wait for database to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify it was saved
        const isComplete = await onboardingService.getOnboardingStatus(user.id);
        if (!isComplete) {
          console.warn('Onboarding completion not saved, retrying...');
          // Retry once
          const retryResult = await onboardingService.completeOnboarding(user.id);
          if (retryResult.error) {
            alert(`Failed to save onboarding completion. Error: ${retryResult.error.message}. You can still continue to dashboard.`);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Call the onComplete callback
      onComplete();
      
      // Use window.location to force full page reload and ensure onboarding check passes
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Error in handleGoToDashboard:', error);
      alert(`An error occurred: ${error?.message || 'Unknown error'}. You can try refreshing the page.`);
      setIsCompleting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Top Center Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                // Go back to previous screen
                window.history.back();
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Welcome to Accorria!</h2>
              <p className="text-sm md:text-base text-gray-600">You're all set</p>
            </div>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Accorria profile is ready.
          </h1>
          <p className="text-lg text-gray-600">
            You're all set to start selling!
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCreateListing}
            disabled={isCompleting}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? 'Completing...' : 'Create First Listing'}
          </button>
          <button
            onClick={handleGoToDashboard}
            disabled={isCompleting}
            className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? 'Completing...' : 'Go to Dashboard'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

