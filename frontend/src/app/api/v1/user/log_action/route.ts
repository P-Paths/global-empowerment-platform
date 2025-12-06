import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/v1/user/log_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);
      return new Response(`Backend error: ${response.status}`, { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
