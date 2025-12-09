'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Chatbot from '@/components/Chatbot';
import HeroSection from '@/components/hero';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

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
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();

  // Removed automatic redirect - allow authenticated users to browse the landing page
  // They can access dashboard via the Dashboard button in the header if needed

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning={true}>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/GEP LOGO.png" 
                alt="Global Empowerment Platform" 
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <span className="ml-3 text-sm text-gray-600 hidden sm:inline">Global Empowerment Platform</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">About</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How it works</Link>
              <Link href="/community" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Community</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                  <Link href="/dashboard" className="bg-gep-gold text-gep-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-gep-gold/90">
                    Dashboard
                  </Link>
                ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                    Sign in
                  </Link>
                  <Link href="/register" className="bg-gep-gold text-gep-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-gep-gold/90">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three steps to transform from member to funded entrepreneur
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gep-gold/20">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">1. Build Your Digital Presence</h3>
              <p className="mt-2 text-gray-600">
                Post content, grow followers, and build your brand across Facebook, Instagram, TikTok, and YouTube—all from one platform.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gep-gold/20">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">2. AI Growth Coach Guides You</h3>
              <p className="mt-2 text-gray-600">
                Get daily personalized tasks, track your progress, and watch your Funding Readiness Score grow from Building to VC-Ready.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gep-gold/20">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">3. Get Matched with Funders</h3>
              <p className="mt-2 text-gray-600">
                When you're VC-Ready, get matched with VCs, angel investors, and lenders who are looking for entrepreneurs like you.
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
              Everything You Need to Get Funded
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete ecosystem for building your business and attracting investors
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                  <span className="text-white text-lg">📊</span>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">Funding Readiness Score</h3>
              </div>
              <p className="text-gray-600">
                Track your progress with a 0-100 score based on posting frequency, engagement, business clarity, and traction.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">AI Business Coach</h3>
              </div>
              <p className="text-gray-600">
                Get AI-generated captions, flyers, pitch decks, branding, and social content calendars—all personalized for your business.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                  <span className="text-white text-lg">👥</span>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">8,000+ Member Network</h3>
              </div>
              <p className="text-gray-600">
                Connect with entrepreneurs, collaborate, and build partnerships within our growing community.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                  <span className="text-white text-lg">📱</span>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">Multi-Platform Posting</h3>
              </div>
              <p className="text-gray-600">
                Post to Facebook, Instagram, TikTok, and YouTube simultaneously. One post, maximum reach.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                  <span className="text-white text-lg">📈</span>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">Growth Analytics</h3>
              </div>
              <p className="text-gray-600">
                Track followers, engagement rates, reach, and impressions across all platforms in one dashboard.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gep-navy">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">VC Pipeline</h3>
              </div>
              <p className="text-gray-600">
                Top performers get highlighted to VCs, lenders, and angel investors actively looking for fundable founders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gep-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Transform Your Business?
          </h2>
          <p className="mt-4 text-lg text-gray-200">
            Join 8,000+ entrepreneurs building their digital influence and preparing for funding.
          </p>
          <div className="mt-10">
            <Link 
              href="/register" 
              className="inline-flex rounded-md bg-gep-gold px-6 py-3 text-sm font-semibold text-gep-navy shadow-sm hover:bg-gep-gold/90 transition-colors"
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
