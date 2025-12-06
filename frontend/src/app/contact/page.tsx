import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">Contact Us</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-slate-700 mb-8">
              Get in touch with the Accorria team. We'd love to hear from you!
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">General Inquiries</h2>
                <p className="text-slate-700 mb-4">
                  <a href="mailto:hello@accorria.com" className="text-amber-600 hover:text-amber-700">hello@accorria.com</a>
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Support</h2>
                <p className="text-slate-700 mb-4">
                  <a href="mailto:support@accorria.com" className="text-amber-600 hover:text-amber-700">support@accorria.com</a>
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Business Partnerships</h2>
                <p className="text-slate-700 mb-4">
                  <a href="mailto:partnerships@accorria.com" className="text-amber-600 hover:text-amber-700">partnerships@accorria.com</a>
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Media & Press</h2>
                <p className="text-slate-700 mb-4">
                  <a href="mailto:press@accorria.com" className="text-amber-600 hover:text-amber-700">press@accorria.com</a>
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Get Early Access</h2>
              <p className="text-slate-700 mb-6">
                Ready to experience the future of asset listing? Join our early access program.
              </p>
              <Link 
                href="/beta-signup" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
              >
                Get Early Access
              </Link>
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
