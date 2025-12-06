'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import QRCodeGenerator from '@/components/QRCodeGenerator';

interface BetaSignup {
  id: string;
  email: string;
  role: string;
  source: string;
  focus: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SignupStats {
  total_signups: number;
  pending_signups: number;
  invited_signups: number;
  active_signups: number;
  signups_today: number;
  signups_this_week: number;
  signups_this_month: number;
}

export default function BetaSignupsAdmin() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [stats, setStats] = useState<SignupStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSignups();
  }, []);

  const fetchSignups = async () => {
    try {
      const response = await fetch('/api/admin/beta-signups');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch signups');
      }

      setSignups(result.signups || []);
      setStats(result.stats);
    } catch (err) {
      console.error('Error fetching signups:', err);
      setError('Failed to load signups. Make sure the database table is set up.');
    } finally {
      setLoading(false);
    }
  };


  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('beta_signups')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh data
      await fetchSignups();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const exportCSV = () => {
    const headers = ['Email', 'Role', 'Source', 'Focus', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...signups.map(signup => [
        signup.email,
        signup.role,
        signup.source,
        signup.focus,
        signup.status,
        new Date(signup.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beta-signups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading signups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Database Setup Required</h2>
            <p className="text-yellow-700 mb-4">{error}</p>
            <div className="text-left bg-white p-4 rounded border">
              <h3 className="font-semibold mb-2">To fix this:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your Supabase dashboard</li>
                <li>Open the SQL Editor</li>
                <li>Run the SQL from <code className="bg-gray-100 px-1 rounded">BETA_SIGNUP_DATABASE_SETUP.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry After Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Beta Signups Admin</h1>
        <p className="mt-2 text-gray-600">Manage and track early access signups</p>
      </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Signups</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_signups}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending_signups}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">This Week</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.signups_this_week}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">This Month</h3>
              <p className="text-3xl font-bold text-green-600">{stats.signups_this_month}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={async () => { 
                setLoading(true);
                await fetchSignups(); 
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* QR Code Generator Section */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Beta Signup Link</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Beta Signup Page</h4>
              <QRCodeGenerator 
                url={`${window.location.origin}/beta-signup`}
                size={150}
                showDownload={true}
                showUrl={true}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">With UTM Tracking</h4>
              <QRCodeGenerator 
                url={`${window.location.origin}/beta-signup?utm_source=qr&utm_medium=admin&utm_campaign=beta`}
                size={150}
                showDownload={true}
                showUrl={true}
              />
            </div>
          </div>
        </div>

        {/* Signups Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Focus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {signup.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {signup.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {signup.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {signup.focus}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        signup.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        signup.status === 'invited' ? 'bg-blue-100 text-blue-800' :
                        signup.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {signup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={signup.status}
                        onChange={(e) => updateStatus(signup.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="invited">Invited</option>
                        <option value="active">Active</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {signups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No signups yet</p>
          </div>
        )}
    </div>
  );
}
