import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Reply, Trash2, Edit2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Comment {
  id: string;
  module_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  profile?: {
    full_name: string;
  };
  replies?: Comment[];
}

interface ModuleCommentsProps {
  moduleId: string;
}

export const ModuleComments = ({ moduleId }: ModuleCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('module-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'module_comments',
          filter: `module_id=eq.${moduleId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [moduleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("module_comments")
        .select(`
          *,
          profile:profiles(full_name)
        `)
        .eq("module_id", moduleId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data?.forEach((comment: any) => {
        const commentObj: Comment = {
          ...comment,
          replies: [],
        };
        commentsMap.set(comment.id, commentObj);

        if (!comment.parent_comment_id) {
          rootComments.push(commentObj);
        }
      });

      // Build reply trees
      data?.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          const child = commentsMap.get(comment.id);
          if (parent && child) {
            parent.replies?.push(child);
          }
        }
      });

      setComments(rootComments);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("module_comments").insert({
        module_id: moduleId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "¡Comentario publicado!",
        description: "Tu comentario ha sido agregado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para responder",
        variant: "destructive",
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "La respuesta no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("module_comments").insert({
        module_id: moduleId,
        user_id: user.id,
        parent_comment_id: parentId,
        content: replyContent.trim(),
      });

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "¡Respuesta publicada!",
        description: "Tu respuesta ha sido agregada",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("module_comments")
        .update({
          content: editContent.trim(),
          is_edited: true,
        })
        .eq("id", commentId);

      if (error) throw error;

      setEditingId(null);
      setEditContent("");
      toast({
        title: "¡Comentario actualizado!",
        description: "Tu comentario ha sido editado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("module_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isOwner = user?.id === comment.user_id;
    const isEditing = editingId === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div className={`${depth > 0 ? "ml-8 mt-4 pl-4 border-l-2 border-border" : ""}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {comment.profile?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.profile?.full_name || "Usuario"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground italic">(editado)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edita tu comentario..."
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={submitting}
                  >
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
            )}

            {!isEditing && (
              <div className="flex gap-3 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Responder
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            )}

            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Responder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comentarios y Discusiones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              user
                ? "Escribe tu comentario o pregunta..."
                : "Inicia sesión para comentar"
            }
            disabled={!user}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!user || !newComment.trim() || submitting}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            Publicar Comentario
          </Button>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aún no hay comentarios</p>
            <p className="text-sm">¡Sé el primero en comentar!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
