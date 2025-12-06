'use client';

import React, { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Test basic connection
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(`Supabase Error: ${error.message}`);
          setStatus('Failed');
        } else {
          setStatus('Connected!');
        }
      } catch (err: any) {
        setError(`Connection Error: ${err.message}`);
        setStatus('Failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-2">Supabase Connection Test</h3>
      <p className="text-sm mb-2">Status: <span className={status === 'Connected!' ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
      {error && (
        <p className="text-sm text-red-600">Error: {error}</p>
      )}
      <div className="text-xs text-gray-500 mt-2">
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      </div>
    </div>
  );
};
