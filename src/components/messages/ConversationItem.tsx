import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  id: string;
  otherUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number;
  isSelected: boolean;
  isOnline?: boolean;
  onClick: () => void;
}

export const ConversationItem = ({
  otherUser,
  lastMessage,
  updatedAt,
  unreadCount = 0,
  isSelected,
  isOnline = false,
  onClick
}: ConversationItemProps) => {
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-border/50',
        'hover:bg-accent/50',
        isSelected && 'bg-accent'
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          {otherUser?.avatar_url && (
            <AvatarImage src={otherUser.avatar_url} alt={otherUser.full_name || ''} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(otherUser?.full_name || null)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'font-medium truncate',
            unreadCount > 0 && 'text-foreground'
          )}>
            {otherUser?.full_name || 'Usuario'}
          </p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(updatedAt), {
              addSuffix: false,
              locale: es
            })}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'text-sm truncate',
            unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
          )}>
            {lastMessage || 'Sin mensajes'}
          </p>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 rounded-full text-[10px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
