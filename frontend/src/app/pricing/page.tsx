'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// Simple check icon component
const CheckIcon = ({ className = "h-5 w-5 text-green-500" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free Trial',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for testing the platform',
      features: [
        '3 posts total',
        '7-day trial period',
        'AI listing generator',
        'Basic FlipScore',
        'Messenger bot (baseline replies)',
        'Multi-platform posting',
        'Email support'
      ],
      cta: 'Start Free Trial',
      popular: false,
      trial: true
    },
    {
      name: 'Starter',
      price: { monthly: 20, yearly: 200 },
      description: 'For side hustlers and occasional sellers',
      features: [
        '5 posts per month',
        'AI listing generator',
        'Enhanced FlipScore',
        'Messenger bot (baseline replies)',
        'Multi-platform posting',
        'Simple analytics',
        'Email support'
      ],
      cta: 'Get Started',
      popular: true
    },
    {
      name: 'Growth',
      price: { monthly: 50, yearly: 500 },
      description: 'For full-time flippers and salespeople',
      features: [
        'Unlimited posts',
        'AI listing generator',
        'Advanced FlipScore with market comps',
        'Messenger bot (enhanced replies + auto follow-ups)',
        'Smart listing optimizer',
        'Lead & sales analytics',
        'Priority support'
      ],
      cta: 'Go Growth',
      popular: false
    },
    {
      name: 'Dealer Pro',
      price: { monthly: 200, yearly: 2000 },
      description: 'For dealerships and teams',
      features: [
        'Unlimited posts + team seats',
        'AI listing generator',
        'Advanced FlipScore with insight pack',
        'Messenger bot (end-to-end automation)',
        'Team accounts',
        'Auction tools',
        'Repair cost estimator',
        'Dealer analytics',
        'Dedicated support'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const getBillingText = (plan: typeof plans[0]) => {
    if (plan.price.monthly === 0) return '';
    return billingCycle === 'yearly' ? '/year' : '/month';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
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
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">How it works</Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Demo</Link>
              <Link href="/pricing" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Pricing</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/beta-signup" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Get Early Access
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your selling needs. All plans include our AI listing generator and messenger bot.
            </p>
            
            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center space-x-4">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Save 17%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? 'border-blue-500 bg-blue-50'
                  : plan.trial
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.trial && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white">
                    Free Trial
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{getPrice(plan)}</span>
                  <span className="text-sm text-gray-600">{getBillingText(plan)}</span>
                </div>
              </div>
              
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <Link
                  href="/beta-signup"
                  className={`block w-full rounded-lg px-4 py-2 text-center text-sm font-medium ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : plan.trial
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to know about our pricing and plans.
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">What counts as a "post"?</h3>
              <p className="mt-2 text-gray-600">
                A post is one unique vehicle listing generated and pushed by the app. Each new VIN/plate or new image bundle counts as a new post. Edits to existing listings don't consume additional posts.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Can I change plans anytime?</h3>
              <p className="mt-2 text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">What is FlipScore?</h3>
              <p className="mt-2 text-gray-600">
                FlipScore is our proprietary AI algorithm that scores your car's resale potential from 0-100. It considers market demand, seasonality, condition, mileage, and title status.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">How does the messenger bot work?</h3>
              <p className="mt-2 text-gray-600">
                Our AI messenger bot handles buyer communication automatically using your rules (price floor, availability, location). It notifies you only when action is needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to start selling smarter?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of sellers who are already using Accorria to sell faster and for more money.
            </p>
            <div className="mt-8">
              <Link
                href="/beta-signup"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Get Early Access
              </Link>
            </div>
          </div>
        </div>
      </div>

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
