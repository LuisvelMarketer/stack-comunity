import { useState, useEffect } from 'react';
import { Video, Calendar, Play, Radio, ExternalLink, Plus, X } from 'lucide-react';
import { CalendarAddButton } from '@/components/ui/calendar-add-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface LiveSession {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  platform: string;
  stream_url: string;
  thumbnail_url: string | null;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  status: string;
}

interface LiveSessionsProps {
  communityId: string;
  isAdmin?: boolean;
}

export function LiveSessions({ communityId, isAdmin = false }: LiveSessionsProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'youtube',
    stream_url: '',
    scheduled_at: '',
  });

  useEffect(() => {
    fetchSessions();
  }, [communityId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('community_id', communityId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setSessions((data || []) as unknown as LiveSession[]);
    } catch (error) {
      console.error('Error fetching live sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!user || !formData.title || !formData.stream_url || !formData.scheduled_at) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      const { error } = await supabase
        .from('live_sessions')
        .insert({
          community_id: communityId,
          created_by: user.id,
          title: formData.title,
          description: formData.description || null,
          platform: formData.platform,
          stream_url: formData.stream_url,
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success('Sesión en vivo creada');
      setIsCreateOpen(false);
      setFormData({ title: '', description: '', platform: 'youtube', stream_url: '', scheduled_at: '' });
      fetchSessions();
    } catch (error: any) {
      toast.error('Error al crear la sesión');
      console.error(error);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'live') updates.started_at = new Date().toISOString();
      if (status === 'ended') updates.ended_at = new Date().toISOString();

      const { error } = await supabase
        .from('live_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      toast.success(`Estado actualizado a: ${status}`);
      fetchSessions();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('live_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Sesión eliminada');
      fetchSessions();
    } catch (error) {
      toast.error('Error al eliminar sesión');
    }
  };

  const getStatusBadge = (session: LiveSession) => {
    switch (session.status) {
      case 'live':
        return <Badge className="bg-red-500 text-white animate-pulse"><Radio className="h-3 w-3 mr-1" /> EN VIVO</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" /> Programado</Badge>;
      case 'ended':
        return <Badge variant="outline">Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '🎬';
      case 'zoom':
        return '📹';
      default:
        return '📺';
    }
  };

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === 'youtube') {
      // Extract video ID from various YouTube URL formats
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1`;
      }
    }
    return url;
  };

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' || s.status === 'live');
  const pastSessions = sessions.filter(s => s.status === 'ended');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Sesiones en Vivo</h3>
        </div>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Programar Live
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programar Sesión en Vivo</DialogTitle>
                <DialogDescription>
                  Crea una nueva sesión en vivo para tu comunidad
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Masterclass de React"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el contenido de la sesión..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">🎬 YouTube Live</SelectItem>
                      <SelectItem value="zoom">📹 Zoom</SelectItem>
                      <SelectItem value="other">📺 Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream_url">URL del Stream *</Label>
                  <Input
                    id="stream_url"
                    value={formData.stream_url}
                    onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                    placeholder="https://youtube.com/live/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Fecha y Hora *</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                </div>
                <Button onClick={createSession} className="w-full">
                  Programar Sesión
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Live Now or Upcoming */}
      {upcomingSessions.length > 0 ? (
        <div className="space-y-4">
          {upcomingSessions.map((session) => (
            <Card 
              key={session.id} 
              className={session.status === 'live' ? 'border-red-500 bg-red-500/5' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getPlatformIcon(session.platform)}</span>
                      {getStatusBadge(session)}
                    </div>
                    <h4 className="font-semibold text-lg">{session.title}</h4>
                    {session.description && (
                      <p className="text-sm text-muted-foreground">{session.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {format(new Date(session.scheduled_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {session.status === 'live' && (
                      <Button 
                        onClick={() => setSelectedSession(session)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ver Ahora
                      </Button>
                    )}
                    {session.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <CalendarAddButton
                          title={session.title}
                          description={session.description || undefined}
                          location={session.stream_url}
                          startDate={new Date(session.scheduled_at)}
                          size="sm"
                        />
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(session.stream_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir Link
                        </Button>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        {session.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateSessionStatus(session.id, 'live')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {session.status === 'live' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateSessionStatus(session.id, 'ended')}
                          >
                            Finalizar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteSession(session.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay sesiones programadas</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">Programa tu primer live para tu comunidad</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-muted-foreground">Sesiones Anteriores</h4>
          {pastSessions.slice(0, 5).map((session) => (
            <Card key={session.id} className="opacity-75">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.scheduled_at), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  {getStatusBadge(session)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-500 animate-pulse" />
              {selectedSession?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedSession.platform === 'youtube' ? (
                <iframe
                  src={getEmbedUrl(selectedSession.stream_url, selectedSession.platform)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Button onClick={() => window.open(selectedSession.stream_url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir en {selectedSession.platform === 'zoom' ? 'Zoom' : 'Nueva Pestaña'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
