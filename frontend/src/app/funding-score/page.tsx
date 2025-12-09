'use client';

import { useState } from 'react';
import { useFundingScore, useFundingScoreLogs, FundingScoreLog } from '@/hooks/useGEMPlatform';
import { TrendingUp, Calculator, Clock } from 'lucide-react';

export default function FundingScorePage() {
  const { score, calculateScore, loading: calculating } = useFundingScore();
  const { logs, loading: loadingLogs } = useFundingScoreLogs();
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleCalculate = async () => {
    try {
      await calculateScore();
      setHasCalculated(true);
    } catch (err) {
      console.error('Failed to calculate funding score:', err);
    }
  };

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Funding Readiness Score</h1>

        {/* Current Score */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your Funding Score</h2>
              <p className="text-gray-600">Measure your readiness for investment</p>
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

          {score && (
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(score.score)}`}>
                {score.score}
              </div>
              <p className="text-xl text-gray-600 mb-4">{getScoreLabel(score.score)}</p>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                <div
                  className={`h-4 rounded-full transition-all ${
                    score.score >= 70 ? 'bg-green-600' : score.score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${score.score}%` }}
                ></div>
              </div>

              {/* Score Breakdown */}
              {score.details && Object.keys(score.details).length > 0 && (
                <div className="mt-8 text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Score Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(score.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-gray-900">{value as number}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!score && !hasCalculated && (
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click "Calculate Score" to see your funding readiness</p>
            </div>
          )}
        </div>

        {/* Score History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Score History
          </h2>
          {loadingLogs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No score history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      Score: <span className={getScoreColor(log.score)}>{log.score}</span>
                    </p>
                    <p className="text-sm text-gray-500">
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
  );
}
