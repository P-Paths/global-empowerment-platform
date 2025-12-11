'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function AboutPage() {
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
              <Link href="/about" className="text-gep-navy hover:text-gep-gold text-sm font-medium transition-colors">About</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">How it works</Link>
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
                  className="text-gep-navy hover:text-gep-gold text-base font-medium transition-colors px-2 py-2"
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
      <section className="relative bg-gradient-to-br from-gep-navy/5 to-gep-navy/10 py-12 sm:py-16 lg:py-20 xl:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 px-4">
              About
              <span className="text-gep-navy"> Global Empowerment Platform</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-3xl mx-auto px-4">
              We're building the future of entrepreneurship by transforming members into funded founders through 
              digital influence growth, AI-powered business coaching, and VC-ready preparation.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="space-y-16">
          {/* Mission Section */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">Our Mission</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              To transform entrepreneurs into funded founders by growing their digital influence, building their brand, 
              and preparing them for capital investment. We believe every entrepreneur should have access to the tools, 
              community, and connections needed to turn their vision into a fundable business.
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">What We Do</h2>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              <div className="bg-gep-gold/10 rounded-lg p-4 sm:p-6 border border-gep-gold/20">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">📱 Digital Influence Growth</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Build your following across Facebook, Instagram, TikTok, and YouTube. Post to all platforms simultaneously and grow your brand.</p>
              </div>
              <div className="bg-gep-gold/10 rounded-lg p-4 sm:p-6 border border-gep-gold/20">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">🤖 AI Growth Coach</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Get daily personalized tasks, AI-generated content, and guidance to boost your Funding Readiness Score.</p>
              </div>
              <div className="bg-gep-gold/10 rounded-lg p-4 sm:p-6 border border-gep-gold/20">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">💰 Funding Readiness Score</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Track your progress with a 0-100 score based on posting frequency, engagement, business clarity, and traction.</p>
              </div>
              <div className="bg-gep-gold/10 rounded-lg p-4 sm:p-6 border border-gep-gold/20">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">👥 Community & Networking</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Connect with 8,000+ entrepreneurs, collaborate, and build partnerships within our growing community.</p>
              </div>
            </div>
          </section>

          {/* Why Now */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6">Why Now?</h2>
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8">
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                The path from entrepreneur to funded founder is broken. Great ideas struggle to get visibility, 
                founders lack the digital presence VCs look for, and connections to investors are hard to find. 
                We're fixing this by combining social growth, AI coaching, and VC matching in one platform.
              </p>
              <div className="grid gap-4 sm:grid-cols-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-gep-navy">8,000+</div>
                  <div className="text-sm text-gray-600">Active Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gep-navy">4</div>
                  <div className="text-sm text-gray-600">Social Platforms</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gep-navy">0-100</div>
                  <div className="text-sm text-gray-600">Funding Score</div>
                </div>
              </div>
            </div>
          </section>

          {/* Current Status */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-6 sm:mb-8">Current Status</h2>
            <div className="bg-gep-gold/10 border border-gep-gold/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-gep-navy text-white px-4 py-2 rounded-full text-sm font-semibold">LIVE</span>
                <span className="text-gep-navy font-semibold">Platform Available Now</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg">
                Our platform is live and helping entrepreneurs grow their digital influence and prepare for funding. 
                Join 8,000+ members building their brand, completing daily tasks, and tracking their Funding Readiness Score.
              </p>
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">✅ Available Now:</h4>
                  <ul className="text-sm sm:text-base text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Community Feed & Networking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      AI Growth Coach & Daily Tasks
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Funding Readiness Score Tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Social Media Integration (Facebook, Instagram, TikTok, YouTube)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Multi-platform Posting
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">🚀 Coming Soon:</h4>
                  <ul className="text-sm sm:text-base text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      VC Matching & Investor Connections
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      AI Content Tools (Captions, Flyers, Pitch Decks)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Advanced Analytics & Insights
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Direct Messaging & Collaboration Tools
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4 px-4">Ready to Transform Your Business?</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
              Join 8,000+ entrepreneurs building their digital influence and preparing for funding. 
              Start growing your brand, complete daily tasks, and watch your Funding Readiness Score improve.
            </p>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center min-h-[44px] px-6 sm:px-8 py-3 sm:py-4 bg-gep-gold text-gep-navy rounded-lg text-base sm:text-lg font-semibold hover:bg-gep-gold/90 transition-colors active:scale-95 touch-manipulation"
            >
              Get Started Free
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
