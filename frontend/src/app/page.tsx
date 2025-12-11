'use client';

import React, { useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Chatbot from '@/components/Chatbot';
import HeroSection from '@/components/hero';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global Empowerment Platform (GEP) - Homepage
 * Transform members into funded entrepreneurs through digital influence growth
 */

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
  const { user } = useAuth();
  const router = useRouter();

  // Removed automatic redirect - allow authenticated users to browse the landing page
  // They can access dashboard via the Dashboard button in the header if needed

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" suppressHydrationWarning={true}>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/" className="flex items-center min-w-0">
                <Image 
                  src="/GEP LOGO.png" 
                  alt="Global Empowerment Platform" 
                  width={120}
                  height={40}
                  className="h-8 sm:h-10 w-auto"
                  priority
                />
                <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-600 hidden sm:inline truncate">Global Empowerment Platform</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">About</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">How it works</Link>
            </div>
            
            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4 ml-6 lg:ml-8">
              {user ? (
                  <Link href="/dashboard" className="bg-gep-gold text-gep-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-gep-gold/90 transition-colors whitespace-nowrap">
                    Dashboard
                  </Link>
                ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors whitespace-nowrap">
                    Sign in
                  </Link>
                  <Link href="/register" className="bg-gep-gold text-gep-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-gep-gold/90 transition-colors whitespace-nowrap">
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/about" 
                  className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors px-2 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/how-it-works" 
                  className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors px-2 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it works
                </Link>
                <div className="pt-2 border-t border-gray-100">
                  {user ? (
                    <Link 
                      href="/dashboard" 
                      className="block bg-gep-gold text-gep-navy px-4 py-3 rounded-lg text-sm font-medium hover:bg-gep-gold/90 transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link 
                        href="/login" 
                        className="block text-gray-600 hover:text-gray-900 text-base font-medium transition-colors px-2 py-2 mb-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link 
                        href="/register" 
                        className="block bg-gep-gold text-gep-navy px-4 py-3 rounded-lg text-sm font-medium hover:bg-gep-gold/90 transition-colors text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <React.Suspense fallback={<div className="h-96 bg-gep-navy"></div>}>
        <HeroSection />
      </React.Suspense>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Three steps to transform from member to funded entrepreneur
            </p>
          </div>
          
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gep-gold/20 dark:bg-gep-gold/30">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">1. Build Your Digital Presence</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Post content, grow followers, and build your brand across Facebook, Instagram, TikTok, and YouTube—all from one platform.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gep-gold/20 dark:bg-gep-gold/30">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">2. AI Growth Coach Guides You</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Get daily personalized tasks, track your progress, and watch your Funding Readiness Score grow from Building to VC-Ready.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gep-gold/20 dark:bg-gep-gold/30">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">3. Get Matched with Funders</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                When you're VC-Ready, get matched with VCs, angel investors, and lenders who are looking for entrepreneurs like you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gep-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4">
              Everything You Need to Get Funded
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">
              A complete ecosystem for building your business and attracting investors
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 hover:border-gep-gold/50 transition-colors">
              <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-white">Funding Readiness Score</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Track your progress with a 0-100 score based on posting frequency, engagement, business clarity, and traction.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 hover:border-purple-500/50 transition-colors">
              <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🤖</span>
                </div>
                <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-white">AI Business Coach</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Get AI-generated captions, flyers, pitch decks, branding, and social content calendars—all personalized for your business.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 hover:border-blue-500/50 transition-colors">
              <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👥</span>
                </div>
                <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-white">8,000+ Member Network</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Connect with entrepreneurs, collaborate, and build partnerships within our growing community.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📱</span>
                </div>
                <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-white">Multi-Platform Posting</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Post to Facebook, Instagram, TikTok, and YouTube simultaneously. One post, maximum reach.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 hover:border-green-500/50 transition-colors">
              <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📈</span>
                </div>
                <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-white">Growth Analytics</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Track followers, engagement rates, reach, and impressions across all platforms in one dashboard.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-700/50 hover:border-pink-500/50 transition-colors">
              <div className="flex items-start sm:items-center mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-white">VC Pipeline</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                Top performers get highlighted to VCs, lenders, and angel investors actively looking for fundable founders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gep-navy border-t border-gray-700/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white px-4">
            Ready to Transform Your Business?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">
            Join 8,000+ entrepreneurs building their digital influence and preparing for funding.
          </p>
          <div className="mt-8 sm:mt-10">
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center min-h-[44px] rounded-md bg-gep-gold px-6 py-3 text-sm sm:text-base font-semibold text-gep-navy shadow-lg hover:bg-gep-gold/90 transition-all duration-200 active:scale-95 touch-manipulation"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <Chatbot />
    </div>
  );
}
