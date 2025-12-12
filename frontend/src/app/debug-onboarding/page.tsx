'use client';

import React, { useState } from 'react';

export default function DebugOnboardingPage() {
  const [results, setResults] = useState<any>({});

  const runDiagnostics = async () => {
    const diagnostics: any = {};

    // 1. Check environment variables
    diagnostics.envVars = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    };

    // 2. Test backend health
    try {
      const healthResponse = await fetch('https://gem-backend-1094576259070.us-central1.run.app/health');
      diagnostics.backendHealth = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: await healthResponse.json(),
      };
    } catch (error: any) {
      diagnostics.backendHealth = {
        error: error.message,
      };
    }

    // 3. Test CORS preflight
    try {
      const corsResponse = await fetch('https://gem-backend-1094576259070.us-central1.run.app/api/v1/profiles/onboarding', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
        },
      });
      diagnostics.corsPreflight = {
        status: corsResponse.status,
        ok: corsResponse.ok,
        headers: {
          'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
        },
      };
    } catch (error: any) {
      diagnostics.corsPreflight = {
        error: error.message,
      };
    }

    // 4. Check if user is authenticated
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { session }, error } = await supabase.auth.getSession();
        diagnostics.auth = {
          hasSession: !!session,
          userId: session?.user?.id,
          accessToken: session?.access_token ? 'PRESENT' : 'MISSING',
          error: error?.message,
        };
      } else {
        diagnostics.auth = {
          error: 'Supabase env vars not set',
        };
      }
    } catch (error: any) {
      diagnostics.auth = {
        error: error.message,
      };
    }

    // 5. Test actual onboarding endpoint (if authenticated)
    if (diagnostics.auth?.hasSession && diagnostics.auth?.accessToken === 'PRESENT') {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gem-backend-1094576259070.us-central1.run.app';
        const cleanUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
        const onboardingUrl = `${cleanUrl}/api/v1/profiles/onboarding`;
        
        const testResponse = await fetch(onboardingUrl, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
          },
        });
        
        diagnostics.onboardingEndpoint = {
          url: onboardingUrl,
          status: testResponse.status,
          ok: testResponse.ok,
        };
      } catch (error: any) {
        diagnostics.onboardingEndpoint = {
          error: error.message,
        };
      }
    }

    setResults(diagnostics);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Onboarding Diagnostics</h1>
        
        <button
          onClick={runDiagnostics}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Run Diagnostics
        </button>

        {Object.keys(results).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">What to Check:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>envVars.NEXT_PUBLIC_API_URL:</strong> Should be set to backend URL (no /api/v1)</li>
            <li><strong>backendHealth.status:</strong> Should be 200</li>
            <li><strong>corsPreflight.status:</strong> Should be 200</li>
            <li><strong>auth.hasSession:</strong> Should be true if logged in</li>
            <li><strong>auth.accessToken:</strong> Should be "PRESENT" if logged in</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

