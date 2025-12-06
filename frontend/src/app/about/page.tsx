import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
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
              <Link href="/about" className="text-blue-600 hover:text-blue-700 text-sm font-medium">About</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How it works</Link>
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
              About
              <span className="text-blue-600"> Accorria</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              We're building the future of car selling with AI-powered listings and secure escrow protection. 
              Making it easier, faster, and safer to sell your car online.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-16">
          {/* Mission Section */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-8">
              To make buying and selling cars safer, faster, and more transparent through AI automation and blockchain technology. 
              We believe everyone should be able to sell their car without worrying about scams, fake checks, or getting ripped off.
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">What We Do</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🤖 AI-Powered Listings</h3>
                <p className="text-gray-600">Upload photos, get professional listings in seconds. No more staring at blank screens.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🛡️ Secure Escrow</h3>
                <p className="text-gray-600">Built-in protection with 1% fee. No scams, no fake checks, no delays.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📱 Multi-Platform Posting</h3>
                <p className="text-gray-600">Post to Facebook, Craigslist, and more with one click.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">⚡ Faster Sales</h3>
                <p className="text-gray-600">Better listings get more views and higher offers from serious buyers.</p>
              </div>
            </div>
          </section>

          {/* Why Now */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Why Now?</h2>
            <div className="bg-gray-50 rounded-2xl p-8">
              <p className="text-lg text-gray-600 mb-6">
                The $1.4 trillion used car market is broken. People lose money to scams, spend hours writing listings, 
                and deal with fake buyers. We're fixing this with technology that actually works.
              </p>
              <div className="grid gap-4 sm:grid-cols-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">$1.4T</div>
                  <div className="text-sm text-gray-600">Used car market</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">10x</div>
                  <div className="text-sm text-gray-600">Faster listings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">100%</div>
                  <div className="text-sm text-gray-600">Secure payments</div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Meet the Team</h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <Image 
                    src="/Preston Eaton Founder.jpg" 
                    alt="Preston Eaton, Founder & CEO" 
                    width={150}
                    height={150}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Preston Eaton</h3>
                  <p className="text-blue-600 font-semibold mb-4">Founder & CEO</p>
                  <p className="text-gray-600 mb-6">
                    Preston is a serial entrepreneur with deep experience in automotive technology and marketplace platforms. 
                    He founded Accorria to solve the trust and efficiency problems he witnessed firsthand in the used car market.
                  </p>
                  <a 
                    href="https://linkedin.com/in/prestoneaton" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                    </svg>
                    Connect on LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Current Status */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Current Status</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">PRIVATE BETA</span>
                <span className="text-blue-800 font-semibold">Cars Only - Available Now</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg">
                We're currently in private beta for car listings. Our AI-powered photo analysis, listing generation, 
                and escrow integration are live and working. Homes and high-value items are coming in Q2 2026.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">✅ Available Now:</h4>
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      AI photo analysis & listing generation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Car escrow (1% fee, min $39, cap $149)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Facebook Marketplace posting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Mobile-optimized interface
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">🚀 Coming Soon:</h4>
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Craigslist & OfferUp posting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Home listings (Q2 2026)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Bulk dealer import tools
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      AI negotiation agent
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our private beta and experience the future of car selling. 
              Upload photos, get perfect listings, and sell safely with escrow protection.
            </p>
            <Link 
              href="/beta-signup" 
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Join Beta - It's Free
            </Link>
          </section>
        </div>
      </main>

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
