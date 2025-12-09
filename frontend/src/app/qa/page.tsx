'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

export default function QAPage() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Global Empowerment Platform work?",
      answer: "Global Empowerment Platform helps entrepreneurs build their digital influence and prepare for funding. Post content across social media platforms, track your growth, and get matched with investors when you're VC-ready."
    },
    {
      question: "What makes Global Empowerment Platform different?",
      answer: "Global Empowerment Platform combines social media growth, AI-powered business coaching, and investor matching in one platform. We don't just help you post - we help you build your brand, track your progress, and get matched with VCs and investors when you're ready."
    },
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI uses advanced machine learning to analyze car photos with 90%+ accuracy. It can detect make, model, year, features, and condition from your photos. The more photos you provide, the more accurate the analysis."
    },
    {
      question: "What is FlipScore?",
      answer: "FlipScore is our proprietary AI algorithm that scores your car's resale potential from 0-100. It considers factors like market demand, seasonality, condition, mileage, and title status to give you an accurate estimate of how quickly and profitably you can sell your car."
    },
    {
      question: "How does the Messenger Bot work?",
      answer: "Our AI messenger bot connects to your Facebook Messenger and automatically responds to buyer inquiries using your rules. It can answer common questions, schedule appointments, and only notifies you when there's a serious buyer or important decision needed."
    },
    {
      question: "Can I edit the AI-generated listings?",
      answer: "Absolutely! You have full control over all AI-generated content. You can edit the title, description, price, and any other details before posting. The AI is there to help, not replace your judgment."
    },
    {
      question: "What platforms do you support?",
      answer: "Currently, we support Facebook Marketplace, Craigslist, and OfferUp. We provide copy-ready content that you can paste directly into these platforms. We're working on direct integration for automated posting."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take security seriously. All data is encrypted, we don't store sensitive personal information, and we follow industry best practices for data protection. Your car photos and listing data are only used to generate your listings."
    },
    {
      question: "What if I'm not satisfied?",
      answer: "We offer a 7-day free trial with full access to all features. If you're not completely satisfied, you can cancel anytime with no questions asked. We're confident you'll love the results!"
    },
    {
      question: "Do you offer support?",
      answer: "Yes! All plans include email support. Growth and Dealer Pro plans include priority support with faster response times. We're here to help you succeed with your car flipping business."
    },
    {
      question: "Can I use Global Empowerment Platform for multiple businesses?",
      answer: "Yes! You can manage multiple business profiles and track growth across all of them. Build your digital presence for any business venture you're working on."
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for a free trial, upload photos of your car, and let our AI do the work! You'll have a professional listing ready in minutes. No technical skills required."
    }
  ];

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img 
              src="/GEP LOGO.png" 
              alt="Global Empowerment Platform" 
              className="h-[175px] w-auto"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/how-it-works" className="text-white/80 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="/demo" className="text-white/80 hover:text-white transition-colors">
              Demo
            </Link>
            <Link href="/pricing" className="text-white/80 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/qa" className="text-white font-medium">
              Q&A
            </Link>
            
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/beta-signup" 
                className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition-colors"
              >
                Get Early Access
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Q&A Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Frequently Asked Questions</span>
          </h1>
          <p className="text-xl text-slate-800">
            Everything you need to know about Global Empowerment Platform and building your digital influence
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
              >
                <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                <svg 
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    openQuestion === index ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openQuestion === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-amber-600 mb-6 font-medium">
            Choose a plan for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/pricing" 
              className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              View Pricing
            </Link>
            <Link 
              href="/demo" 
              className="border border-amber-500 text-amber-500 px-6 py-3 rounded-lg font-medium hover:bg-amber-50 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-slate-600 mb-6">
            Our team is here to help you succeed with your car flipping business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors">
              Contact Support
            </button>
            <Link 
              href="/demo" 
              className="border border-amber-500 text-amber-500 px-6 py-3 rounded-lg font-medium hover:bg-amber-50 transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
