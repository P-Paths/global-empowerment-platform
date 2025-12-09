'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Heart, MessageCircle, Send, Image as ImageIcon, Users, CheckCircle2, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  image_urls?: string[];
}

// Mock data for social media network feeds
const mockPosts: Post[] = [
  {
    id: '1',
    content: 'Just posted our latest product update on Instagram! 📸 Check out the new features we\'ve been working on. Link in bio! #productlaunch #startup',
    member: {
      business_name: 'Instagram',
      profile_image_url: undefined,
    },
    likes_count: 234,
    comments_count: 45,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    content: 'New TikTok video is live! 🎵 Showing behind-the-scenes of our team building. The response has been amazing - 50K views in 2 hours! #behindthescenes #startuplife',
    member: {
      business_name: 'TikTok',
      profile_image_url: undefined,
    },
    likes_count: 8900,
    comments_count: 234,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    content: 'Facebook post about our fundraising journey got 500+ shares! 📘 Thank you to everyone who\'s been supporting us. We\'re building something special here.',
    member: {
      business_name: 'Facebook',
      profile_image_url: undefined,
    },
    likes_count: 567,
    comments_count: 89,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    content: 'YouTube video just hit 10K subscribers! 🎉 Our "How to Build a Startup" series is resonating with entrepreneurs. Next episode drops Friday!',
    member: {
      business_name: 'YouTube',
      profile_image_url: undefined,
    },
    likes_count: 1234,
    comments_count: 156,
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    content: 'Instagram Story highlights from our team meeting today. We\'re planning something big for Q2! Stay tuned 👀',
    member: {
      business_name: 'Instagram',
      profile_image_url: undefined,
    },
    likes_count: 189,
    comments_count: 23,
    created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock social media scores
const mockSocialScores = {
  facebook: { followers: 12500, engagement: 8.5 },
  instagram: { followers: 8900, engagement: 12.3 },
  tiktok: { followers: 15200, engagement: 15.7 },
  youtube: { followers: 3400, engagement: 6.2 },
};

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({
    facebook: false,
    instagram: false,
    tiktok: false,
    youtube: false,
  });

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/community/feed?limit=20`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setPosts(data);
          setUsingMockData(false);
        } else {
          // No posts, use mock data
          setPosts(mockPosts);
          setUsingMockData(true);
        }
      } else {
        // API error, use mock data
        setPosts(mockPosts);
        setUsingMockData(true);
      }
    } catch (err: any) {
      // Silently use mock data for network errors
      if (err.name === 'AbortError' || err.message?.includes('Failed to fetch')) {
        setPosts(mockPosts);
        setUsingMockData(true);
        setError(null);
      } else {
        // Only log non-network errors
        console.error('Error fetching feed:', err);
        setPosts(mockPosts);
        setUsingMockData(true);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likes_count: post.likes_count + 1 }
          : post
      )
    );

    // Try to like via API (silently fail if offline)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/v1/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });
      // Refresh feed on success
      fetchFeed();
    } catch (err: any) {
      // Silently fail for network errors, keep optimistic update
      if (!err.name?.includes('Abort') && !err.message?.includes('Failed to fetch')) {
        console.error('Failed to like post:', err);
      }
    }
  };

  const handleComment = async (postId: string) => {
    const message = newComment[postId];
    if (!message?.trim()) return;

    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      )
    );

    setNewComment({ ...newComment, [postId]: '' });

    // Try to comment via API (silently fail if offline)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: message }),
      });
      fetchFeed();
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostMessage.trim()) return;
    
    // Optimistic update
    const tempPost: Post = {
      id: `temp-${Date.now()}`,
      content: newPostMessage,
      member: {
        business_name: 'You',
      },
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
    };
    setPosts([tempPost, ...posts]);
    setNewPostMessage('');

    // Try to create via API (silently fail if offline)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/v1/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newPostMessage }),
      });
      fetchFeed();
    } catch (err) {
      console.error('Failed to create post:', err);
      // Remove temp post on error
      setPosts(prevPosts => prevPosts.filter(p => p.id !== tempPost.id));
    }
  };

  const handleConnectPlatform = async (platform: string) => {
    // TODO: Implement actual OAuth connection
    setConnectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading feed...</p>
          </div>
        </div>
      </div>
    );
  }

  const platformConfigs = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      description: 'Connect your Facebook pages and Marketplace',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      description: 'Link your Instagram business account',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'from-black to-gray-800',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      description: 'Connect your TikTok creator account',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '▶️',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      description: 'Link your YouTube channel',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
            {usingMockData && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Demo Mode:</span> Showing sample social media posts. Connect your accounts to see your real network activity.
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Media Feed</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Manage all your social media accounts in one place</p>

            {/* Social Media Control Center */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Social Media Control Center</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {platformConfigs.map((platform) => {
                  const isConnected = connectedPlatforms[platform.id];
                  const platformData = mockSocialScores[platform.id as keyof typeof mockSocialScores];
                  
                  return (
                    <div
                      key={platform.id}
                      className={`${platform.bgColor} ${platform.borderColor} rounded-xl border-2 p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group`}
                      onClick={() => handleConnectPlatform(platform.id)}
                    >
                      {/* Connection Status Badge */}
                      {isConnected && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-green-500 rounded-full p-1.5">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Platform Icon */}
                      <div className="text-5xl mb-4 text-center">{platform.icon}</div>
                      
                      {/* Platform Name */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                        {platform.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 text-center">
                        {platform.description}
                      </p>
                      
                      {/* Stats (if connected) */}
                      {isConnected && platformData ? (
                        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Followers</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {platformData.followers.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Engagement</span>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {platformData.engagement}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4">
                          <button
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-colors bg-gradient-to-r ${platform.color} text-white hover:opacity-90`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnectPlatform(platform.id);
                            }}
                          >
                            {isConnected ? 'Connected' : 'Connect'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Social Media Scores Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Social Media Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mockSocialScores).map(([platform, data]) => (
                  <div key={platform} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl mb-2">
                      {platform === 'facebook' && '📘'}
                      {platform === 'instagram' && '📷'}
                      {platform === 'tiktok' && '🎵'}
                      {platform === 'youtube' && '▶️'}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize mb-1">{platform}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {data.followers.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">followers</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {data.engagement}% engagement
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Post */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Post</h2>
          <textarea
            value={newPostMessage}
            onChange={(e) => setNewPostMessage(e.target.value)}
            placeholder="Create a post for your social media networks..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-4">
            <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Add Image</span>
            </button>
            <button
              onClick={handleCreatePost}
              disabled={!newPostMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Post to Networks
            </button>
          </div>
        </div>

            {/* Posts */}
            <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {post.member.business_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {post.member.business_name || 'Founder'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">{post.content}</p>
              
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img src={post.image_urls[0]} alt="Post media" className="w-full" />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.likes_count}</span>
                </button>
                <button
                  onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.comments_count}</span>
                </button>
              </div>

              {/* Comments Section */}
              {selectedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3 mb-4">
                    {/* Mock comments */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Alex Chen</p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">Great work! Keep it up 💪</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      placeholder="Write a comment..."
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

            {posts.length === 0 && !loading && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No posts yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to share something with the community!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
