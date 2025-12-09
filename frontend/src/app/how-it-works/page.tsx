'use client';

import React from "react";
import Link from 'next/link';
import Image from 'next/image';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
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
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">About</Link>
              <Link href="/how-it-works" className="text-gep-navy hover:text-gep-gold text-sm font-medium">How it works</Link>
              <Link href="/community" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Community</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/register" className="bg-gep-gold text-gep-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-gep-gold/90 transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gep-navy to-gep-navy/90 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Transform from Member to
              <br />
              <span className="text-gep-gold">Funded Entrepreneur</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-200 max-w-3xl mx-auto">
              Build your digital influence, grow your following, and prepare for capital investment—all in one platform. 
              Join 8,000+ entrepreneurs on their journey to VC-ready.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link 
                href="/register" 
                className="rounded-md bg-gep-gold px-6 py-3 text-sm font-semibold text-gep-navy shadow-sm hover:bg-gep-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gep-gold transition-colors"
              >
                Join Free
              </Link>
              <Link 
                href="/community" 
                className="text-sm font-semibold leading-6 text-white hover:text-gep-gold transition-colors"
              >
                Explore Community →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              The Entrepreneur Challenge We Solve
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Entrepreneurs struggle to build digital influence, grow their following, and prepare for funding—all while running their business. 
              GEP provides the tools, community, and AI guidance to make it happen.
            </p>
          </div>
          
          <div className="bg-red-50 rounded-2xl p-8 mb-16 border-l-4 border-red-500">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-900 mb-4">❌ What entrepreneurs struggle with:</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <ul className="space-y-2 text-red-800">
                    <li>• No time to consistently post on social media</li>
                    <li>• Don't know what content to create</li>
                    <li>• Low follower counts and engagement</li>
                    <li>• Unclear how to prepare for funding</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-red-800">
                    <li>• No network of fellow entrepreneurs</li>
                    <li>• Can't track progress toward VC-readiness</li>
                    <li>• Missing business formation knowledge</li>
                    <li>• No clear path to investor connections</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-2xl p-8 mb-16 border-l-4 border-green-500">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-900 mb-4">✅ With GEP:</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <ul className="space-y-2 text-green-800">
                    <li>• AI Growth Coach provides daily personalized tasks</li>
                    <li>• Auto-generate captions, flyers, and content</li>
                    <li>• Multi-platform posting to FB, IG, TikTok, YouTube</li>
                    <li>• Track your Funding Readiness Score (0-100)</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-green-800">
                    <li>• Connect with 8,000+ member entrepreneur network</li>
                    <li>• Clear path from Building → Emerging → VC-Ready</li>
                    <li>• AI-powered business coaching and pitch deck tools</li>
                    <li>• Get matched with VCs when you're ready</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid gap-12">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gep-gold/20 px-4 py-2 text-sm font-semibold text-gep-navy mb-4">
                  Step 1
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Build Your Digital Presence</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Create your profile, upload your first product, and make your first post. Our AI tools help you generate professional content, captions, and flyers automatically.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Set up your business profile and bio
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Upload products with AI-generated descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Post to community feed and social platforms
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gep-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Multi-Platform Posting</h4>
                  <p className="text-sm text-gray-600">One post, maximum reach across all platforms</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-gep-gold/20 px-4 py-2 text-sm font-semibold text-gep-navy mb-4">
                  Step 2
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">AI Growth Coach Guides You</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Get daily personalized tasks from your AI Growth Coach. Track your progress, build streaks, and watch your Funding Readiness Score grow from Building (0-49) to Emerging (50-79) to VC-Ready (80-100).
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Daily tasks: "Post a reel today", "Engage with 3 members"
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Track posting consistency and engagement metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Watch your Funding Readiness Score improve
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 md:order-1">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gep-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Guidance</h4>
                  <p className="text-sm text-gray-600">Personalized coaching for your growth journey</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gep-gold/20 px-4 py-2 text-sm font-semibold text-gep-navy mb-4">
                  Step 3
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Get Matched with Funders</h3>
                <p className="text-lg text-gray-600 mb-6">
                  When you reach VC-Ready status (80-100), get matched with VCs, angel investors, and lenders actively looking for fundable founders. Your Funding Readiness Score and growth metrics speak for themselves.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Top performers highlighted in VC dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    AI-generated pitch decks and business materials
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gep-gold rounded-full"></span>
                    Direct connections with interested investors
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gep-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">VC Pipeline</h4>
                  <p className="text-sm text-gray-600">Get discovered by investors when you're ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Get Funded
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete ecosystem for building your business and attracting investors
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Funding Readiness Score</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Track your progress with a 0-100 score based on posting frequency, engagement, business clarity, and traction.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">AI Business Coach</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Get AI-generated captions, flyers, pitch decks, branding, and social content calendars—all personalized for your business.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">8,000+ Member Network</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Connect with entrepreneurs, collaborate, and build partnerships within our growing community.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">📱</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Multi-Platform Posting</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Post to Facebook, Instagram, TikTok, and YouTube simultaneously. One post, maximum reach.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">📈</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Growth Analytics</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Track followers, engagement rates, reach, and impressions across all platforms in one dashboard.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">VC Pipeline</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Top performers get highlighted to VCs, lenders, and angel investors actively looking for fundable founders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gep-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-lg text-gray-200">
              Join 8,000+ entrepreneurs building their digital influence and preparing for funding.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link 
                href="/register" 
                className="rounded-md bg-gep-gold px-6 py-3 text-sm font-semibold text-gep-navy shadow-sm hover:bg-gep-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gep-gold transition-colors"
              >
                Get Started Free
              </Link>
              <Link 
                href="/community" 
                className="text-sm font-semibold leading-6 text-white hover:text-gep-gold transition-colors"
              >
                Explore Community →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
