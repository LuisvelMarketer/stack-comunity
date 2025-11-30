import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { Loader2 } from "lucide-react";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SocialFeedProps {
  communityId?: string;
}

export const SocialFeed = ({ communityId }: SocialFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    
    // Realtime subscription
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const loadPosts = async () => {
    try {
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id(full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (communityId) {
        query = query.eq("community_id", communityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreatePost onPostCreated={loadPosts} communityId={communityId} />
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay publicaciones aún. ¡Sé el primero en publicar!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdate={loadPosts} />
        ))
      )}
    </div>
  );
};