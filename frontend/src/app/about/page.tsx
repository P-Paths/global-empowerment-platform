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
              <Link href="/about" className="text-gep-navy hover:text-gep-gold text-sm font-medium">About</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How it works</Link>
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
      <section className="relative bg-gradient-to-br from-gep-navy/5 to-gep-navy/10 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              About
              <span className="text-gep-navy"> Global Empowerment Platform</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              We're building the future of entrepreneurship by transforming members into funded founders through 
              digital influence growth, AI-powered business coaching, and VC-ready preparation.
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
              To transform entrepreneurs into funded founders by growing their digital influence, building their brand, 
              and preparing them for capital investment. We believe every entrepreneur should have access to the tools, 
              community, and connections needed to turn their vision into a fundable business.
            </p>
          </section>

          {/* What We Do */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">What We Do</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="bg-gep-gold/10 rounded-lg p-6 border border-gep-gold/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📱 Digital Influence Growth</h3>
                <p className="text-gray-600">Build your following across Facebook, Instagram, TikTok, and YouTube. Post to all platforms simultaneously and grow your brand.</p>
              </div>
              <div className="bg-gep-gold/10 rounded-lg p-6 border border-gep-gold/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🤖 AI Growth Coach</h3>
                <p className="text-gray-600">Get daily personalized tasks, AI-generated content, and guidance to boost your Funding Readiness Score.</p>
              </div>
              <div className="bg-gep-gold/10 rounded-lg p-6 border border-gep-gold/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💰 Funding Readiness Score</h3>
                <p className="text-gray-600">Track your progress with a 0-100 score based on posting frequency, engagement, business clarity, and traction.</p>
              </div>
              <div className="bg-gep-gold/10 rounded-lg p-6 border border-gep-gold/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">👥 Community & Networking</h3>
                <p className="text-gray-600">Connect with 8,000+ entrepreneurs, collaborate, and build partnerships within our growing community.</p>
              </div>
            </div>
          </section>

          {/* Why Now */}
          <section>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Why Now?</h2>
            <div className="bg-gray-50 rounded-2xl p-8">
              <p className="text-lg text-gray-600 mb-6">
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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Current Status</h2>
            <div className="bg-gep-gold/10 border border-gep-gold/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-gep-navy text-white px-4 py-2 rounded-full text-sm font-semibold">LIVE</span>
                <span className="text-gep-navy font-semibold">Platform Available Now</span>
              </div>
              <p className="text-gray-700 mb-6 text-lg">
                Our platform is live and helping entrepreneurs grow their digital influence and prepare for funding. 
                Join 8,000+ members building their brand, completing daily tasks, and tracking their Funding Readiness Score.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">✅ Available Now:</h4>
                  <ul className="text-gray-700 space-y-2">
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
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">🚀 Coming Soon:</h4>
                  <ul className="text-gray-700 space-y-2">
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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Ready to Transform Your Business?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join 8,000+ entrepreneurs building their digital influence and preparing for funding. 
              Start growing your brand, complete daily tasks, and watch your Funding Readiness Score improve.
            </p>
            <Link 
              href="/register" 
              className="inline-flex items-center px-8 py-4 bg-gep-gold text-gep-navy rounded-lg text-lg font-semibold hover:bg-gep-gold/90 transition-colors"
            >
              Get Started Free
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
