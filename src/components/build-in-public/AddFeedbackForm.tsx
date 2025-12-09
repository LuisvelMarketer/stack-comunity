import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Lightbulb, 
  Palette,
  MessageSquare,
  Send,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface AddFeedbackFormProps {
  onAdd: (data: { 
    content: string; 
    category: string; 
    priority: string;
  }) => Promise<any>;
  disabled?: boolean;
  projectLiveUrl?: string;
}

export function AddFeedbackForm({ onAdd, disabled, projectLiveUrl }: AddFeedbackFormProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Escribe algo de feedback');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        content: content.trim(),
        category,
        priority,
      });
      setContent('');
      setCategory('bug');
      setPriority('medium');
      toast.success('Feedback enviado');
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast.error('Error al enviar feedback');
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <p>Inicia sesión para dejar feedback</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Reportar Bug o Sugerencia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projectLiveUrl && (
          <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">
              💡 <strong>Tip:</strong> Primero prueba la app para encontrar bugs o mejoras
            </p>
            <a 
              href={projectLiveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Abrir app en nueva pestaña →
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Tabs */}
          <div className="space-y-2">
            <Label>Tipo de feedback</Label>
            <Tabs value={category} onValueChange={setCategory}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="bug" className="gap-1.5 text-xs sm:text-sm">
                  <Bug className="h-3.5 w-3.5 text-red-500" />
                  <span className="hidden sm:inline">Bug</span>
                </TabsTrigger>
                <TabsTrigger value="improvement" className="gap-1.5 text-xs sm:text-sm">
                  <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="hidden sm:inline">Mejora</span>
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm">
                  <Palette className="h-3.5 w-3.5 text-purple-500" />
                  <span className="hidden sm:inline">Diseño</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  <span className="hidden sm:inline">Otro</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {category === 'bug' && 'Describe el bug (pasos para reproducir, qué esperabas vs qué pasó)'}
              {category === 'improvement' && 'Describe tu sugerencia de mejora'}
              {category === 'design' && 'Describe el problema de diseño o tu propuesta'}
              {category === 'general' && 'Tu comentario o pregunta'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                category === 'bug' 
                  ? "1. Fui a la página X\n2. Hice clic en Y\n3. Esperaba Z pero pasó W" 
                  : "Escribe aquí..."
              }
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      Baja
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Media
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      Alta
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <AlertTriangle className="h-3 w-3" />
                      Crítica
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !content.trim()}
              className="mt-6"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}