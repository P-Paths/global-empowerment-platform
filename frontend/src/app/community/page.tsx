'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Header from '@/components/Header';

interface Post {
  id: string;
  content: string | null;
  image_urls: string[];
  video_url: string | null;
  post_type: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  member: {
    id: string;
    business_name: string | null;
    profile_image_url: string | null;
  };
}

// Mock data for community discussions
const mockCommunityPosts: Post[] = [
  {
    id: '1',
    content: 'Hey everyone! Just closed our seed round of $250K! 🎉 Looking for advice on scaling our team. Any founders who\'ve been through this - would love your insights! #fundraising #startup',
    image_urls: [],
    video_url: null,
    post_type: 'discussion',
    likes_count: 45,
    comments_count: 12,
    shares_count: 8,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    member: {
      id: '1',
      business_name: 'Sarah Chen - Founder',
      profile_image_url: null,
    },
  },
  {
    id: '2',
    content: 'We\'re exploring new markets for our SaaS product. Currently in B2B, thinking about B2C. Anyone have experience with this pivot? Would appreciate any guidance! 🙏',
    image_urls: [],
    video_url: null,
    post_type: 'discussion',
    likes_count: 28,
    comments_count: 8,
    shares_count: 3,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    member: {
      id: '2',
      business_name: 'Mike Rodriguez - Explorer',
      profile_image_url: null,
    },
  },
  {
    id: '3',
    content: 'Just invested in 3 amazing startups this quarter! 💰 Excited to see them grow. Looking for more early-stage founders building in fintech and healthcare. DM me if you\'re raising!',
    image_urls: [],
    video_url: null,
    post_type: 'discussion',
    likes_count: 89,
    comments_count: 23,
    shares_count: 15,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    member: {
      id: '3',
      business_name: 'Alexandra Park - Funder',
      profile_image_url: null,
    },
  },
  {
    id: '4',
    content: 'Raised $500K pre-seed! 🚀 This community has been incredible. Special thanks to everyone who gave feedback on our pitch deck. Now the real work begins - building!',
    image_urls: [],
    video_url: null,
    post_type: 'discussion',
    likes_count: 156,
    comments_count: 34,
    shares_count: 22,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    member: {
      id: '4',
      business_name: 'David Kim - Founder',
      profile_image_url: null,
    },
  },
  {
    id: '5',
    content: 'Exploring opportunities in the creator economy space. Anyone here building tools for content creators? Would love to connect and learn from your experience!',
    image_urls: [],
    video_url: null,
    post_type: 'discussion',
    likes_count: 42,
    comments_count: 15,
    shares_count: 7,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    member: {
      id: '5',
      business_name: 'Emma Thompson - Explorer',
      profile_image_url: null,
    },
  },
];

export default function CommunityFeedPage() {
  const { user, session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
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
          setPosts(mockCommunityPosts);
          setUsingMockData(true);
        }
      } else {
        // API error, use mock data
        setPosts(mockCommunityPosts);
        setUsingMockData(true);
      }
    } catch (err: any) {
      // Silently use mock data for network errors
      if (err.name === 'AbortError' || err.message?.includes('Failed to fetch')) {
        setPosts(mockCommunityPosts);
        setUsingMockData(true);
      } else {
        // Only log non-network errors
        console.error('Error fetching feed:', err);
        setPosts(mockCommunityPosts);
        setUsingMockData(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/community/posts/${postId}/like`,
        {
          method: 'POST',
          headers,
        }
      );
      if (response.ok) {
        fetchFeed(); // Refresh feed
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading community feed...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayPosts = posts.length > 0 ? posts : mockCommunityPosts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Feed</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Connect with founders, explorers, and funders</p>
        
        {usingMockData && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Demo Mode:</span> Showing sample community discussions. Connect to backend to see real community activity.
          </div>
        )}
        
        <div className="space-y-6">
          {displayPosts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Post Header */}
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-3">
                  {post.member.profile_image_url ? (
                    <Image
                      src={post.member.profile_image_url}
                      alt={post.member.business_name || 'Member'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {(post.member.business_name || 'M')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {post.member.business_name || 'Member'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <p className="text-gray-800 dark:text-gray-200 mb-4">{post.content}</p>
              )}

                {/* Post Images */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="mb-4">
                    {post.image_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Post image ${idx + 1}`}
                        className="rounded-lg w-full mb-2"
                      />
                    ))}
                  </div>
                )}

              {/* Post Actions */}
              <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes_count}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.comments_count}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>{post.shares_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

