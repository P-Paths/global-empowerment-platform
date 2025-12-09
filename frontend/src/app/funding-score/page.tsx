'use client';

import { useState, useEffect } from 'react';
import { useFundingScore, useFundingScoreLogs, FundingScoreLog } from '@/hooks/useGEMPlatform';
import { TrendingUp, Calculator, Clock } from 'lucide-react';
import Header from '@/components/Header';

// Mock data for demonstration
const mockScore = {
  score: 72,
  details: {
    posting_frequency: 15,
    brand_clarity: 12,
    business_model: 10,
    community_engagement: 18,
    follower_growth: 8,
    revenue_signals: 5,
    product_catalog: 2,
    pitch_deck: 2,
  },
};

const mockLogs: FundingScoreLog[] = [
  {
    id: '1',
    score: 68,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    score: 70,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    score: 72,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function FundingScorePage() {
  const { score, calculateScore, loading: calculating } = useFundingScore();
  const { logs, loading: loadingLogs } = useFundingScoreLogs();
  const [hasCalculated, setHasCalculated] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const handleCalculate = async () => {
    try {
      await calculateScore();
      setHasCalculated(true);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to calculate funding score:', err);
      // Use mock data if API fails
      setUsingMockData(true);
      setHasCalculated(true);
    }
  };

  // Use mock data if no score
  useEffect(() => {
    if (!score && !hasCalculated) {
      setUsingMockData(true);
    }
  }, [score, hasCalculated]);
  
  const displayScore = score || mockScore;
  const displayLogs = logs.length > 0 ? logs : mockLogs;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'VC-Ready';
    if (score >= 40) return 'Emerging';
    return 'Building';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-4 pb-24">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Funding Readiness Score</h1>

        {usingMockData && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Demo Mode:</span> Showing sample data. Connect to backend to see your actual funding score.
          </div>
        )}

        {/* Current Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Funding Score</h2>
              <p className="text-gray-600 dark:text-gray-400">Measure your readiness for investment</p>
            </div>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Calculator className="w-5 h-5" />
              {calculating ? 'Calculating...' : 'Calculate Score'}
            </button>
          </div>

          {displayScore && (
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(displayScore.score)}`}>
                {displayScore.score}
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{getScoreLabel(displayScore.score)}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
                <div
                  className={`h-4 rounded-full transition-all ${
                    displayScore.score >= 70 ? 'bg-green-600' : displayScore.score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${displayScore.score}%` }}
                ></div>
              </div>

              {/* Score Breakdown */}
              {displayScore.details && Object.keys(displayScore.details).length > 0 && (
                <div className="mt-8 text-left">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(displayScore.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{value as number}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!displayScore && !hasCalculated && (
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Click "Calculate Score" to see your funding readiness</p>
            </div>
          )}
        </div>

        {/* Score History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Score History
          </h2>
          {loadingLogs && !usingMockData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No score history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Score: <span className={getScoreColor(log.score)}>{log.score}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${getScoreColor(log.score)}`}>
                      {getScoreLabel(log.score)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
