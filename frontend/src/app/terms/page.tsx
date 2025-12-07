import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-50">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/AccorriaYwLOGO.png" alt="Accorria" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">Accorria</span>
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
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-slate-700 mb-8">
              Welcome to Accorria. By using our website and services, you agree to these terms.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Use of Service</h2>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>You must be at least 18 years old to use Accorria.</li>
              <li>You agree to provide accurate information when creating listings.</li>
              <li>You are responsible for the legality of the items you list.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Prohibited Activities</h2>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>Fraudulent, misleading, or illegal listings</li>
              <li>Attempts to hack, reverse engineer, or disrupt our platform</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Escrow & Payments</h2>
            <p className="text-slate-700 mb-8">
              Escrow and payment services are provided through trusted third-party partners.  
              Accorria is not a bank and does not directly hold funds.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Liability</h2>
            <p className="text-slate-700 mb-8">
              Accorria provides services "as is" and is not liable for damages resulting from misuse of the platform.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Changes to Terms</h2>
            <p className="text-slate-700 mb-8">
              We may update these terms from time to time. Continued use of our services means you accept the changes.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4" id="data-deletion">Data Deletion</h2>
            <p className="text-slate-700 mb-4">
              You have the right to request deletion of your personal data from Accorria. To request data deletion:
            </p>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>Email us at <a href="mailto:privacy@accorria.com" className="text-amber-600 hover:text-amber-700">privacy@accorria.com</a></li>
              <li>Include "Data Deletion Request" in the subject line</li>
              <li>Provide your account email address for verification</li>
              <li>We will process your request within 30 days</li>
            </ul>
            <p className="text-slate-700 mb-8">
              <strong>Note:</strong> Some data may be retained for legal compliance or legitimate business purposes as outlined in our Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Contact</h2>
            <p className="text-slate-700 mb-8">
              <a href="mailto:support@accorria.com" className="text-amber-600 hover:text-amber-700">support@accorria.com</a>
            </p>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 text-center text-sm text-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-amber-300">About</Link></li>
                <li><Link href="/contact" className="hover:text-amber-300">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/qa" className="hover:text-amber-300">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-amber-300">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-amber-300">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-amber-300">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8">
            <p>© {new Date().getFullYear()} Accorria. All rights reserved. | <a href="https://accorria.com" className="hover:text-amber-300">accorria.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
