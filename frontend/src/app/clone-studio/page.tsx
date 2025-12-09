'use client';

import { useState } from 'react';
import { usePersonaClones, useCreatePersonaClone, PersonaClone } from '@/hooks/useGEMPlatform';
import { Sparkles, Plus, X } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading persona clones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Persona Clone Studio</h1>
            <p className="text-gray-600">Create AI personas that match your brand voice</p>
          </div>
          <button
            onClick={() => setShowNewClone(!showNewClone)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Clone
          </button>
        </div>

        {/* New Clone Form */}
        {showNewClone && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Persona Clone</h2>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={newClonePrompt}
                onChange={(e) => setNewClonePrompt(e.target.value)}
                placeholder="Persona description/prompt (e.g., 'Write in a professional, confident tone suitable for LinkedIn. Use data-driven insights and actionable advice.')"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
        {clones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Persona Clones Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first persona clone to start generating content that matches your brand voice
            </p>
            <button
              onClick={() => setShowNewClone(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Your First Clone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clones.map((clone) => (
              <div key={clone.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                  <span className="text-xs text-gray-500">
                    {new Date(clone.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{clone.title}</h3>
                {clone.prompt && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{clone.prompt}</p>
                )}
                <button className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                  Use Clone
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
