'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';

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

// Mock data for when API fails
const mockTasks: Task[] = [
  {
    id: '1',
    task_type: 'post',
    title: 'Post a business update on Instagram',
    description: 'Share your progress and engage with your audience. Post should include a clear call-to-action.',
    priority: 'high',
    is_completed: false,
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    task_type: 'content',
    title: 'Create a LinkedIn article about your industry insights',
    description: 'Write a 500-word article sharing your expertise. This will boost your brand clarity score.',
    priority: 'medium',
    is_completed: false,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    task_type: 'engagement',
    title: 'Respond to 5 comments on your recent posts',
    description: 'Engagement is key to building community. Take time to respond thoughtfully.',
    priority: 'high',
    is_completed: true,
    due_date: new Date().toISOString(),
  },
  {
    id: '4',
    task_type: 'product',
    title: 'Add pricing information to your product catalog',
    description: 'Complete your product listings with pricing to improve revenue signals.',
    priority: 'medium',
    is_completed: false,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockFundingScore: FundingScore = {
  score: 68,
  status: 'growing',
  breakdown: {
    posting_frequency: 12.5,
    brand_clarity: 8.0,
    business_model: 10.0,
    community_engagement: 15.0,
    follower_growth: 10.0,
    revenue_signals: 5.0,
    product_catalog: 4.5,
    pitch_deck: 3.0,
  },
};

export default function GrowthCoachPage() {
  const { user, session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fundingScore, setFundingScore] = useState<FundingScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      // No user, use mock data
      setTasks(mockTasks);
      setFundingScore(mockFundingScore);
      setUsingMockData(true);
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch tasks
      try {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const tasksRes = await fetch(`${apiUrl}/api/v1/growth/tasks`, {
          headers,
        });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData && tasksData.length > 0) {
            setTasks(tasksData);
          } else {
            setTasks(mockTasks);
            setUsingMockData(true);
          }
        } else {
          setTasks(mockTasks);
          setUsingMockData(true);
        }
      } catch (e) {
        setTasks(mockTasks);
        setUsingMockData(true);
      }

      // Fetch funding score
      try {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const scoreRes = await fetch(`${apiUrl}/api/v1/growth/funding-score`, {
          headers,
        });
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          setFundingScore(scoreData);
        } else {
          setFundingScore(mockFundingScore);
          setUsingMockData(true);
        }
      } catch (e) {
        setFundingScore(mockFundingScore);
        setUsingMockData(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTasks(mockTasks);
      setFundingScore(mockFundingScore);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, is_completed: true } : task
      )
    );

    // Try to complete via API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${apiUrl}/api/v1/growth/tasks/${taskId}/complete`, {
        method: 'POST',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        fetchData();
      } else {
        // Revert optimistic update on API error
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, is_completed: false } : task
          )
        );
      }
    } catch (error: any) {
      // Silently handle network errors (backend might not be running)
      if (error.name === 'AbortError' || error.message?.includes('Failed to fetch')) {
        // Revert optimistic update on network error
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, is_completed: false } : task
          )
        );
        // Don't log network errors - they're expected when backend is down
        return;
      }
      // Only log non-network errors
      console.error('Error completing task:', error);
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, is_completed: false } : task
        )
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'vc_ready':
      case 'vc-ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'growing':
      case 'emerging':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'building':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'vc_ready':
        return 'VC-Ready';
      case 'growing':
        return 'Growing';
      case 'emerging':
        return 'Emerging';
      default:
        return 'Building';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your growth coach...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto py-8 px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tasks.filter(t => t.is_completed).length} / {tasks.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100) : 0}%
                  </p>
                </div>
                {fundingScore && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Funding Score</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fundingScore.score}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {usingMockData && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Demo Mode:</span> Showing sample data. Connect to backend to see your personalized tasks and score.
              </div>
            )}

        <div className="flex items-center gap-3 mb-8">
          <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Empowerment Coach</h1>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">✨ GEP Coach</span>
        </div>

            {/* Funding Readiness Score */}
            {fundingScore && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Funding Readiness Score</h2>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(fundingScore.status)}`}>
                    {getStatusLabel(fundingScore.status)}
                  </span>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">{fundingScore.score}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xl">/ 100</div>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${fundingScore.score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(fundingScore.breakdown).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{value.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Daily Tasks</h2>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks available. Great job staying on track!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 transition-all ${
                        task.is_completed
                          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                          : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-lg font-semibold ${task.is_completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {task.title}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {!task.is_completed && (
                          <button
                            onClick={() => completeTask(task.id)}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            Complete
                          </button>
                        )}
                        {task.is_completed && (
                          <div className="ml-4 text-green-600 flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
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
          </div>
        </main>
    </div>
  );
}
