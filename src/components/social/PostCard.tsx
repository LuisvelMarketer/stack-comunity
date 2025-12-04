import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MentionInput } from "./MentionInput";

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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkIfLiked();
    if (showComments) {
      loadComments();
    }
  }, [post.id, showComments]);

  const checkIfLiked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .single();

    setIsLiked(!!data);
  };

  const loadComments = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select(`
        *,
        profiles!post_comments_user_id_fkey(full_name, avatar_url)
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: user.id,
        });
        setLikesCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
      onUpdate?.();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      loadComments();
      onUpdate?.();
      toast({
        title: "Comentario publicado",
        description: "Tu comentario se ha agregado exitosamente",
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6">
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage src={post.profiles?.avatar_url || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(post.profiles?.full_name || null)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{post.profiles?.full_name || "Usuario"}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
          <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
          
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="rounded-lg mb-4 w-full object-cover max-h-96"
            />
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-accent" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {post.comments_count}
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-4">
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profiles?.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary text-xs">
                        {getInitials(comment.profiles?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.profiles?.full_name || "Usuario"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleComment} className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="Escribe un comentario... Usa @ para mencionar"
                    minHeight="40px"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};