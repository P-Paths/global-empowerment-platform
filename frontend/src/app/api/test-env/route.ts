import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
