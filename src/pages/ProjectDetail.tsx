import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuildProjects, useProjectUpdates, useProjectFeedback, type BuildProject } from '@/hooks/useBuildProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Heart, 
  Github, 
  ExternalLink, 
  Clock,
  Edit,
  Plus,
  Send,
  Rocket,
  Lightbulb,
  Trophy,
  BookOpen,
  Zap,
  MessageCircle,
  Users,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProjectUpdate, ProjectFeedback } from '@/hooks/useBuildProjects';

const statusLabels = {
  idea: 'Idea',
  in_progress: 'En progreso',
  paused: 'Pausado',
  completed: 'Completado',
  abandoned: 'Abandonado',
};

const statusColors = {
  idea: 'bg-purple-500',
  in_progress: 'bg-blue-500',
  paused: 'bg-yellow-500',
  completed: 'bg-green-500',
  abandoned: 'bg-gray-500',
};

const updateTypeConfig = {
  progress: { icon: Zap, color: 'bg-blue-500', label: 'Progreso' },
  milestone: { icon: Trophy, color: 'bg-yellow-500', label: 'Hito' },
  challenge: { icon: Lightbulb, color: 'bg-orange-500', label: 'Desafío' },
  learning: { icon: BookOpen, color: 'bg-purple-500', label: 'Aprendizaje' },
  launch: { icon: Rocket, color: 'bg-green-500', label: 'Lanzamiento' },
};

const moodEmojis = {
  excited: '🔥',
  productive: '💪',
  stuck: '🤔',
  learning: '📚',
  celebrating: '🎉',
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleLike, checkIfLiked } = useBuildProjects();
  
  const [project, setProject] = useState<BuildProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const { updates, createUpdate } = useProjectUpdates(projectId || '');
  const { feedback, addFeedback } = useProjectFeedback(projectId || '');

  const isOwner = user?.id === project?.user_id;

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from('build_projects')
          .select(`
            *,
            profiles:user_id (id, full_name, avatar_url, level, points)
          `)
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data as unknown as BuildProject);

        // Check if liked
        const liked = await checkIfLiked(projectId);
        setIsLiked(liked);

        // Get followers count
        const { count } = await supabase
          .from('project_followers')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId);
        
        setFollowersCount(count || 0);
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/build-in-public');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleLike = async () => {
    if (!projectId) return;
    await toggleLike(projectId);
    setIsLiked(!isLiked);
    if (project) {
      setProject({
        ...project,
        likes_count: isLiked ? project.likes_count - 1 : project.likes_count + 1,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Proyecto no encontrado</h1>
        <Link to="/build-in-public">
          <Button>Volver</Button>
        </Link>
      </div>
    );
  }

  const author = project.profiles as any;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <Link to="/build-in-public" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a proyectos
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {project.thumbnail_url ? (
                  <img 
                    src={project.thumbnail_url} 
                    alt={project.title}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-primary">
                      {project.title[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{project.title}</h1>
                    <Badge className={`${statusColors[project.status]} text-white`}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {project.description || 'Sin descripción'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack?.map((tech) => (
                      <Badge key={tech} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t">
                <Button 
                  variant={isLiked ? "default" : "outline"} 
                  onClick={handleLike}
                  disabled={!user}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {project.likes_count}
                </Button>
                
                {project.repository_url && (
                  <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <Github className="h-4 w-4 mr-2" />
                      Repositorio
                    </Button>
                  </a>
                )}
                
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver en vivo
                    </Button>
                  </a>
                )}

                {isOwner && (
                  <Link to={`/build-in-public/${project.id}/edit`} className="ml-auto">
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Updates & Feedback */}
          <Tabs defaultValue="updates">
            <TabsList className="w-full">
              <TabsTrigger value="updates" className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Diario ({updates.length})
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Feedback ({feedback.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="updates" className="mt-4 space-y-4">
              {isOwner && <AddUpdateDialog onAdd={createUpdate} />}
              
              {updates.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {isOwner 
                        ? 'Comparte tu primera actualización del proyecto'
                        : 'Aún no hay actualizaciones'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                updates.map((update) => (
                  <UpdateCard key={update.id} update={update} />
                ))
              )}
            </TabsContent>

            <TabsContent value="feedback" className="mt-4 space-y-4">
              <AddFeedbackForm onAdd={addFeedback} disabled={!user} />
              
              {feedback.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Sé el primero en dar feedback
                    </p>
                  </CardContent>
                </Card>
              ) : (
                feedback.map((item) => (
                  <FeedbackCard key={item.id} feedback={item} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Creador</CardTitle>
            </CardHeader>
            <CardContent>
              <Link to={`/user/${author?.id}`} className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg -m-2">
                <UserAvatar
                  src={author?.avatar_url}
                  fallback={author?.full_name?.[0] || '?'}
                  size="lg"
                />
                <div>
                  <p className="font-semibold">{author?.full_name || 'Usuario'}</p>
                  <p className="text-sm text-muted-foreground">
                    Nivel {author?.level || 1} • {author?.points || 0} pts
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{updates.length}</p>
                <p className="text-sm text-muted-foreground">Actualizaciones</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-sm text-muted-foreground">Feedback</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{project.likes_count}</p>
                <p className="text-sm text-muted-foreground">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{followersCount}</p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Creado</span>
                <span className="text-muted-foreground ml-auto">
                  {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
              {project.updated_at !== project.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Última actualización</span>
                  <span className="text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UpdateCard({ update }: { update: ProjectUpdate }) {
  const config = updateTypeConfig[update.update_type];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{update.title}</h4>
              {update.mood && (
                <span className="text-lg">{moodEmojis[update.mood]}</span>
              )}
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">{update.content}</p>
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(update.created_at), { addSuffix: true, locale: es })}
              </span>
              {update.hours_spent && (
                <span>{update.hours_spent}h invertidas</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackCard({ feedback }: { feedback: ProjectFeedback }) {
  const author = feedback.profiles;
  
  const typeLabels = {
    comment: '💬',
    suggestion: '💡',
    encouragement: '🎉',
    question: '❓',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link to={`/user/${author?.id}`}>
            <UserAvatar
              src={author?.avatar_url}
              fallback={author?.full_name?.[0] || '?'}
              size="sm"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/user/${author?.id}`} className="font-semibold hover:underline">
                {author?.full_name || 'Usuario'}
              </Link>
              <span>{typeLabels[feedback.feedback_type]}</span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
            <p className="text-muted-foreground">{feedback.content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddUpdateDialog({ onAdd }: { onAdd: (update: any) => Promise<any> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [updateType, setUpdateType] = useState<'progress' | 'milestone' | 'challenge' | 'learning' | 'launch'>('progress');
  const [mood, setMood] = useState<'excited' | 'productive' | 'stuck' | 'learning' | 'celebrating' | null>(null);
  const [hoursSpent, setHoursSpent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        title: title.trim(),
        content: content.trim(),
        update_type: updateType,
        mood,
        hours_spent: hoursSpent ? parseInt(hoursSpent) : undefined,
      });
      setOpen(false);
      setTitle('');
      setContent('');
      setUpdateType('progress');
      setMood(null);
      setHoursSpent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actualización
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Actualización</DialogTitle>
          <DialogDescription>
            Comparte tu progreso con la comunidad
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de actualización</Label>
            <Select value={updateType} onValueChange={(v: any) => setUpdateType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">⚡ Progreso</SelectItem>
                <SelectItem value="milestone">🏆 Hito logrado</SelectItem>
                <SelectItem value="challenge">💡 Desafío/Bloqueo</SelectItem>
                <SelectItem value="learning">📚 Aprendizaje</SelectItem>
                <SelectItem value="launch">🚀 Lanzamiento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué lograste hoy?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cuéntanos más detalles..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado de ánimo (opcional)</Label>
              <Select value={mood || ''} onValueChange={(v: any) => setMood(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excited">🔥 Emocionado</SelectItem>
                  <SelectItem value="productive">💪 Productivo</SelectItem>
                  <SelectItem value="stuck">🤔 Atascado</SelectItem>
                  <SelectItem value="learning">📚 Aprendiendo</SelectItem>
                  <SelectItem value="celebrating">🎉 Celebrando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horas invertidas (opcional)</Label>
              <Input
                type="number"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddFeedbackForm({ onAdd, disabled }: { onAdd: (content: string, type?: any) => Promise<any>; disabled: boolean }) {
  const [content, setContent] = useState('');
  const [feedbackType, setFeedbackType] = useState<'comment' | 'suggestion' | 'encouragement' | 'question'>('comment');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onAdd(content.trim(), feedbackType);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <Select value={feedbackType} onValueChange={(v: any) => setFeedbackType(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comment">💬 Comentario</SelectItem>
            <SelectItem value="suggestion">💡 Sugerencia</SelectItem>
            <SelectItem value="encouragement">🎉 Ánimo</SelectItem>
            <SelectItem value="question">❓ Pregunta</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={disabled ? "Inicia sesión para comentar" : "Escribe tu feedback..."}
          disabled={disabled}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || loading || !content.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
