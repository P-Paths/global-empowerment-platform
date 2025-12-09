'use client';

import { useState } from 'react';
import { usePersonaClones, useCreatePersonaClone, PersonaClone } from '@/hooks/useGEMPlatform';
import { Sparkles, Plus, X, Users, FileText, Settings } from 'lucide-react';
import Header from '@/components/Header';

export default function CloneStudioPage() {
  const { clones, loading, error, refetch } = usePersonaClones();
  const { createClone, loading: creating } = useCreatePersonaClone();
  const [showNewClone, setShowNewClone] = useState(false);
  const [newCloneTitle, setNewCloneTitle] = useState('');
  const [newClonePrompt, setNewClonePrompt] = useState('');

  const handleCreateClone = async () => {
    if (!newCloneTitle.trim()) return;
    try {
      await createClone(newCloneTitle, newClonePrompt || undefined);
      setNewCloneTitle('');
      setNewClonePrompt('');
      setShowNewClone(false);
      refetch();
    } catch (err) {
      console.error('Failed to create persona clone:', err);
    }
  };

  // Mock clones for demo
  const mockClones: PersonaClone[] = [
    {
      id: '1',
      title: 'Professional LinkedIn Voice',
      prompt: 'Write in a professional, confident tone suitable for LinkedIn. Use data-driven insights and actionable advice. Keep it concise and engaging.',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Casual Instagram Style',
      prompt: 'Friendly, approachable tone perfect for Instagram. Use emojis sparingly, keep it authentic and relatable. Focus on storytelling.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Energetic TikTok Persona',
      prompt: 'High-energy, fun, and engaging. Perfect for short-form video content. Use trending language and keep it entertaining.',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const displayClones = clones.length > 0 ? clones : mockClones;
  const usingMockData = clones.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading persona clones...</p>
        </div>
      </div>
    );
  }

  // Don't show error screen for network errors - use mock data instead
  // Only show error screen for actual API errors (not network failures)
  if (error && !error.includes('Failed to connect') && !error.includes('Failed to fetch')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">GEP Persona Studio</h1>
            <p className="text-gray-600 dark:text-gray-400">Create personas that match your brand voice</p>
          </div>
          <button
            onClick={() => setShowNewClone(!showNewClone)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Clone
          </button>
        </div>

        {usingMockData && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Demo Mode:</span> Showing sample personas. Connect to backend to create and manage your own.
          </div>
        )}

        {/* New Clone Form */}
        {showNewClone && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Persona Clone</h2>
              <button
                onClick={() => {
                  setShowNewClone(false);
                  setNewCloneTitle('');
                  setNewClonePrompt('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newCloneTitle}
                onChange={(e) => setNewCloneTitle(e.target.value)}
                placeholder="Clone name (e.g., 'Professional LinkedIn Voice')"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={newClonePrompt}
                onChange={(e) => setNewClonePrompt(e.target.value)}
                placeholder="Persona description/prompt (e.g., 'Write in a professional, confident tone suitable for LinkedIn. Use data-driven insights and actionable advice.')"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={5}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateClone}
                  disabled={creating || !newCloneTitle.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Clone'}
                </button>
                <button
                  onClick={() => {
                    setShowNewClone(false);
                    setNewCloneTitle('');
                    setNewClonePrompt('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clones List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayClones.map((clone) => (
            <div key={clone.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(clone.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{clone.title}</h3>
              {clone.prompt && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{clone.prompt}</p>
              )}
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  Use Clone
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
