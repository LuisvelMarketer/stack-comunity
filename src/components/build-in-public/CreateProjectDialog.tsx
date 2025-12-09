import { useState } from 'react';
import { useBuildProjects } from '@/hooks/useBuildProjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const { createProject } = useBuildProjects();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'community' | 'private'>('public');

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
    if (!title.trim()) return;

    setLoading(true);
    try {
      const project = await createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        tech_stack: techStack,
        repository_url: repositoryUrl.trim() || undefined,
        live_url: liveUrl.trim() || undefined,
        visibility,
      });

      if (project) {
        setOpen(false);
        resetForm();
        navigate(`/build-in-public/${project.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTechInput('');
    setTechStack([]);
    setRepositoryUrl('');
    setLiveUrl('');
    setVisibility('public');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Crear Nuevo Proyecto
          </DialogTitle>
          <DialogDescription>
            Comparte tu journey de construcción con la comunidad
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              rows={3}
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

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibilidad</Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">🌍 Público - Todos pueden verlo</SelectItem>
                <SelectItem value="community">👥 Comunidad - Solo miembros</SelectItem>
                <SelectItem value="private">🔒 Privado - Solo tú</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
