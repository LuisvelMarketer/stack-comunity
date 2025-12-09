import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUpdateComments, type UpdateComment } from '@/hooks/useBuildProjects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UpdateCommentsProps {
  updateId: string;
  initialCount?: number;
}

export function UpdateComments({ updateId, initialCount = 0 }: UpdateCommentsProps) {
  const { user } = useAuth();
  const { comments, addComment, deleteComment, toggleCommentLike, loading } = useUpdateComments(updateId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commentsCount = comments.length || initialCount;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{commentsCount} comentario{commentsCount !== 1 ? 's' : ''}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Comments list */}
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isOwner={user?.id === comment.user_id}
                  isLoggedIn={!!user}
                  onDelete={() => deleteComment(comment.id)}
                  onToggleLike={() => toggleCommentLike(comment.id)}
                />
              ))}
            </div>
          )}

          {/* Add comment form */}
          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <UserAvatar
                src={undefined}
                fallback={user.email?.[0] || '?'}
                size="sm"
              />
              <div className="flex-1 flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="min-h-[36px] h-9 py-2 resize-none text-sm"
                  rows={1}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              <Link to="/auth" className="text-primary hover:underline">
                Inicia sesión
              </Link>{' '}
              para comentar
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  isOwner,
  isLoggedIn,
  onDelete,
  onToggleLike,
}: {
  comment: UpdateComment;
  isOwner: boolean;
  isLoggedIn: boolean;
  onDelete: () => void;
  onToggleLike: () => void;
}) {
  const author = comment.profiles;

  return (
    <div className="flex gap-2 group">
      <Link to={`/profile/${author?.id}`}>
        <UserAvatar
          src={author?.avatar_url || undefined}
          fallback={author?.full_name?.[0] || '?'}
          size="sm"
        />
      </Link>
      <div className="flex-1">
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${author?.id}`}
              className="text-sm font-medium hover:underline"
            >
              {author?.full_name || 'Usuario'}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {isOwner && (
              <button
                onClick={onDelete}
                className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
        </div>
        
        {/* Like button */}
        <div className="flex items-center gap-1 mt-1 ml-1">
          <button
            onClick={onToggleLike}
            disabled={!isLoggedIn}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              comment.is_liked 
                ? "text-red-500 hover:text-red-600" 
                : "text-muted-foreground hover:text-foreground",
              !isLoggedIn && "cursor-default opacity-50"
            )}
          >
            <Heart 
              className={cn(
                "h-3 w-3",
                comment.is_liked && "fill-current"
              )} 
            />
            {comment.likes_count > 0 && (
              <span>{comment.likes_count}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}