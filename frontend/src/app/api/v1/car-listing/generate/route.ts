import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/car-listing/generate`, {
      method: 'POST',
      body: body,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...Object.fromEntries(request.headers.entries()),
      },
    });

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
