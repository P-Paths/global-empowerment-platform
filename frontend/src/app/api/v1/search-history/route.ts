import { NextRequest } from "next/server";

// Mock search history storage (in-memory for demo)
let searchHistoryStorage: any[] = [];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Call the actual backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/v1/search-history/?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        return new Response(JSON.stringify(backendData), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        console.error('Backend search history failed:', backendResponse.status, await backendResponse.text());
        throw new Error(`Backend returned ${backendResponse.status}`);
      }
    } catch (backendError) {
      console.error('Backend search history error:', backendError);
      
      // Fallback to mock search history
      const history = searchHistoryStorage
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      
      return new Response(JSON.stringify(history), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Search history GET error:', error);
    return new Response(JSON.stringify([]), {
      status: 200, // Return empty array instead of error
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchTerm, location, radius, results, summary } = body;
    
    // Call the actual backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://accorria-backend-19949436301.us-central1.run.app';
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/v1/search-history/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm,
          location,
          radius,
          results,
          summary
        }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        return new Response(JSON.stringify(backendData), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        console.error('Backend search history POST failed:', backendResponse.status, await backendResponse.text());
        throw new Error(`Backend returned ${backendResponse.status}`);
      }
    } catch (backendError) {
      console.error('Backend search history POST error:', backendError);
      
      // Fallback to mock storage
      const historyItem = {
        id: `search_${Date.now()}`,
        searchTerm,
        location,
        radius,
        results,
        summary,
        timestamp: new Date().toISOString(),
        user_id: null
      };
      
      // Add to storage
      searchHistoryStorage.push(historyItem);
      
      // Keep only last 100 searches
      if (searchHistoryStorage.length > 100) {
        searchHistoryStorage = searchHistoryStorage.slice(-100);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Search saved to history successfully (fallback)",
        search_id: historyItem.id
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Search history POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save search history'
    }), {
      status: 200, // Return success even on error for demo
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}