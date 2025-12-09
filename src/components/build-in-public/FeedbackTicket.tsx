import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bug, 
  Lightbulb, 
  Palette,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  bug: { icon: Bug, color: 'text-red-500 bg-red-500/10', label: 'Bug' },
  improvement: { icon: Lightbulb, color: 'text-yellow-500 bg-yellow-500/10', label: 'Mejora' },
  design: { icon: Palette, color: 'text-purple-500 bg-purple-500/10', label: 'Diseño' },
  general: { icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10', label: 'General' },
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  open: { icon: AlertCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Abierto' },
  in_progress: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'En progreso' },
  resolved: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Resuelto' },
  wont_fix: { icon: XCircle, color: 'bg-muted text-muted-foreground border-muted', label: 'No se hará' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-slate-500', label: 'Baja' },
  medium: { color: 'bg-yellow-500', label: 'Media' },
  high: { color: 'bg-orange-500', label: 'Alta' },
  critical: { color: 'bg-red-500', label: 'Crítica' },
};

interface FeedbackTicketProps {
  feedback: {
    id: string;
    content: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    user_id: string;
    profiles?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  isOwner: boolean;
  onStatusChange?: () => void;
}

export function FeedbackTicket({ feedback, isOwner, onStatusChange }: FeedbackTicketProps) {
  const [updating, setUpdating] = useState(false);
  
  const category = categoryConfig[feedback.category] || categoryConfig.general;
  const status = statusConfig[feedback.status] || statusConfig.open;
  const priority = priorityConfig[feedback.priority] || priorityConfig.medium;
  const CategoryIcon = category.icon;
  const StatusIcon = status.icon;
  const author = feedback.profiles;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('project_feedback')
        .update({ status: newStatus })
        .eq('id', feedback.id);

      if (error) throw error;
      toast.success('Estado actualizado');
      onStatusChange?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className={`border-l-4 ${feedback.status === 'resolved' ? 'opacity-60' : ''}`} style={{
      borderLeftColor: feedback.category === 'bug' ? '#ef4444' : 
                       feedback.category === 'improvement' ? '#eab308' :
                       feedback.category === 'design' ? '#a855f7' : '#3b82f6'
    }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div className={`p-2 rounded-lg ${category.color}`}>
            <CategoryIcon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={`${status.color} border gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {category.label}
              </Badge>
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                <span className="text-xs text-muted-foreground">{priority.label}</span>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <Link 
                to={`/user/${author?.id}`}
                className="flex items-center gap-2 hover:underline"
              >
                <UserAvatar
                  src={author?.avatar_url || undefined}
                  fallback={author?.full_name?.[0] || '?'}
                  size="sm"
                />
                <span className="text-sm text-muted-foreground">
                  {author?.full_name || 'Usuario'}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: es })}
                </span>
              </Link>

              {/* Actions for Owner */}
              {isOwner && feedback.status !== 'resolved' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updating}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {feedback.status !== 'in_progress' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        Marcar en progreso
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleStatusChange('resolved')}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Marcar como resuelto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('wont_fix')}>
                      <XCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                      No se hará
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}