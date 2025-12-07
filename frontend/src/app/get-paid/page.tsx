'use client';

import React from "react";
import Link from 'next/link';

export default function GetPaidPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-50 text-slate-100">
      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img 
              src="/AccorriaYwLOGO.png" 
              alt="Accorria" 
              className="h-[175px] w-auto"
            />
          </div>
          <div className="hidden gap-6 text-sm text-slate-200/80 md:flex">
            <Link href="/" className="hover:text-white">Home</Link>
            <a href="/#how" className="hover:text-white">How it works</a>
            <Link href="/demo" className="hover:text-white">Demo</Link>
            <Link href="/get-paid" className="hover:text-white text-amber-300">Get Paid</Link>
            <Link href="/qa" className="hover:text-white">Q&A</Link>
          </div>
          <Link href="/beta-signup" className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300">Get early access</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.08),rgba(2,6,23,0.2)_60%,rgba(2,6,23,1)_100%)]" />

        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 mb-6">
              💰 Coming Soon
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl mb-6">
              A New Way to <span className="text-amber-300">Get Paid</span>
            </h1>
                    <p className="text-xl text-white max-w-3xl mx-auto mb-8">
          <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-semibold">Skip the bank delays. Skip the scams.</span> <span className="text-white">Get paid instantly when deals close — cars, homes, rentals. Blockchain-powered settlements in 23 hours.</span>
        </p>
            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <Link href="/beta-signup" className="rounded-lg bg-amber-400 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-300">Join Beta Waitlist</Link>
              <Link href="/demo" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white/90 hover:bg-white/5">Watch Demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How Blockchain Payments Work</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Funds Locked</h3>
              <p className="text-slate-600">Buyer deposits payment into a smart contract. Funds are locked until both parties approve the deal completion.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Deal Closes</h3>
              <p className="text-slate-600">Both buyer and seller confirm the transaction is complete. Smart contract verifies all conditions are met.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Instant Payment</h3>
              <p className="text-slate-600">Payment is automatically released to seller within 23 hours. No bank delays, no check clearing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Why This Changes Everything</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">23-Hour Settlements</h3>
              <p className="text-slate-600">vs weeks for traditional bank transfers</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Zero Scams</h3>
              <p className="text-slate-600">Blockchain verification prevents fraud</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💸</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No Fees</h3>
              <p className="text-slate-600">Lower costs than traditional escrow</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Global Access</h3>
              <p className="text-slate-600">Works anywhere, any currency</p>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Perfect For</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">Car Sales</h3>
              <p className="text-slate-600 mb-4">Sell cars faster with instant payment. No more waiting for bank transfers or dealing with fake checks.</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Instant payment verification</li>
                <li>• No more bounced checks</li>
                <li>• Faster deal completion</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">Home Sales</h3>
              <p className="text-slate-600 mb-4">Close real estate deals with confidence. Smart contracts ensure all conditions are met before payment.</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Conditional payments</li>
                <li>• Inspection contingencies</li>
                <li>• Title verification</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">High-Value Items</h3>
              <p className="text-slate-600 mb-4">Electronics, jewelry, collectibles. Get paid instantly when the buyer confirms receipt.</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Delivery confirmation</li>
                <li>• Quality verification</li>
                <li>• Dispute resolution</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Paid Faster?</h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Join our beta waitlist and be among the first to experience instant, secure payments.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Link href="/beta-signup" className="rounded-lg bg-white px-6 py-3 font-semibold text-amber-600 hover:bg-amber-50">
              Join Beta Waitlist
            </Link>
            <Link href="/" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

              <footer className="bg-slate-900 py-10 text-center text-sm text-slate-200">
        © {new Date().getFullYear()} Accorria. All rights reserved.
      </footer>
    </div>
  );
}
