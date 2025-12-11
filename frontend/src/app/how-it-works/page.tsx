'use client';

import React, { useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function HowItWorksPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Modern Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/GEP LOGO.png" 
                  alt="Global Empowerment Platform" 
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">About</Link>
              <Link href="/how-it-works" className="text-gep-navy hover:text-gep-gold text-sm font-medium transition-colors">How it works</Link>
            </div>
            
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
                  className="text-gep-navy hover:text-gep-gold text-base font-medium transition-colors px-2 py-2"
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
      <section className="relative bg-gradient-to-br from-gep-navy to-gep-navy/90 py-12 sm:py-16 lg:py-20 xl:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white px-4">
              Transform from Member to
              <br />
              <span className="text-gep-gold">Funded Entrepreneur</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-200 max-w-3xl mx-auto px-4">
              Build your digital influence, grow your following, and prepare for capital investment—all in one platform. 
              Join 8,000+ entrepreneurs on their journey to VC-ready.
            </p>
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-x-6">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center min-h-[44px] rounded-md bg-gep-gold px-6 py-3 text-sm sm:text-base font-semibold text-gep-navy shadow-sm hover:bg-gep-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gep-gold transition-colors active:scale-95 touch-manipulation"
              >
                Join Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4">
              The Entrepreneur Challenge We Solve
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4 leading-relaxed">
              Entrepreneurs struggle to build digital influence, grow their following, and prepare for funding—all while running their business. 
              GEP provides the tools, community, and AI guidance to make it happen.
            </p>
          </div>
          
          <div className="bg-red-50 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16 border-l-4 border-red-500">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-red-900 mb-4 px-4">❌ What entrepreneurs struggle with:</h3>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 text-left">
                <div>
                  <ul className="space-y-2 text-sm sm:text-base text-red-800">
                    <li>• No time to consistently post on social media</li>
                    <li>• Don't know what content to create</li>
                    <li>• Low follower counts and engagement</li>
                    <li>• Unclear how to prepare for funding</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-sm sm:text-base text-red-800">
                    <li>• No network of fellow entrepreneurs</li>
                    <li>• Can't track progress toward VC-readiness</li>
                    <li>• Missing business formation knowledge</li>
                    <li>• No clear path to investor connections</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16 border-l-4 border-green-500">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-green-900 mb-4 px-4">✅ With GEP:</h3>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 text-left">
                <div>
                  <ul className="space-y-2 text-sm sm:text-base text-green-800">
                    <li>• AI Growth Coach provides daily personalized tasks</li>
                    <li>• Auto-generate captions, flyers, and content</li>
                    <li>• Multi-platform posting to FB, IG, TikTok, YouTube</li>
                    <li>• Track your Funding Readiness Score (0-100)</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-sm sm:text-base text-green-800">
                    <li>• Connect with 8,000+ member entrepreneur network</li>
                    <li>• Clear path from Building → Emerging → VC-Ready</li>
                    <li>• AI-powered business coaching and pitch deck tools</li>
                    <li>• Get matched with VCs when you're ready</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900 px-4">How It Works</h2>
          <div className="grid gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gep-gold/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gep-navy mb-3 sm:mb-4">
                  Step 1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">Build Your Digital Presence</h3>
                <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  Create your profile, upload your first product, and make your first post. Our AI tools help you generate professional content, captions, and flyers automatically.
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Set up your business profile and bio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Upload products with AI-generated descriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Post to community feed and social platforms</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gep-gold/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">📱</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Multi-Platform Posting</h4>
                  <p className="text-xs sm:text-sm text-gray-600">One post, maximum reach across all platforms</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-gep-gold/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gep-navy mb-3 sm:mb-4">
                  Step 2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">AI Growth Coach Guides You</h3>
                <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  Get daily personalized tasks from your AI Growth Coach. Track your progress, build streaks, and watch your Funding Readiness Score grow from Building (0-49) to Emerging (50-79) to VC-Ready (80-100).
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Daily tasks: "Post a reel today", "Engage with 3 members"</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Track posting consistency and engagement metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Watch your Funding Readiness Score improve</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 md:order-1">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gep-gold/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">🤖</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">AI-Powered Guidance</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Personalized coaching for your growth journey</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gep-gold/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gep-navy mb-3 sm:mb-4">
                  Step 3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">Get Matched with Funders</h3>
                <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  When you reach VC-Ready status (80-100), get matched with VCs, angel investors, and lenders actively looking for fundable founders. Your Funding Readiness Score and growth metrics speak for themselves.
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Top performers highlighted in VC dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>AI-generated pitch decks and business materials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full flex-shrink-0"></span>
                    <span>Direct connections with interested investors</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gep-gold/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">💰</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">VC Pipeline</h4>
                  <p className="text-xs sm:text-sm text-gray-600">Get discovered by investors when you're ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 px-4">
              Everything You Need to Get Funded
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              A complete ecosystem for building your business and attracting investors
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Funding Readiness Score</h3>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Track your progress with a 0-100 score based on posting frequency, engagement, business clarity, and traction.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">AI Business Coach</h3>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Get AI-generated captions, flyers, pitch decks, branding, and social content calendars—all personalized for your business.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">👥</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">8,000+ Member Network</h3>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Connect with entrepreneurs, collaborate, and build partnerships within our growing community.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">📱</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Multi-Platform Posting</h3>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Post to Facebook, Instagram, TikTok, and YouTube simultaneously. One post, maximum reach.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">📈</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Growth Analytics</h3>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Track followers, engagement rates, reach, and impressions across all platforms in one dashboard.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">VC Pipeline</h3>
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Top performers get highlighted to VCs, lenders, and angel investors actively looking for fundable founders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gep-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white px-4">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-200 max-w-2xl mx-auto px-4">
              Join 8,000+ entrepreneurs building their digital influence and preparing for funding.
            </p>
            <div className="mt-6 sm:mt-8 flex items-center justify-center">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center min-h-[44px] rounded-md bg-gep-gold px-6 py-3 text-sm sm:text-base font-semibold text-gep-navy shadow-sm hover:bg-gep-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gep-gold transition-colors active:scale-95 touch-manipulation"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
