'use client';

import { useState } from 'react';
import { useCreatePitchDeck, PitchDeck } from '@/hooks/useGEMPlatform';
import { FileText, Sparkles, Download } from 'lucide-react';

export default function PitchDeckPage() {
  const { generatePitchDeck, loading: generating } = useCreatePitchDeck();
  const [deck, setDeck] = useState<PitchDeck | null>(null);
  const [deckData, setDeckData] = useState({
    companyName: '',
    tagline: '',
    problem: '',
    solution: '',
    marketSize: '',
    businessModel: '',
    traction: '',
    team: '',
    ask: '',
  });

  const handleGenerate = async () => {
    try {
      const generated = await generatePitchDeck(deckData);
      setDeck(generated);
    } catch (err) {
      console.error('Failed to generate pitch deck:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pitch Deck Generator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Deck Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={deckData.companyName}
                  onChange={(e) => setDeckData({ ...deckData, companyName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Company"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={deckData.tagline}
                  onChange={(e) => setDeckData({ ...deckData, tagline: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="One-line description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Problem
                </label>
                <textarea
                  value={deckData.problem}
                  onChange={(e) => setDeckData({ ...deckData, problem: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="What problem are you solving?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Solution
                </label>
                <textarea
                  value={deckData.solution}
                  onChange={(e) => setDeckData({ ...deckData, solution: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="How are you solving it?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Market Size
                </label>
                <input
                  type="text"
                  value={deckData.marketSize}
                  onChange={(e) => setDeckData({ ...deckData, marketSize: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="TAM/SAM/SOM"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Business Model
                </label>
                <textarea
                  value={deckData.businessModel}
                  onChange={(e) => setDeckData({ ...deckData, businessModel: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="How do you make money?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Traction
                </label>
                <textarea
                  value={deckData.traction}
                  onChange={(e) => setDeckData({ ...deckData, traction: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Key metrics, milestones, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Team
                </label>
                <textarea
                  value={deckData.team}
                  onChange={(e) => setDeckData({ ...deckData, team: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Key team members"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ask
                </label>
                <input
                  type="text"
                  value={deckData.ask}
                  onChange={(e) => setDeckData({ ...deckData, ask: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Funding amount and use"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {generating ? 'Generating...' : 'Generate Pitch Deck'}
              </button>
            </div>
          </div>

          {/* Generated Deck Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Deck
            </h2>
            {deck ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(deck.deck_json, null, 2)}
                  </pre>
                </div>
                <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Deck
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Fill in the form and click "Generate Pitch Deck" to create your deck</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
