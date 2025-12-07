import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';

// Log the backend URL for debugging
console.log('🔧 Enhanced Analyze API Route - Backend URL:', BACKEND_URL);

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    
    // Forward the request to the backend with minimal headers
    const response = await fetch(`${BACKEND_URL}/api/v1/enhanced-analyze`, {
      method: 'POST',
      body: body,
      // Don't forward headers - let the browser set Content-Type for FormData
    });

    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error details:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to forward request to backend' },
      { status: 500 }
    );
  }
}
// Force redeploy - Sun Aug 31 13:08:10 EDT 2025
