/**
 * Learning System Hooks
 * Tracks user behavior and gets personalized AI suggestions
 * Scales to 8000+ users
 */

import { useState, useCallback } from 'react';
import { authenticatedFetchJson } from '@/utils/api';
import { getApiUrl } from '@/config/api';

export interface InteractionData {
  interaction_type: string;
  interaction_data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PersonalizedSuggestion {
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface LearningProfile {
  suggestions: PersonalizedSuggestion[];
  personalization_level: 'new_user' | 'low' | 'medium' | 'high';
  learning_score: number;
  patterns: Record<string, any>;
}

/**
 * Track a user interaction for learning
 */
export function useTrackInteraction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackInteraction = useCallback(async (data: InteractionData) => {
    try {
      setLoading(true);
      setError(null);
      await authenticatedFetchJson(
        getApiUrl('api/v1/learning/track'),
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to track interaction');
      // Don't throw - tracking failures shouldn't break the app
      console.warn('Failed to track interaction:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { trackInteraction, loading, error };
}

/**
 * Get personalized AI suggestions based on learned patterns
 */
export function usePersonalizedSuggestions() {
  const [suggestions, setSuggestions] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authenticatedFetchJson<LearningProfile>(
        getApiUrl('api/v1/learning/suggestions')
      );
      setSuggestions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, fetchSuggestions, loading, error };
}

/**
 * Save AI conversation for learning
 */
export function useSaveAIConversation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveConversation = useCallback(async (
    conversationType: string,
    userMessage: string,
    aiResponse: string,
    wasHelpful?: boolean,
    context?: Record<string, any>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await authenticatedFetchJson(
        getApiUrl('api/v1/learning/conversation'),
        {
          method: 'POST',
          body: JSON.stringify({
            conversation_type: conversationType,
            user_message: userMessage,
            ai_response: aiResponse,
            was_helpful: wasHelpful,
            context: context,
          }),
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save conversation');
      console.warn('Failed to save AI conversation:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveConversation, loading, error };
}

/**
 * Auto-track common interactions
 */
export function useAutoTracking() {
  const { trackInteraction } = useTrackInteraction();

  const trackPostCreated = useCallback((postId: string, hasImage: boolean) => {
    trackInteraction({
      interaction_type: 'post_created',
      interaction_data: { post_id: postId, has_image: hasImage },
    });
  }, [trackInteraction]);

  const trackTaskCompleted = useCallback((taskId: string, taskType: string) => {
    trackInteraction({
      interaction_type: 'task_completed',
      interaction_data: { task_id: taskId, task_type: taskType },
    });
  }, [trackInteraction]);

  const trackFeedViewed = useCallback((durationSeconds: number) => {
    trackInteraction({
      interaction_type: 'feed_viewed',
      interaction_data: { duration_seconds: durationSeconds },
    });
  }, [trackInteraction]);

  const trackProfileUpdated = useCallback((fields: string[]) => {
    trackInteraction({
      interaction_type: 'profile_updated',
      interaction_data: { fields_updated: fields },
    });
  }, [trackInteraction]);

  return {
    trackPostCreated,
    trackTaskCompleted,
    trackFeedViewed,
    trackProfileUpdated,
  };
}

