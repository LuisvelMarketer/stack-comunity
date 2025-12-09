import { useState, useRef, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddFeedbackFormProps {
  onAdd: (data: { 
    content: string; 
    category: string; 
    priority: string;
    screenshot_url?: string;
  }) => Promise<any>;
  disabled?: boolean;
  projectLiveUrl?: string;
}

export function AddFeedbackForm({ onAdd, disabled, projectLiveUrl }: AddFeedbackFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handlePasteImage = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
    toast.success('Captura pegada desde portapapeles');
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handlePasteImage(file);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePasteImage]);

  const removeScreenshot = () => {
    setScreenshot(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshot || !user) return null;

    setUploadingImage(true);
    try {
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast.error('Error al subir la captura');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Escribe algo de feedback');
      return;
    }

    setLoading(true);
    try {
      // Upload screenshot if exists
      let screenshotUrl: string | undefined;
      if (screenshot) {
        const url = await uploadScreenshot();
        if (url) screenshotUrl = url;
      }

      await onAdd({
        content: content.trim(),
        category,
        priority,
        screenshot_url: screenshotUrl,
      });

      // Reset form
      setContent('');
      setCategory('bug');
      setPriority('medium');
      removeScreenshot();
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

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>Captura de pantalla (opcional)</Label>
            
            {screenshotPreview ? (
              <div className="relative inline-block">
                <img 
                  src={screenshotPreview} 
                  alt="Preview" 
                  className="max-h-40 rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={removeScreenshot}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clic para subir o <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+V</kbd> para pegar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG hasta 5MB
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
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
              disabled={loading || uploadingImage || !content.trim()}
              className="mt-6"
            >
              {uploadingImage ? (
                <>
                  <ImageIcon className="h-4 w-4 mr-2 animate-pulse" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
