'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BetaSignup() {
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    source: '',
    focus: 'cars'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parse URL parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');
      const role = urlParams.get('role');
      const source = urlParams.get('source');
      const focus = urlParams.get('focus');
      const success = urlParams.get('success');
      const duplicate = urlParams.get('duplicate');
      
      // If redirected from homepage with success, show success page
      if (success === 'true') {
        setIsSubmitted(true);
        return;
      }
      
      if (email || role || source || focus) {
        setFormData(prev => ({
          ...prev,
          email: email || prev.email,
          role: role || prev.role,
          source: source || prev.source,
          focus: focus || prev.focus
        }));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log('Submitting form data:', formData);
    
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const result = await response.json();
      console.log('Response result:', result);

      if (response.ok) {
        console.log('Beta signup successful:', result);
        setIsSubmitted(true);
        
        // If it's a duplicate signup, redirect with duplicate flag
        if (result.already_exists) {
          window.location.href = '/beta-signup?success=true&duplicate=true';
          return;
        }
      } else {
        console.error('Beta signup failed:', result);
        alert(result.error || 'Failed to sign up. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Accorria!</h2>
          <p className="text-gray-600 mb-6">
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('duplicate') === 'true' 
              ? "You're already signed up! We'll notify you when early access is ready."
              : "Thanks for joining the beta. You'll get early access to the Accorria platform as soon as we're ready."
            }
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              We&apos;ll notify you when early access is ready!
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <Image 
                  src="/AccorriaYwLOGO.png" 
                  alt="Accorria" 
                  width={175}
                  height={175}
                  className="h-[175px] w-auto"
                  priority
                />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Beta Signup Form */}
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Get Early Access
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join the beta and be among the first to try the Accorria platform.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  What describes you best?
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="" className="text-gray-500">Select your role</option>
                  <option value="individual" className="text-gray-900">Individual seller</option>
                  <option value="dealer" className="text-gray-900">Dealer</option>
                  <option value="flipper" className="text-gray-900">Car flipper</option>
                  <option value="realtor" className="text-gray-900">Realtor</option>
                  <option value="investor" className="text-gray-900">Real estate investor</option>
                  <option value="other" className="text-gray-900">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  How did you find out about us?
                </label>
                <select
                  id="source"
                  name="source"
                  required
                  value={formData.source}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="" className="text-gray-500">Select an option</option>
                  <option value="social" className="text-gray-900">Social media</option>
                  <option value="search" className="text-gray-900">Google search</option>
                  <option value="friend" className="text-gray-900">Friend referral</option>
                  <option value="ad" className="text-gray-900">Online ad</option>
                  <option value="other" className="text-gray-900">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I&apos;m most interested in:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="focus"
                      value="cars"
                      checked={formData.focus === 'cars'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Cars (available now)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="focus"
                      value="homes"
                      checked={formData.focus === 'homes'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Homes (coming soon)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="focus"
                      value="blockchain"
                      checked={formData.focus === 'blockchain'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Blockchain payments (coming soon)</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Joining...' : 'Join Beta'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                We&apos;ll send you an invite link as soon as we&apos;re ready. No spam, ever.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
