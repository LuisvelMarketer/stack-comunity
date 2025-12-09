import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBuildProjects, type BuildProject } from '@/hooks/useBuildProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, X, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  { value: 'idea', label: '💡 Idea' },
  { value: 'in_progress', label: '🚧 En progreso' },
  { value: 'paused', label: '⏸️ Pausado' },
  { value: 'completed', label: '✅ Completado' },
  { value: 'abandoned', label: '🗑️ Abandonado' },
];

const visibilityOptions = [
  { value: 'public', label: '🌍 Público - Todos pueden verlo' },
  { value: 'community', label: '👥 Comunidad - Solo miembros' },
  { value: 'private', label: '🔒 Privado - Solo tú' },
];

export default function ProjectEdit() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProject, deleteProject } = useBuildProjects();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<BuildProject | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [status, setStatus] = useState<BuildProject['status']>('idea');
  const [visibility, setVisibility] = useState<BuildProject['visibility']>('public');

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from('build_projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        // Check ownership
        if (data.user_id !== user?.id) {
          toast.error('No tienes permiso para editar este proyecto');
          navigate(`/build-in-public/${projectId}`);
          return;
        }

        setProject(data as BuildProject);
        setTitle(data.title);
        setDescription(data.description || '');
        setTechStack(data.tech_stack || []);
        setRepositoryUrl(data.repository_url || '');
        setLiveUrl(data.live_url || '');
        setStatus(data.status as BuildProject['status']);
        setVisibility(data.visibility as BuildProject['visibility']);
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/build-in-public');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProject();
    }
  }, [projectId, user]);

  const handleAddTech = () => {
    const tech = techInput.trim();
    if (tech && !techStack.includes(tech)) {
      setTechStack([...techStack, tech]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTech();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;

    setSaving(true);
    try {
      await updateProject(projectId, {
        title: title.trim(),
        description: description.trim() || null,
        tech_stack: techStack,
        repository_url: repositoryUrl.trim() || null,
        live_url: liveUrl.trim() || null,
        status,
        visibility,
      });
      navigate(`/build-in-public/${projectId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    await deleteProject(projectId);
    navigate('/build-in-public');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96 w-full rounded-lg" />
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link 
        to={`/build-in-public/${projectId}`} 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al proyecto
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre del Proyecto *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mi App Increíble"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿De qué trata tu proyecto? ¿Qué problema resuelve?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tech">Stack Tecnológico</Label>
              <div className="flex gap-2">
                <Input
                  id="tech"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="React, Node.js, etc."
                />
                <Button type="button" variant="outline" onClick={handleAddTech}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="gap-1">
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repo">URL del Repositorio</Label>
                <Input
                  id="repo"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="live">URL en Vivo</Label>
                <Input
                  id="live"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://myapp.com"
                  type="url"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibilidad</Label>
                <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán todas las 
                      actualizaciones y feedback asociados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/build-in-public/${projectId}`)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !title.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
