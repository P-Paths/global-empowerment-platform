'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  delay?: number;
  className?: string;
}

export default function StatCard({ title, value, icon, delay = 0, className = '' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: [0, -10, 0],
      }}
      transition={{
        opacity: { delay, duration: 0.5 },
        y: {
          delay: delay + 0.5,
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      className={`bg-white/10 backdrop-blur-md border border-gep-gold/20 rounded-xl p-4 shadow-lg ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-white font-bold text-sm leading-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

