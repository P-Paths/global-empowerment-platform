'use client';

import { useEffect, useState } from 'react';
import { getBackendUrl, API_ENDPOINTS } from '@/config/api';

export default function TestApiPage() {
  const [config, setConfig] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<string>('Testing...');

  useEffect(() => {
    // Test the configuration
    const backendUrl = getBackendUrl();
    setConfig({
      backendUrl,
      endpoints: API_ENDPOINTS,
      hostname: window.location.hostname,
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    });

    // Test health endpoint
    fetch(API_ENDPOINTS.HEALTH)
      .then(response => {
        if (response.ok) {
          setHealthStatus('✅ Backend is healthy');
        } else {
          setHealthStatus(`❌ Backend health check failed: ${response.status}`);
        }
      })
      .catch(error => {
        setHealthStatus(`❌ Backend connection failed: ${error.message}`);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Configuration Test</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <pre className="bg-white p-4 rounded border overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Health Check</h2>
        <p className="text-lg">{healthStatus}</p>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2">
          <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
