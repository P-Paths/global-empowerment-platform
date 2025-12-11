/**
 * GEM Platform API Hooks
 * React hooks for all GEM Platform endpoints
 */
import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetchJson } from '@/utils/api';
import { getApiUrl } from '@/config/api';

// ============================================
// TYPES
// ============================================

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  business_name?: string;
  business_category?: string;
  skills: string[];
  followers_count: number;
  following_count: number;
  funding_score: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  message?: string;
  media_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    business_name?: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    business_name?: string;
  };
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface FundingScore {
  score: number;
  details: Record<string, any>;
  created_at: string;
}

export interface FundingScoreLog {
  id: string;
  user_id: string;
  score: number;
  details: Record<string, any>;
  created_at: string;
}

export interface PersonaClone {
  id: string;
  user_id: string;
  title: string;
  prompt?: string;
  created_at: string;
}

export interface PitchDeck {
  id: string;
  user_id: string;
  deck_json: Record<string, any>;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  receiver: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// ============================================
// PROFILES HOOKS
// ============================================

export function useProfile(profileId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Profile>(
          getApiUrl(`api/v1/profiles/${profileId}`)
        );
        setProfile(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  return { profile, loading, error };
}

export function useSearchProfiles(searchTerm: string) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm) {
      setProfiles([]);
      return;
    }

    const search = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Profile[]>(
          getApiUrl(`api/v1/profiles?search=${encodeURIComponent(searchTerm)}`)
        );
        setProfiles(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to search profiles');
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [searchTerm]);

  return { profiles, loading, error };
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (profileId: string, data: Partial<Profile>) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await authenticatedFetchJson<Profile>(
        getApiUrl(`api/v1/profiles/${profileId}`),
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProfile, loading, error };
}

// ============================================
// POSTS HOOKS
// ============================================

export function usePosts(limit: number = 50) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Post[]>(
          getApiUrl(`api/v1/posts?limit=${limit}`)
        );
        setPosts(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [limit]);

  return { posts, loading, error, refetch: () => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Post[]>(
          getApiUrl(`api/v1/posts?limit=${limit}`)
        );
        setPosts(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }};
}

export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(async (message?: string, mediaUrl?: string) => {
    try {
      setLoading(true);
      setError(null);
      const post = await authenticatedFetchJson<Post>(
        getApiUrl('api/v1/posts'),
        {
          method: 'POST',
          body: JSON.stringify({ message, media_url: mediaUrl }),
        }
      );
      return post;
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading, error };
}

export function useLikePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likePost = useCallback(async (postId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authenticatedFetchJson<{ liked: boolean; likes_count: number }>(
        getApiUrl(`api/v1/posts/${postId}/like`),
        {
          method: 'POST',
        }
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to like post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { likePost, loading, error };
}

// ============================================
// COMMENTS HOOKS
// ============================================

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const fetchComments = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Comment[]>(
          getApiUrl(`api/v1/posts/${postId}/comments`)
        );
        setComments(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  return { comments, loading, error };
}

export function useCreateComment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = useCallback(async (postId: string, message: string) => {
    try {
      setLoading(true);
      setError(null);
      const comment = await authenticatedFetchJson<Comment>(
        getApiUrl(`api/v1/posts/${postId}/comments`),
        {
          method: 'POST',
          body: JSON.stringify({ message }),
        }
      );
      return comment;
    } catch (err: any) {
      setError(err.message || 'Failed to create comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createComment, loading, error };
}

// ============================================
// FOLLOWERS HOOKS
// ============================================

export function useFollow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const follow = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await authenticatedFetchJson(
        getApiUrl(`api/v1/follow/${userId}`),
        { method: 'POST' }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to follow user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollow = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await authenticatedFetchJson(
        getApiUrl(`api/v1/follow/${userId}`),
        { method: 'DELETE' }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to unfollow user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { follow, unfollow, loading, error };
}

// ============================================
// MESSAGES HOOKS
// ============================================

export function useMessages(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Message[]>(
          getApiUrl(`api/v1/messages/${userId}`)
        );
        setMessages(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [userId]);

  return { messages, loading, error };
}

export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (receiverId: string, message: string) => {
    try {
      setLoading(true);
      setError(null);
      const msg = await authenticatedFetchJson<Message>(
        getApiUrl('api/v1/messages/send'),
        {
          method: 'POST',
          body: JSON.stringify({ receiver_id: receiverId, message }),
        }
      );
      return msg;
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error };
}

// ============================================
// TASKS HOOKS
// ============================================

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Task[]>(
          getApiUrl('api/v1/tasks')
        );
        setTasks(data);
        setError(null);
      } catch (err: any) {
        // Silently handle network errors - don't set error state for network failures
        if (err.isNetworkError || err.message?.includes('Failed to connect') || err.message?.includes('Failed to fetch')) {
          // Use empty array for network errors - components can use mock data
          setTasks([]);
          setError(null);
        } else {
          setError(err.message || 'Failed to fetch tasks');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, loading, error, refetch: () => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<Task[]>(
          getApiUrl('api/v1/tasks')
        );
        setTasks(data);
        setError(null);
      } catch (err: any) {
        // Silently handle network errors - don't set error state for network failures
        if (err.isNetworkError || err.message?.includes('Failed to connect') || err.message?.includes('Failed to fetch')) {
          // Use empty array for network errors - components can use mock data
          setTasks([]);
          setError(null);
        } else {
          setError(err.message || 'Failed to fetch tasks');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }};
}

export function useCreateTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (title: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      const task = await authenticatedFetchJson<Task>(
        getApiUrl('api/v1/tasks'),
        {
          method: 'POST',
          body: JSON.stringify({ title, description }),
        }
      );
      return task;
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createTask, loading, error };
}

export function useCompleteTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeTask = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);
      const task = await authenticatedFetchJson<Task>(
        getApiUrl(`api/v1/tasks/${taskId}/complete`),
        {
          method: 'POST',
        }
      );
      return task;
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { completeTask, loading, error };
}

// ============================================
// FUNDING SCORE HOOKS
// ============================================

export function useFundingScore() {
  const [score, setScore] = useState<FundingScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateScore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authenticatedFetchJson<FundingScore>(
        getApiUrl('api/v1/funding-score/calculate'),
        {
          method: 'POST',
        }
      );
      setScore(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to calculate funding score');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { score, calculateScore, loading, error };
}

export function useFundingScoreLogs() {
  const [logs, setLogs] = useState<FundingScoreLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<FundingScoreLog[]>(
          getApiUrl('api/v1/funding-score/logs')
        );
        setLogs(data);
        setError(null);
      } catch (err: any) {
        // Silently handle network errors - don't set error state for network failures
        if (err.isNetworkError || err.message?.includes('Failed to connect') || err.message?.includes('Failed to fetch')) {
          // Use empty array for network errors - components can use mock data
          setLogs([]);
          setError(null);
        } else {
          setError(err.message || 'Failed to fetch funding score logs');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return { logs, loading, error };
}

// ============================================
// PERSONA CLONE HOOKS
// ============================================

export function usePersonaClones() {
  const [clones, setClones] = useState<PersonaClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authenticatedFetchJson<PersonaClone[]>(
        getApiUrl('api/v1/clone')
      );
      setClones(data);
      setError(null);
    } catch (err: any) {
      // Silently handle network errors - don't set error state for network failures
      if (err.isNetworkError || err.message?.includes('Failed to connect') || err.message?.includes('Failed to fetch')) {
        // Use empty array for network errors - components can use mock data
        setClones([]);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch persona clones');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClones();
  }, [fetchClones]);

  return { clones, loading, error, refetch: fetchClones };
}

export function useCreatePersonaClone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClone = useCallback(async (title: string, prompt?: string) => {
    try {
      setLoading(true);
      setError(null);
      const clone = await authenticatedFetchJson<PersonaClone>(
        getApiUrl('api/v1/clone'),
        {
          method: 'POST',
          body: JSON.stringify({ title, prompt }),
        }
      );
      return clone;
    } catch (err: any) {
      setError(err.message || 'Failed to create persona clone');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createClone, loading, error };
}

// ============================================
// PITCH DECK HOOKS
// ============================================

export function useCreatePitchDeck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePitchDeck = useCallback(async (deckData: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      // Send the deck data directly (not wrapped in deck_json)
      const deck = await authenticatedFetchJson<PitchDeck>(
        getApiUrl('api/v1/pitchdeck/generate'),
        {
          method: 'POST',
          body: JSON.stringify(deckData),
        }
      );
      return deck;
    } catch (err: any) {
      // Only set error for non-silent errors (silent errors are network issues handled gracefully)
      if (!err?.isSilent) {
        setError(err.message || 'Failed to generate pitch deck');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generatePitchDeck, loading, error };
}

export function usePitchDeck(deckId: string | null) {
  const [deck, setDeck] = useState<PitchDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) {
      setLoading(false);
      return;
    }

    const fetchDeck = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetchJson<PitchDeck>(
          getApiUrl(`api/v1/pitchdeck/${deckId}`)
        );
        setDeck(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pitch deck');
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [deckId]);

  return { deck, loading, error };
}

