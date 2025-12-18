import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CodeSnippet {
  id: string;
  community_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  content: string;
  type: 'code' | 'prompt' | 'template';
  language: string | null;
  category: string | null;
  tags: string[];
  thumbnail_url: string | null;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface SnippetFilters {
  type?: 'code' | 'prompt' | 'template' | 'all';
  language?: string;
  category?: string;
  search?: string;
  favoritesOnly?: boolean;
}

export function useSnippets(filters: SnippetFilters = {}) {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('code_snippets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters.language) {
        query = query.eq('language', filters.language);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch creator profiles
      const creatorIds = [...new Set((data || []).map(s => s.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let snippetsWithCreators = (data || []).map(snippet => ({
        ...snippet,
        type: snippet.type as 'code' | 'prompt' | 'template',
        tags: snippet.tags || [],
        is_public: snippet.is_public ?? true,
        usage_count: snippet.usage_count ?? 0,
        is_favorite: favorites.has(snippet.id),
        creator: profileMap.get(snippet.created_by)
      }));

      if (filters.favoritesOnly) {
        snippetsWithCreators = snippetsWithCreators.filter(s => favorites.has(s.id));
      }

      setSnippets(snippetsWithCreators);
    } catch (error) {
      console.error('Error fetching snippets:', error);
      toast.error('Error al cargar los snippets');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('code_snippet_favorites')
      .select('snippet_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(new Set(data.map(f => f.snippet_id)));
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    fetchSnippets();
  }, [filters.type, filters.language, filters.category, filters.search, filters.favoritesOnly, favorites]);

  const toggleFavorite = async (snippetId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    const isFavorite = favorites.has(snippetId);

    if (isFavorite) {
      const { error } = await supabase
        .from('code_snippet_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('snippet_id', snippetId);

      if (!error) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(snippetId);
          return next;
        });
        toast.success('Eliminado de favoritos');
      }
    } else {
      const { error } = await supabase
        .from('code_snippet_favorites')
        .insert({ user_id: user.id, snippet_id: snippetId });

      if (!error) {
        setFavorites(prev => new Set(prev).add(snippetId));
        toast.success('Añadido a favoritos');
      }
    }
  };

  const incrementUsage = async (snippetId: string) => {
    const currentCount = snippets.find(s => s.id === snippetId)?.usage_count ?? 0;
    await supabase
      .from('code_snippets')
      .update({ usage_count: currentCount + 1 })
      .eq('id', snippetId);
  };

  const copyToClipboard = async (snippet: CodeSnippet) => {
    try {
      await navigator.clipboard.writeText(snippet.content);
      toast.success('¡Copiado al portapapeles!');
      incrementUsage(snippet.id);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const createSnippet = async (snippet: Omit<CodeSnippet, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'created_by'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('code_snippets')
      .insert({
        ...snippet,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear el snippet');
      return null;
    }

    toast.success('Snippet creado exitosamente');
    fetchSnippets();
    return data;
  };

  const updateSnippet = async (id: string, updates: Partial<CodeSnippet>) => {
    const { error } = await supabase
      .from('code_snippets')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar el snippet');
      return false;
    }

    toast.success('Snippet actualizado');
    fetchSnippets();
    return true;
  };

  const deleteSnippet = async (id: string) => {
    const { error } = await supabase
      .from('code_snippets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar el snippet');
      return false;
    }

    toast.success('Snippet eliminado');
    fetchSnippets();
    return true;
  };

  return {
    snippets,
    loading,
    favorites,
    toggleFavorite,
    copyToClipboard,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    refetch: fetchSnippets
  };
}

export function useSnippet(id: string | undefined) {
  const [snippet, setSnippet] = useState<CodeSnippet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchSnippet = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        // Fetch creator profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', data.created_by)
          .single();

        setSnippet({
          ...data,
          type: data.type as 'code' | 'prompt' | 'template',
          tags: data.tags || [],
          is_public: data.is_public ?? true,
          usage_count: data.usage_count ?? 0,
          creator: profile || undefined
        });
      }
      setLoading(false);
    };

    fetchSnippet();
  }, [id]);

  return { snippet, loading };
}
