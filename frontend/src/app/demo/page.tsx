'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gep-navy via-gep-navy to-gray-50 text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-gep-navy/70">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image 
                src="/GEP LOGO.png" 
                alt="Global Empowerment Platform" 
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Demo Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            See GEP in Action
          </h1>
          <p className="mt-4 text-xl bg-gradient-to-r from-gep-gold via-yellow-400 to-gep-gold bg-clip-text text-transparent font-semibold">
            Book a live demo to see how we transform entrepreneurs into funded founders
          </p>
        </div>

        {/* Live Demo CTA Section */}
        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Live Demo</h2>
            <p className="text-gray-600 mb-6">
              Schedule a personalized demo to see how GEP works with your specific business needs
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>See the full platform in action</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>Learn about AI Growth Coach and Funding Readiness Score</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>See how to grow your digital influence and get VC-ready</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>Get your questions answered by our team</span>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/contact" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-gep-navy bg-gep-gold hover:bg-gep-gold/90">
                Book Live Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Community Feed</h3>
            <p className="text-gray-300 text-sm">
              See how members post content, engage with each other, and build their digital presence in our Instagram-like feed.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI Growth Coach</h3>
            <p className="text-gray-300 text-sm">
              Experience how our AI provides daily personalized tasks and tracks your progress toward VC-readiness.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Funding Readiness</h3>
            <p className="text-gray-300 text-sm">
              Learn how the Funding Readiness Score works and how it helps you prepare for capital investment.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Join 8,000+ entrepreneurs building their digital influence and preparing for funding.
          </p>
          <div className="space-x-4">
            <Link href="/register" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gep-navy bg-gep-gold hover:bg-gep-gold/90">
              Get Started Free
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center px-6 py-3 border border-white/20 text-base font-medium rounded-md text-white bg-transparent hover:bg-white/5">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
