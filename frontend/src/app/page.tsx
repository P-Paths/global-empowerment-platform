'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Chatbot from '@/components/Chatbot';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

/**
 * Accorria - Modern Startup Design
 * Clean, minimal, conversion-focused
 * Inspired by top tech startups
 */

// Modern startup design components
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ArrowRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);


export default function Home() {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  // Check if user just verified email (from URL hash) and redirect appropriately
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (loading) return;

      // Check for Supabase auth hash in URL (email verification)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const hasAuthHash = hash.includes('access_token') || hash.includes('type=email') || hash.includes('type=signup');
        
        if (hasAuthHash) {
          // User just verified email via hash, redirect to callback handler
          router.push('/auth/callback');
          return;
        }
      }

      // If user is logged in and verified, check onboarding
      if (user && user.email_confirmed_at) {
        try {
          const { onboardingService } = await import('@/services/onboardingService');
          const isComplete = await onboardingService.getOnboardingStatus(user.id);
          if (!isComplete) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking onboarding:', error);
        }
      }
    };

    checkEmailVerification();
  }, [user, loading, router]);

  const handleAuthSuccess = () => {
    console.log('Authentication successful');
  };

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning={true}>
      {/* Modern Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-x-hidden">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-shrink-0">
              <Image 
                src="/LogoinBLUEONEword.png" 
                alt="Accorria" 
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </div>
            
            <div className="hidden md:flex items-center space-x-8 flex-shrink-0">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium whitespace-nowrap">About</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium whitespace-nowrap">How it works</Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900 text-sm font-medium whitespace-nowrap">Demo</Link>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {user ? (
                <Link href="/dashboard" className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:block">
                    Sign in
                  </Link>
                  <Link href="/register" className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Modern Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Beta Badge */}
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-8">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Private Beta - Cars Only
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Stop wasting time on
              <br />
              tire-kickers and lowballers
            </h1>
            
            {/* Subheadline */}
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Upload photos, set your price threshold, and let Accorria handle the rest. 
              Only see serious buyers who are ready to buy at your price.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors text-center"
              >
                Get started free
              </Link>
              <Link 
                href="/demo" 
                className="w-full sm:w-auto text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                Watch demo <ArrowRight />
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-x-8 text-sm text-gray-500 px-4">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <CheckIcon />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <CheckIcon />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <CheckIcon />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to stop wasting time on unqualified buyers
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">1. Upload photos & details</h3>
              <p className="mt-2 text-gray-600">
                Take 5-20 photos of your vehicle. Add mileage, condition notes (rebuilt title, fixed bumper, alternator, etc.).
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">2. Set your price threshold</h3>
              <p className="mt-2 text-gray-600">
                Set your asking price ($10,000) and minimum acceptable price ($8,000). Accorria coordinates everything else.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">3. Only see serious buyers</h3>
              <p className="mt-2 text-gray-600">
                Accorria posts to all marketplaces and filters your inbox. You only see qualified buyers ready to buy at your price.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Stop wasting time on unqualified buyers
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our unified inbox filters out tire-kickers, lowballers, and &quot;is it still available?&quot; messages
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Smart Inbox Filtering</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Never see &quot;is it still available?&quot; or lowball offers. Only serious buyers who meet your price threshold.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500">
                    <span className="text-white text-lg">🛡️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Multi-Platform Posting</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Automatically posts to Facebook Marketplace, Craigslist, OfferUp, and more with one click.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Qualified Buyers Only</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                See only buyers like &quot;Julie wants to test drive and has pre-approved financing&quot; or &quot;Samantha offers $9,500 for Friday pickup.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-20 bg-red-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              The dealership problem
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Dealers waste hours every day on unqualified buyers
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-red-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">❌ What dealers deal with now:</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• &quot;Is it still available?&quot; (50+ times per listing)</li>
                <li>• &quot;What&apos;s your lowest price?&quot; (ignoring asking price)</li>
                <li>• &quot;Will you take $7,000?&quot; (on a $10,000 car)</li>
                <li>• &quot;How many miles per gallon?&quot; (already in description)</li>
                <li>• &quot;Can I see more photos?&quot; (20+ photos already posted)</li>
                <li>• Hours spent responding to tire-kickers daily</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-green-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">✅ With Accorria:</h3>
              <ul className="space-y-3 text-gray-600">
                <li>• &quot;Julie wants to test drive, has pre-approved financing&quot;</li>
                <li>• &quot;Samantha offers $9,500 for Friday pickup&quot;</li>
                <li>• &quot;Mike is ready to buy at asking price, cash in hand&quot;</li>
                <li>• &quot;Sarah scheduled inspection for tomorrow at 2pm&quot;</li>
                <li>• Only serious buyers who meet your price threshold</li>
                <li>• Save 3-5 hours per day on unqualified leads</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Meet the founder
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built by someone who understands the challenges of selling cars
            </p>
          </div>
          
          <div className="mt-16 flex justify-center">
            <div className="bg-gray-50 rounded-2xl p-8 max-w-2xl">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <Image 
                    src="/Preston Eaton Founder.jpg" 
                    alt="Preston Eaton, Founder & CEO" 
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                  />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900">Preston Eaton</h3>
                  <p className="text-blue-600 font-semibold mb-3">Founder & CEO</p>
                  <p className="text-gray-600 mb-4">
                    Serial entrepreneur with deep experience in automotive technology. 
                    Founded Accorria to solve the trust and efficiency problems in the used car market.
                  </p>
                  <a 
                    href="https://linkedin.com/in/prestoneaton" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Connect on LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to sell your car faster?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join hundreds of sellers who are already using Accorria to get better results
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors text-center"
              >
                Get started free
              </Link>
              <Link 
                href="/demo" 
                className="w-full sm:w-auto text-sm font-semibold leading-6 text-white hover:text-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                Watch demo <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Image 
                src="/LogoinBLUEONEword.png" 
                alt="Accorria" 
                width={120}
                height={40}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-400 text-sm max-w-md">
                AI-powered car listings with escrow protection. Sell faster, safer, and for more money.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works" className="text-gray-400 hover:text-white">How it works</Link></li>
                <li><Link href="/demo" className="text-gray-400 hover:text-white">Demo</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} Accorria. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      

      {/* Working Chatbot */}
      <Chatbot />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
}
