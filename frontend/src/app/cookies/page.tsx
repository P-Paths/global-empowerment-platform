import React from 'react';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-50">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/GEP LOGO.png" alt="Global Empowerment Platform" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">Global Empowerment Platform</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-slate-300 hover:text-white transition-colors">Home</Link>
              <Link href="/how-it-works" className="text-slate-300 hover:text-white transition-colors">How it Works</Link>
              <Link href="/beta-signup" className="text-slate-300 hover:text-white transition-colors">Get Early Access</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Cookie Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-slate-700 mb-8">
              Global Empowerment Platform uses cookies to improve your experience.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">What Are Cookies?</h2>
            <p className="text-slate-700 mb-8">
              Cookies are small text files stored on your device when you visit our site.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Why We Use Them</h2>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>To remember your preferences</li>
              <li>To analyze website traffic (Google Analytics or similar)</li>
              <li>To improve product performance</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Managing Cookies</h2>
            <p className="text-slate-700 mb-8">
              You can disable cookies in your browser at any time. Some features may not work properly if cookies are disabled.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Contact</h2>
            <p className="text-slate-700 mb-8">
              <a href="mailto:cookies@globalempowerment.app" className="text-amber-600 hover:text-amber-700">cookies@globalempowerment.app</a>
            </p>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
