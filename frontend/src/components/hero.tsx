'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StatCard from './ui/StatCard';
import FeedTicker from './ui/FeedTicker';

const sampleStats = [
  {
    title: 'Funding Score',
    value: '58 → 61 ↑ this week',
    icon: '📊',
    delay: 0.2,
  },
  {
    title: 'Followers Growth',
    value: '+212 new followers this week',
    icon: '👥',
    delay: 0.4,
  },
  {
    title: 'Next Task',
    value: 'Post a Reel before 6 PM',
    icon: '✅',
    delay: 0.6,
  },
];

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-gep-navy via-gep-navy to-gep-navy/80 py-12 sm:py-16 lg:py-20 xl:py-32 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gep-navy via-transparent to-gep-navy/50"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Headline and CTAs */}
          <div className="z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight mb-4 sm:mb-6">
                Build Your Influence.
                <br />
                Become <span className="text-gep-gold">Fundable</span>.
              </h1>
              
              <p className="text-base sm:text-lg text-gray-200 mb-6 sm:mb-8 max-w-lg">
                Join 8,000+ members building their digital presence and preparing for capital investment.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center min-h-[44px] rounded-md bg-gep-gold px-6 py-3 text-sm sm:text-base font-semibold text-gep-navy shadow-lg hover:bg-gep-gold/90 transition-all duration-200 active:scale-95 touch-manipulation"
                >
                  Join the Platform
                </Link>
              </div>
              
              {/* Community Feed Ticker */}
              <div className="overflow-hidden">
                <FeedTicker />
              </div>
            </motion.div>
          </div>
          
          {/* Right: Floating Cards */}
          <div className="relative hidden lg:block">
            <div className="relative h-[400px] xl:h-[500px]">
              {sampleStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stat.delay, duration: 0.5 }}
                  className="absolute"
                  style={{
                    left: index === 0 ? '10%' : index === 1 ? '50%' : '20%',
                    top: index === 0 ? '10%' : index === 1 ? '40%' : '70%',
                    width: '260px',
                    maxWidth: '90%',
                  }}
                >
                  <StatCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    delay={stat.delay}
                  />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Mobile: Stack cards below */}
          <div className="lg:hidden space-y-3 sm:space-y-4 mt-6 sm:mt-8">
            {sampleStats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                delay={stat.delay}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

