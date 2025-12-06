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
                  src="/LogoinBLUEONEword.png" 
                  alt="Accorria" 
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">About</Link>
              <Link href="/how-it-works" className="text-blue-600 hover:text-blue-700 text-sm font-medium">How it works</Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Demo</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/beta-signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Stop wasting time on
              <br />
              <span className="text-blue-600">tire-kickers and lowballers</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Upload photos, set your price threshold, and let Accorria handle everything. 
              Only see serious buyers who are ready to buy at your price.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link 
                href="/beta-signup" 
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Try it free
              </Link>
              <Link 
                href="/demo" 
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors"
              >
                Watch demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Accorria */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              The dealership problem we solve
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Dealers waste 3-5 hours every day responding to unqualified buyers. 
              Accorria filters your inbox so you only see serious buyers ready to buy at your price.
            </p>
          </div>
          
          <div className="bg-red-50 rounded-2xl p-8 mb-16 border-l-4 border-red-500">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-900 mb-4">❌ What dealers deal with now:</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <ul className="space-y-2 text-red-800">
                    <li>• "Is it still available?" (50+ times per listing)</li>
                    <li>• "What's your lowest price?" (ignoring asking price)</li>
                    <li>• "Will you take $7,000?" (on a $10,000 car)</li>
                    <li>• "How many miles per gallon?" (already in description)</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-red-800">
                    <li>• "Can I see more photos?" (20+ photos already posted)</li>
                    <li>• "Is it still available?" (asked 3 times by same person)</li>
                    <li>• "What's the VIN?" (clearly visible in photos)</li>
                    <li>• Hours spent responding to tire-kickers daily</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-2xl p-8 mb-16 border-l-4 border-green-500">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-900 mb-4">✅ With Accorria:</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <ul className="space-y-2 text-green-800">
                    <li>• "Julie wants to test drive, has pre-approved financing"</li>
                    <li>• "Samantha offers $9,500 for Friday pickup"</li>
                    <li>• "Mike is ready to buy at asking price, cash in hand"</li>
                    <li>• "Sarah scheduled inspection for tomorrow at 2pm"</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-green-800">
                    <li>• Only serious buyers who meet your price threshold</li>
                    <li>• No more "is it still available?" messages</li>
                    <li>• No more lowball offers below your minimum</li>
                    <li>• Save 3-5 hours per day on unqualified leads</li>
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
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 mb-4">
                  Step 1
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Upload Photos & Details</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Take 5-20 photos of your vehicle from different angles. Add mileage, condition notes (rebuilt title, fixed bumper, alternator, etc.), and any other important details.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Upload 5-20 photos (front, back, sides, interior, odometer)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Add mileage, condition notes, title status
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Include any repairs or modifications
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Smart Photo Analysis</h4>
                  <p className="text-sm text-gray-600">AI identifies everything from your photos</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 mb-4">
                  Step 2
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Set Your Price Threshold</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Set your asking price ($10,000) and minimum acceptable price ($8,000). Accorria coordinates everything else - photo analysis, listing creation, and marketplace posting.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Set asking price and minimum acceptable price
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Accorria analyzes photos and creates professional listing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Automatically posts to all major marketplaces
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 md:order-1">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI Writing</h4>
                  <p className="text-sm text-gray-600">Professional copy in seconds</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 mb-4">
                  Step 3
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Only See Serious Buyers</h3>
                <p className="text-lg text-gray-600 mb-6">
                  Accorria posts to all marketplaces and filters your unified inbox. You only see qualified buyers ready to buy at your price - no more tire-kickers or lowballers.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Unified inbox filters out "is it still available?" messages
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Blocks lowball offers below your minimum price
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Only see buyers with financing or serious offers
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Safe Selling</h4>
                  <p className="text-sm text-gray-600">Escrow protection for every deal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Inbox Demo */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Your Unified Inbox in Action
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See exactly what you'll see vs. what you won't see
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">❌ What you WON'T see anymore:</h3>
              <div className="space-y-3">
                <div className="bg-red-50 p-3 rounded border-l-2 border-red-300">
                  <p className="text-sm text-red-800">"Is it still available?"</p>
                  <p className="text-xs text-red-600">From: John D. • 2 minutes ago</p>
                </div>
                <div className="bg-red-50 p-3 rounded border-l-2 border-red-300">
                  <p className="text-sm text-red-800">"What's your lowest price?"</p>
                  <p className="text-xs text-red-600">From: Mike S. • 5 minutes ago</p>
                </div>
                <div className="bg-red-50 p-3 rounded border-l-2 border-red-300">
                  <p className="text-sm text-red-800">"Will you take $7,000?" (on $10k car)</p>
                  <p className="text-xs text-red-600">From: Sarah L. • 8 minutes ago</p>
                </div>
                <div className="bg-red-50 p-3 rounded border-l-2 border-red-300">
                  <p className="text-sm text-red-800">"How many miles per gallon?"</p>
                  <p className="text-xs text-red-600">From: Tom R. • 12 minutes ago</p>
                </div>
                <div className="bg-red-50 p-3 rounded border-l-2 border-red-300">
                  <p className="text-sm text-red-800">"Can I see more photos?"</p>
                  <p className="text-xs text-red-600">From: Lisa M. • 15 minutes ago</p>
                </div>
              </div>
              <p className="text-sm text-red-600 mt-4 font-medium">These messages are automatically filtered out</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">✅ What you WILL see:</h3>
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded border-l-2 border-green-300">
                  <p className="text-sm text-green-800">"Julie wants to test drive, has pre-approved financing"</p>
                  <p className="text-xs text-green-600">From: Julie K. • 3 minutes ago</p>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-2 border-green-300">
                  <p className="text-sm text-green-800">"Samantha offers $9,500 for Friday pickup"</p>
                  <p className="text-xs text-green-600">From: Samantha T. • 7 minutes ago</p>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-2 border-green-300">
                  <p className="text-sm text-green-800">"Mike is ready to buy at asking price, cash in hand"</p>
                  <p className="text-xs text-green-600">From: Mike D. • 10 minutes ago</p>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-2 border-green-300">
                  <p className="text-sm text-green-800">"Sarah scheduled inspection for tomorrow at 2pm"</p>
                  <p className="text-xs text-green-600">From: Sarah W. • 14 minutes ago</p>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-2 border-green-300">
                  <p className="text-sm text-green-800">"David has bank loan approval, wants to close today"</p>
                  <p className="text-xs text-green-600">From: David P. • 18 minutes ago</p>
                </div>
              </div>
              <p className="text-sm text-green-600 mt-4 font-medium">Only serious buyers who meet your criteria</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Accorria?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Stop wasting time on unqualified buyers and focus on serious sales
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">10x Faster</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                From photos to posting in minutes, not hours. No more spending days writing descriptions.
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
                  <h3 className="text-lg font-medium text-gray-900">Safer Deals</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                Built-in escrow protection. 1% fee (min $39, cap $149) for secure transactions.
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
                  <h3 className="text-lg font-medium text-gray-900">Better Results</h3>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                AI-optimized listings get more views and higher offers from serious buyers.
              </p>
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
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Link 
                href="/beta-signup" 
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Get started free
              </Link>
              <Link 
                href="/demo" 
                className="text-sm font-semibold leading-6 text-white hover:text-blue-100 transition-colors"
              >
                Watch demo →
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
    </div>
  );
}
