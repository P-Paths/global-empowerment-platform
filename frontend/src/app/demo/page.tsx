'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Demo() {
  const [demoData, setDemoData] = useState({
    year: '',
    make: '',
    model: '',
    mileage: ''
  });
  const [showResult, setShowResult] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDemoData({
      ...demoData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-50 text-slate-100">
      {/* Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image 
              src="/AccorriaYwLOGO.png" 
              alt="Accorria" 
              width={175}
              height={175}
              className="h-[175px] w-auto"
              priority
            />
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
            See Accorria in Action
          </h1>
          <p className="mt-4 text-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-semibold">
            Book a live demo to see how AI transforms selling from hours to minutes
          </p>
        </div>

        {/* Live Demo CTA Section */}
        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Live Demo</h2>
            <p className="text-gray-600 mb-6">
              Schedule a personalized demo to see how Accorria works with your specific needs
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>See the full process in action</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>Get your questions answered</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>✓</span>
                <span>Learn how to maximize your results</span>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/beta-signup" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-slate-900 bg-amber-400 hover:bg-amber-300">
                Book Live Demo
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to try Accorria?
          </h2>
          <p className="text-xl text-slate-700 mb-8">
            Join the beta and be among the first to experience AI-powered car selling.
          </p>
          <div className="space-x-4">
            <Link href="/beta-signup" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-slate-900 bg-amber-400 hover:bg-amber-300">
              Get Early Access
            </Link>
            <Link href="/" className="inline-flex items-center px-6 py-3 border border-white/20 text-base font-medium rounded-md text-white bg-transparent hover:bg-white/5">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
