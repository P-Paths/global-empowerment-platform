'use client';

import { useState } from 'react';
import { usePosts, useCreatePost, useLikePost, useComments, useCreateComment, Post } from '@/hooks/useGEMPlatform';
import { Heart, MessageCircle, Send, Image as ImageIcon } from 'lucide-react';

export default function FeedPage() {
  const { posts, loading, error, refetch } = usePosts(50);
  const { createPost, loading: creating } = useCreatePost();
  const { likePost } = useLikePost();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const { comments } = useComments(selectedPost);
  const { createComment } = useCreateComment();
  const [newPostMessage, setNewPostMessage] = useState('');
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const handleCreatePost = async () => {
    if (!newPostMessage.trim()) return;
    try {
      await createPost(newPostMessage);
      setNewPostMessage('');
      refetch();
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
      refetch();
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async (postId: string) => {
    const message = newComment[postId];
    if (!message?.trim()) return;
    try {
      await createComment(postId, message);
      setNewComment({ ...newComment, [postId]: '' });
      refetch();
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feed...</p>
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
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Community Feed</h1>

        {/* Create Post */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <textarea
            value={newPostMessage}
            onChange={(e) => setNewPostMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-4">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ImageIcon className="w-5 h-5" />
              <span>Add Image</span>
            </button>
            <button
              onClick={handleCreatePost}
              disabled={creating || !newPostMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  {post.user.avatar_url ? (
                    <img src={post.user.avatar_url} alt={post.user.full_name || 'User'} className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-gray-600 font-semibold">
                      {(post.user.full_name || post.user.business_name || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {post.user.full_name || post.user.business_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.message && (
                <p className="text-gray-800 mb-4">{post.message}</p>
              )}
              {post.media_url && (
                <img src={post.media_url} alt="Post media" className="w-full rounded-lg mb-4" />
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>{post.likes_count}</span>
                </button>
                <button
                  onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments_count}</span>
                </button>
              </div>

              {/* Comments Section */}
              {selectedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          {comment.user.avatar_url ? (
                            <img src={comment.user.avatar_url} alt={comment.user.full_name || 'User'} className="w-full h-full rounded-full" />
                          ) : (
                            <span className="text-xs text-gray-600">
                              {(comment.user.full_name || comment.user.business_name || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {comment.user.full_name || comment.user.business_name || 'Anonymous'}
                          </p>
                          <p className="text-gray-700">{comment.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      placeholder="Write a comment..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
