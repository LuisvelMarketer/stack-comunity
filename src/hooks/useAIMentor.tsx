import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AISuggestion {
  id: string;
  suggestion_type: 'blocked' | 'encouragement' | 'tip' | 'milestone' | 'streak' | 'challenge';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
  course_id?: string;
  module_id?: string;
  action_type?: string;
  action_data?: Record<string, any>;
}

interface ProgressAnalysis {
  completedModules: number;
  totalModules: number;
  daysSinceLastActivity: number;
  isBlocked: boolean;
  streakAtRisk?: boolean;
  currentStreak?: number;
  activeChallenges?: number;
  suggestionContext?: string;
}

export const useAIMentor = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mentor', {
        body: { action: 'get_suggestions', user_id: user.id }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const analyzeProgress = useCallback(async (courseId?: string, moduleId?: string) => {
    if (!user) return null;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-mentor', {
        body: { 
          action: 'analyze_progress', 
          user_id: user.id,
          course_id: courseId,
          module_id: moduleId
        }
      });

      if (error) {
        // Handle rate limit errors
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast.error('Demasiadas solicitudes. Intenta de nuevo en unos segundos.');
          return null;
        }
        throw error;
      }
      
      if (data.suggestion) {
        // Add action metadata if present
        const enrichedSuggestion = {
          ...data.suggestion,
          action_type: data.suggestion.action_type,
          action_data: data.suggestion.action_data
        };
        setSuggestions(prev => [enrichedSuggestion, ...prev.filter(s => s.id !== enrichedSuggestion.id).slice(0, 4)]);
      }
      
      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      return data;
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('ai-mentor', {
        body: { action: 'dismiss_suggestion', user_id: user.id, suggestion_id: suggestionId }
      });

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  }, [user]);

  const logActivity = useCallback(async (
    activityType: string, 
    courseId?: string, 
    moduleId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('ai-mentor', {
        body: { 
          action: 'log_activity', 
          user_id: user.id,
          activity_type: activityType,
          course_id: courseId,
          module_id: moduleId,
          metadata
        }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Auto-analyze on mount if user has been inactive
  useEffect(() => {
    if (user && suggestions.length === 0) {
      const timer = setTimeout(() => {
        analyzeProgress();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, suggestions.length, analyzeProgress]);

  return {
    suggestions,
    loading,
    analyzing,
    analysis,
    fetchSuggestions,
    analyzeProgress,
    dismissSuggestion,
    logActivity,
    unreadCount: suggestions.filter(s => !s.is_read).length
  };
};
