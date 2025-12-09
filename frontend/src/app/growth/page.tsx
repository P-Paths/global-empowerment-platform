'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  task_type: string;
  title: string;
  description: string;
  priority: string;
  is_completed: boolean;
  due_date: string | null;
}

interface FundingScore {
  score: number;
  status: string;
  breakdown: {
    posting_frequency: number;
    brand_clarity: number;
    business_model: number;
    community_engagement: number;
    follower_growth: number;
    revenue_signals: number;
    product_catalog: number;
    pitch_deck: number;
  };
}

export default function GrowthCoachPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fundingScore, setFundingScore] = useState<FundingScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchFundingScore();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/growth/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFundingScore = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/growth/funding-score`,
        {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFundingScore(data);
      }
    } catch (error) {
      console.error('Error fetching funding score:', error);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/growth/tasks/${taskId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
          },
        }
      );
      if (response.ok) {
        fetchTasks();
        fetchFundingScore(); // Refresh score after completing task
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VC-Ready':
        return 'bg-green-100 text-green-800';
      case 'Emerging':
        return 'bg-yellow-100 text-yellow-800';
      case 'Building':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your growth coach...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Growth Coach</h1>

        {/* Funding Readiness Score */}
        {fundingScore && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Funding Readiness Score</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(fundingScore.status)}`}>
                {fundingScore.status}
              </span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-5xl font-bold text-blue-600">{fundingScore.score}</div>
                <div className="text-gray-500">/ 100</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${fundingScore.score}%` }}
                ></div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(fundingScore.breakdown).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 capitalize mb-1">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{value.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Daily Tasks</h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks available. Great job staying on track!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      {task.due_date && (
                        <p className="text-sm text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {!task.is_completed && (
                      <button
                        onClick={() => completeTask(task.id)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    {task.is_completed && (
                      <div className="ml-4 text-green-600">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
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

