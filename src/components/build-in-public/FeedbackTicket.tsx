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
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Bug, 
  Lightbulb, 
  Palette,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Play
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
    screenshot_url?: string | null;
    screenshot_urls?: string[] | null;
    video_url?: string | null;
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  
  const category = categoryConfig[feedback.category] || categoryConfig.general;
  const status = statusConfig[feedback.status] || statusConfig.open;
  const priority = priorityConfig[feedback.priority] || priorityConfig.medium;
  const CategoryIcon = category.icon;
  const StatusIcon = status.icon;
  const author = feedback.profiles;

  // Get all screenshots (support both old single and new array format)
  const screenshots: string[] = feedback.screenshot_urls && feedback.screenshot_urls.length > 0
    ? feedback.screenshot_urls
    : feedback.screenshot_url
      ? [feedback.screenshot_url]
      : [];

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

  const nextImage = () => {
    setSelectedImageIndex(prev => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(prev => (prev - 1 + screenshots.length) % screenshots.length);
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

            {/* Media (Screenshots + Video) */}
            {(screenshots.length > 0 || feedback.video_url) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Screenshots */}
                {screenshots.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative group cursor-pointer inline-block">
                        <div className="flex gap-2">
                          {screenshots.slice(0, 3).map((url, index) => (
                            <img 
                              key={index}
                              src={url} 
                              alt={`Screenshot ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-lg border"
                            />
                          ))}
                          {screenshots.length > 3 && (
                            <div className="h-20 w-20 rounded-lg border bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium text-muted-foreground">
                                +{screenshots.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-2">
                      <div className="relative">
                        <img 
                          src={screenshots[selectedImageIndex]} 
                          alt={`Screenshot ${selectedImageIndex + 1}`}
                          className="w-full h-auto rounded-lg max-h-[80vh] object-contain"
                        />
                        
                        {screenshots.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2"
                              onClick={prevImage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={nextImage}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                              {screenshots.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`h-2 w-2 rounded-full transition-colors ${
                                    index === selectedImageIndex ? 'bg-primary' : 'bg-muted-foreground/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Video */}
                {feedback.video_url && (
                  <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
                    <DialogTrigger asChild>
                      <div className="relative h-20 w-32 rounded-lg border bg-black cursor-pointer group overflow-hidden">
                        <video 
                          src={feedback.video_url}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                          <Play className="h-8 w-8 text-white fill-white" />
                        </div>
                        <Badge className="absolute bottom-1 right-1 text-[10px] px-1 py-0">
                          Video
                        </Badge>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-2">
                      <video 
                        src={feedback.video_url}
                        controls
                        autoPlay
                        className="w-full h-auto rounded-lg max-h-[80vh]"
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

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