import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BuildProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  repository_url: string | null;
  live_url: string | null;
  thumbnail_url: string | null;
  screenshot_url: string | null;
  status: 'idea' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  visibility: 'public' | 'community' | 'private';
  community_id: string | null;
  is_featured: boolean;
  featured_at: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  update_type: 'progress' | 'milestone' | 'challenge' | 'learning' | 'launch';
  mood: 'excited' | 'productive' | 'stuck' | 'learning' | 'celebrating' | null;
  hours_spent: number | null;
  images: string[];
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  build_projects?: BuildProject;
  comments_count?: number;
}

export interface ProjectFeedback {
  id: string;
  project_id: string;
  update_id: string | null;
  user_id: string;
  content: string;
  feedback_type: 'comment' | 'suggestion' | 'encouragement' | 'question';
  category: 'bug' | 'improvement' | 'design' | 'general';
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  parent_id: string | null;
  screenshot_url: string | null;
  screenshot_urls: string[] | null;
  video_url: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface UpdateComment {
  id: string;
  update_id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useBuildProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<BuildProject[]>([]);
  const [myProjects, setMyProjects] = useState<BuildProject[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<BuildProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('build_projects')
        .select('*')
        .eq('visibility', 'public')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (projectsError) throw projectsError;
      
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((projectsData || []).map(p => p.user_id))];
      
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      }
      
      const projectsWithProfiles = (projectsData || []).map(project => ({
        ...project,
        profiles: profilesMap.get(project.user_id) || null,
      }));
      
      setProjects(projectsWithProfiles as unknown as BuildProject[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMyProjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('build_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMyProjects((data as unknown as BuildProject[]) || []);
    } catch (error) {
      console.error('Error fetching my projects:', error);
    }
  };

  const fetchFeaturedProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('build_projects')
        .select('*')
        .eq('is_featured', true)
        .eq('visibility', 'public')
        .order('featured_at', { ascending: false })
        .limit(5);

      if (projectsError) throw projectsError;
      
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((projectsData || []).map(p => p.user_id))];
      
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      }
      
      const projectsWithProfiles = (projectsData || []).map(project => ({
        ...project,
        profiles: profilesMap.get(project.user_id) || null,
      }));
      
      setFeaturedProjects(projectsWithProfiles as unknown as BuildProject[]);
    } catch (error) {
      console.error('Error fetching featured projects:', error);
    }
  };

  const createProject = async (project: {
    title: string;
    description?: string;
    tech_stack?: string[];
    repository_url?: string;
    live_url?: string;
    visibility?: 'public' | 'community' | 'private';
    community_id?: string;
  }) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('build_projects')
        .insert({
          user_id: user.id,
          title: project.title,
          description: project.description || null,
          tech_stack: project.tech_stack || [],
          repository_url: project.repository_url || null,
          live_url: project.live_url || null,
          visibility: project.visibility || 'public',
          community_id: project.community_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('¡Proyecto creado exitosamente!');
      fetchMyProjects();
      fetchProjects();
      return data as unknown as BuildProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
      return null;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<BuildProject>) => {
    try {
      const { error } = await supabase
        .from('build_projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Proyecto actualizado');
      fetchMyProjects();
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error al actualizar');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('build_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Proyecto eliminado');
      fetchMyProjects();
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar');
    }
  };

  const toggleLike = async (projectId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('project_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('project_likes')
          .insert({ project_id: projectId, user_id: user.id });
      }

      fetchProjects();
      fetchFeaturedProjects();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const checkIfLiked = async (projectId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProjects(),
        fetchMyProjects(),
        fetchFeaturedProjects(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    projects,
    myProjects,
    featuredProjects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    toggleLike,
    checkIfLiked,
    refreshProjects: fetchProjects,
  };
}

export function useProjectUpdates(projectId: string) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('project_updates')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates((data as unknown as ProjectUpdate[]) || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUpdate = async (update: {
    title: string;
    content: string;
    update_type: ProjectUpdate['update_type'];
    mood?: ProjectUpdate['mood'];
    hours_spent?: number;
  }) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('project_updates')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: update.title,
          content: update.content,
          update_type: update.update_type,
          mood: update.mood || null,
          hours_spent: update.hours_spent || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('¡Actualización publicada!');
      fetchUpdates();
      return data as unknown as ProjectUpdate;
    } catch (error) {
      console.error('Error creating update:', error);
      toast.error('Error al publicar');
      return null;
    }
  };

  useEffect(() => {
    fetchUpdates();

    // Real-time subscription
    const channel = supabase
      .channel(`project-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_updates',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    updates,
    loading,
    createUpdate,
    refreshUpdates: fetchUpdates,
  };
}

export function useProjectFeedback(projectId: string) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<ProjectFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      // Only fetch parent feedback (not replies)
      const { data, error } = await supabase
        .from('project_feedback')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFeedback((data as unknown as ProjectFeedback[]) || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (parentId: string): Promise<ProjectFeedback[]> => {
    try {
      const { data, error } = await supabase
        .from('project_feedback')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url)
        `)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as ProjectFeedback[]) || [];
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  };

  const addFeedback = async (data: { 
    content: string; 
    category?: string;
    priority?: string;
    screenshot_urls?: string[];
    video_url?: string;
    feedbackType?: ProjectFeedback['feedback_type'];
    updateId?: string;
    parentId?: string;
  }) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data: result, error } = await supabase
        .from('project_feedback')
        .insert({
          project_id: projectId,
          update_id: data.updateId || null,
          user_id: user.id,
          content: data.content,
          feedback_type: data.feedbackType || 'comment',
          category: data.category || 'general',
          priority: data.priority || 'medium',
          status: 'open',
          screenshot_urls: data.screenshot_urls || [],
          video_url: data.video_url || null,
          parent_id: data.parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(data.parentId ? '¡Respuesta enviada!' : '¡Feedback enviado!');
      fetchFeedback();
      return result as unknown as ProjectFeedback;
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast.error('Error al enviar');
      return null;
    }
  };

  useEffect(() => {
    fetchFeedback();

    // Real-time subscription
    const channel = supabase
      .channel(`project-feedback-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_feedback',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    feedback,
    loading,
    addFeedback,
    fetchReplies,
    refreshFeedback: fetchFeedback,
  };
}

export function useUpdateComments(updateId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<UpdateComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!updateId) return;
    
    try {
      const { data, error } = await supabase
        .from('project_update_comments')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          project_update_comment_likes (id, user_id)
        `)
        .eq('update_id', updateId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Process comments to add likes_count and is_liked
      const processedComments = (data || []).map((comment: any) => ({
        ...comment,
        likes_count: comment.project_update_comment_likes?.length || 0,
        is_liked: user ? comment.project_update_comment_likes?.some((like: any) => like.user_id === user.id) : false,
      }));
      
      setComments(processedComments as UpdateComment[]);
    } catch (error) {
      console.error('Error fetching update comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('project_update_comments')
        .insert({
          update_id: updateId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('¡Comentario añadido!');
      fetchComments();
      return data as unknown as UpdateComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al comentar');
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('project_update_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      toast.success('Comentario eliminado');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Error al eliminar');
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('project_update_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('project_update_comment_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('project_update_comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
      }

      fetchComments();
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [updateId, user]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    toggleCommentLike,
    refreshComments: fetchComments,
  };
}
