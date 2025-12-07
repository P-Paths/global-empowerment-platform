import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-slate-700 mb-8">
              Accorria respects your privacy and is committed to protecting your personal information.  
              This Privacy Policy explains how we collect, use, and safeguard data.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Information We Collect</h2>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>Information you provide when creating an account (name, email, etc.)</li>
              <li>Data related to listings you create (photos, descriptions, prices)</li>
              <li>Usage data from our website and app (cookies, analytics)</li>
              <li>Facebook account information when you connect your Facebook account (with your permission)</li>
              <li>Facebook page data and access tokens (encrypted and stored securely)</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How We Use Your Data</h2>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>To provide and improve our services</li>
              <li>To enable escrow, payments, and identity verification</li>
              <li>To send important updates and customer support messages</li>
              <li>To post your listings to your connected Facebook pages (with your permission)</li>
              <li>To help you manage your Facebook Marketplace listings</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Sharing</h2>
            <p className="text-slate-700 mb-8">
              We do not sell your data. We only share information with trusted partners (escrow/payment providers, analytics) as necessary to deliver the service. When you connect your Facebook account, we only share your listing content with Facebook to post on your behalf - we never share your personal Facebook data with third parties.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Facebook Data Handling</h2>
            <p className="text-slate-700 mb-8">
              When you connect your Facebook account to Accorria:
            </p>
            <ul className="list-disc list-inside text-slate-700 mb-8 space-y-2">
              <li>We store your Facebook access tokens encrypted in our secure database</li>
              <li>We only use your Facebook data to post listings to your own Facebook pages</li>
              <li>We never post to Accorria's Facebook page - all posts appear on your pages</li>
              <li>You can disconnect your Facebook account at any time</li>
              <li>When you disconnect, we immediately delete your Facebook tokens</li>
              <li>We never share your Facebook data with third parties</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Cookies</h2>
            <p className="text-slate-700 mb-8">
              We use cookies to analyze traffic and improve the user experience. You can disable cookies in your browser.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Contact</h2>
            <p className="text-slate-700 mb-8">
              For privacy questions, email us at <a href="mailto:privacy@accorria.com" className="text-amber-600 hover:text-amber-700">privacy@accorria.com</a>
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
