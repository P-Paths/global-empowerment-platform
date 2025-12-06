import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb' // Increase from default 1mb to 10mb
    }
  },
  // Set outputFileTracingRoot to current directory (frontend) to fix workspace detection
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },
  webpack: (config) => {
    // Explicitly resolve path aliases for webpack
    // Use process.cwd() which should be the frontend directory during build
    const srcPath = path.resolve(process.cwd(), 'src');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcPath,
    };
    return config;
  },
};

export default nextConfig;
