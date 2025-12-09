'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { EmailVerification } from '@/components/EmailVerification';
import Header from '@/components/Header';
import { onboardingService } from '@/services/onboardingService';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, Users, CheckCircle2, Target, Sparkles, Clock, ArrowRight, FileText, Bot, Zap } from 'lucide-react';

interface FundingScore {
  score: number;
  status: 'building' | 'growing' | 'vc_ready';
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

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  is_completed: boolean;
}

interface Post {
  id: string;
  content: string;
  member: {
    business_name: string;
    profile_image_url?: string;
  };
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [fundingScore, setFundingScore] = useState<FundingScore | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Mock network pulse stats
  const networkStats = [
    { label: 'Active Founders Today', value: '1,283', icon: Users, bgColor: 'bg-blue-50', hoverBg: 'hover:bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Posts in Last 24h', value: '3,917', icon: FileText, bgColor: 'bg-green-50', hoverBg: 'hover:bg-green-100', iconColor: 'text-green-600' },
    { label: 'Tasks Completed', value: '8,647', icon: CheckCircle2, bgColor: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', iconColor: 'text-purple-600' },
    { label: 'VC-Ready Founders', value: '142', icon: Target, bgColor: 'bg-amber-50', hoverBg: 'hover:bg-amber-100', iconColor: 'text-amber-600' },
  ];

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (loading) return;
      
      if (!user) {
        router.push('/login');
        setCheckingOnboarding(false);
        return;
      }

      try {
        const isComplete = await onboardingService.getOnboardingStatus(user.id);
        if (!isComplete) {
          router.push('/onboarding');
          setCheckingOnboarding(false);
          return;
        }
        setCheckingOnboarding(false);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        router.push('/onboarding');
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user, loading, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && !checkingOnboarding) {
      fetchDashboardData();
    }
  }, [user, checkingOnboarding]);

  const fetchDashboardData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch funding score
      try {
        const scoreRes = await fetch(`${apiUrl}/api/v1/growth/funding-score`, {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (scoreRes.ok) {
          const scoreData = await scoreRes.json();
          setFundingScore(scoreData);
        }
      } catch (e: any) {
        // Silently handle network errors
        if (!e.name?.includes('Abort') && !e.message?.includes('Failed to fetch')) {
          console.error('Error fetching funding score:', e);
        }
      }

      // Fetch tasks
      try {
        const tasksRes = await fetch(`${apiUrl}/api/v1/growth/tasks`, {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.slice(0, 5)); // Show top 5
        }
      } catch (e: any) {
        // Silently handle network errors
        if (!e.name?.includes('Abort') && !e.message?.includes('Failed to fetch')) {
          console.error('Error fetching tasks:', e);
        }
      }

      // Fetch community feed
      try {
        const feedRes = await fetch(`${apiUrl}/api/v1/community/feed?limit=5`, {
          signal: AbortSignal.timeout(5000),
        });
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          setCommunityPosts(feedData);
        }
      } catch (e: any) {
        // Silently handle network errors
        if (!e.name?.includes('Abort') && !e.message?.includes('Failed to fetch')) {
          console.error('Error fetching feed:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/growth/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vc_ready':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'growing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'vc_ready':
        return 'VC-Ready';
      case 'growing':
        return 'Growing';
      default:
        return 'Building';
    }
  };

  // Show loading state
  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show email verification if user is not verified
  if (user && !isEmailVerified) {
    return <EmailVerification email={user.email || ''} />;
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <div className="space-y-3">
            <Link 
              href="/login" 
              className="inline-block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="inline-block w-full border border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* GEM Network Pulse */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">GEM Network Pulse</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {networkStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${stat.bgColor} dark:bg-gray-700 ${stat.hoverBg} dark:hover:bg-gray-600 transition-colors`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor} dark:text-gray-300`} />
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Founder Command Center */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Your Founder Command Center</h2>
                </div>

                {/* Funding Readiness Score */}
                {loadingData ? (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  </div>
                ) : fundingScore ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-white dark:from-gray-800 to-blue-50/30 dark:to-blue-900/20 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Funding Readiness Score</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-gray-900 dark:text-white">{fundingScore.score}</span>
                          <span className="text-xl text-gray-500 dark:text-gray-400">/ 100</span>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(fundingScore.status)}`}>
                        {getStatusLabel(fundingScore.status)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fundingScore.score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                      />
                    </div>
                    <Link 
                      href="/funding-score"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group"
                    >
                      View detailed breakdown
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm">Funding score data unavailable</p>
                  </div>
                )}

                {/* Today's Tasks */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Tasks</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">✨ GEP Coach</span>
                  </div>
                  {loadingData ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            task.is_completed 
                              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60' 
                              : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          <button
                            onClick={() => !task.is_completed && completeTask(task.id)}
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              task.is_completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer'
                            }`}
                          >
                            {task.is_completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm ${task.is_completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                            )}
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                      <p>All caught up! Great work today.</p>
                    </div>
                  )}
                  <Link 
                    href="/growth"
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group"
                  >
                    View all tasks
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">GEP Persona</h4>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Clone Status</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-2 bg-purple-500 rounded-full w-3/4"></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">75%</span>
                    </div>
                    <Link href="/clone-studio" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2 inline-block">
                      Configure →
                    </Link>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Pitch Deck</h4>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Completion</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full w-1/2"></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">50%</span>
                    </div>
                    <Link href="/pitchdeck" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2 inline-block">
                      Continue →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Community Activity */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Community Activity</h2>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loadingData ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : communityPosts.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {communityPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => router.push('/feed')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {post.member.business_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{post.member.business_name || 'Founder'}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">{post.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{post.likes_count} likes</span>
                              <span>{post.comments_count} comments</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p>No recent activity</p>
                  </div>
                )}
                <Link 
                  href="/feed"
                  className="block p-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  View full feed →
                </Link>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <section>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                <Link
                  href="/pitchdeck"
                  className="block bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <FileText className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg mb-1">Generate Pitch Deck</h3>
                  <p className="text-sm text-blue-100">✨ GEP-powered pitch deck creation</p>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/funding-score"
                  className="block bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <Zap className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg mb-1">Improve Funding Score</h3>
                  <p className="text-sm text-purple-100">Get personalized recommendations</p>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/community"
                  className="block bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-lg mb-1">Explore Founders</h3>
                  <p className="text-sm text-green-100">Connect with the community</p>
                </Link>
              </motion.div>
            </div>
          </section>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
