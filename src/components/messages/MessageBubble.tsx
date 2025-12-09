import { useState } from 'react';
import { Check, CheckCheck, SmilePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageBubbleProps {
  id: string;
  content: string;
  senderId: string;
  isOwnMessage: boolean;
  createdAt: string;
  read: boolean;
  reactions?: Reaction[];
  onReactionToggle?: () => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageBubble = ({
  id,
  content,
  isOwnMessage,
  createdAt,
  read,
  reactions = [],
  onReactionToggle
}: MessageBubbleProps) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = async (emoji: string) => {
    if (!user) return;

    try {
      const existingReaction = reactions.find(
        r => r.emoji === emoji && r.hasReacted
      );

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('dm_reactions')
          .delete()
          .eq('message_id', id)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        // Add reaction
        await supabase
          .from('dm_reactions')
          .insert({
            message_id: id,
            user_id: user.id,
            emoji
          });
      }

      onReactionToggle?.();
      setShowReactions(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-2 max-w-[80%]',
        isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2 shadow-sm transition-all',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}>
            <span className="text-[10px] opacity-60">
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: es
              })}
            </span>
            {isOwnMessage && (
              read ? (
                <CheckCheck className="h-3 w-3 text-blue-400" />
              ) : (
                <Check className="h-3 w-3 opacity-60" />
              )
            )}
          </div>

          {/* Reaction button - shows on hover */}
          <Popover open={showReactions} onOpenChange={setShowReactions}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full bg-background border shadow-sm',
                  isOwnMessage ? '-left-2' : '-right-2'
                )}
              >
                <SmilePlus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" side="top">
              <div className="flex gap-1">
                {EMOJI_OPTIONS.map(emoji => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Display reactions */}
        {reactions.length > 0 && (
          <div className={cn(
            'flex flex-wrap gap-1',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}>
            {reactions.map(reaction => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors',
                  reaction.hasReacted
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted border-border hover:border-primary/30'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
