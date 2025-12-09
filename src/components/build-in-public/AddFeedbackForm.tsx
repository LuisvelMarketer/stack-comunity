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
  Upload,
  Plus,
  Video,
  Square,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScreenRecorder } from '@/utils/screenRecorder';

const MAX_SCREENSHOTS = 5;
const MAX_VIDEO_SIZE_MB = 50;

interface AddFeedbackFormProps {
  onAdd: (data: { 
    content: string; 
    category: string; 
    priority: string;
    screenshot_urls?: string[];
    video_url?: string;
  }) => Promise<any>;
  disabled?: boolean;
  projectLiveUrl?: string;
}

interface ScreenshotFile {
  file: File;
  preview: string;
}

export function AddFeedbackForm({ onAdd, disabled, projectLiveUrl }: AddFeedbackFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotFile[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenRecorderRef = useRef<ScreenRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addScreenshot = useCallback((file: File) => {
    if (screenshots.length >= MAX_SCREENSHOTS) {
      toast.error(`Máximo ${MAX_SCREENSHOTS} capturas permitidas`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setScreenshots(prev => [...prev, { file, preview }]);
  }, [screenshots.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => addScreenshot(file));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteImage = useCallback((file: File) => {
    addScreenshot(file);
    toast.success('Captura pegada desde portapapeles');
  }, [addScreenshot]);

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

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const startRecording = async () => {
    if (!ScreenRecorder.isSupported()) {
      toast.error('Tu navegador no soporta grabación de pantalla');
      return;
    }

    try {
      screenRecorderRef.current = new ScreenRecorder(30);
      await screenRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast.success('Grabación iniciada (máx. 30 segundos)');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error al iniciar grabación');
    }
  };

  const stopRecording = async () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (screenRecorderRef.current) {
      const blob = await screenRecorderRef.current.stop();
      if (blob) {
        if (blob.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
          toast.error(`El video no puede superar ${MAX_VIDEO_SIZE_MB}MB`);
        } else {
          setVideoBlob(blob);
          setVideoPreviewUrl(URL.createObjectURL(blob));
          toast.success('Grabación completada');
        }
      }
      screenRecorderRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);
  };

  const removeVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoBlob(null);
    setVideoPreviewUrl(null);
  };

  const uploadScreenshots = async (): Promise<string[]> => {
    if (screenshots.length === 0 || !user) return [];

    setUploadingImage(true);
    const urls: string[] = [];

    try {
      for (const screenshot of screenshots) {
        const fileExt = screenshot.file.name.split('.').pop() || 'png';
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(fileName, screenshot.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('feedback-screenshots')
          .getPublicUrl(fileName);

        urls.push(urlData.publicUrl);
      }

      return urls;
    } catch (error) {
      console.error('Error uploading screenshots:', error);
      toast.error('Error al subir las capturas');
      return urls;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!videoBlob || !user) return null;

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('feedback-videos')
        .upload(fileName, videoBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('feedback-videos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Error al subir el video');
      return null;
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
      const [screenshotUrls, videoUrl] = await Promise.all([
        uploadScreenshots(),
        uploadVideo()
      ]);

      await onAdd({
        content: content.trim(),
        category,
        priority,
        screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : undefined,
        video_url: videoUrl || undefined,
      });

      // Reset form
      setContent('');
      setCategory('bug');
      setPriority('medium');
      screenshots.forEach(s => URL.revokeObjectURL(s.preview));
      setScreenshots([]);
      removeVideo();
      toast.success('Feedback enviado');
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast.error('Error al enviar feedback');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (screenRecorderRef.current) {
        screenRecorderRef.current.stop();
      }
    };
  }, []);

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
            <Label>Capturas de pantalla (máx. {MAX_SCREENSHOTS})</Label>
            
            <div className="flex flex-wrap gap-2">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="relative">
                  <img 
                    src={screenshot.preview} 
                    alt={`Preview ${index + 1}`} 
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={() => removeScreenshot(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {screenshots.length < MAX_SCREENSHOTS && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Agregar</span>
                </div>
              )}
            </div>

            {screenshots.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clic para subir o <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+V</kbd> para pegar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG hasta 5MB cada una
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Screen Recording */}
          {ScreenRecorder.isSupported() && (
            <div className="space-y-2">
              <Label>Grabación de pantalla (máx. 30 seg)</Label>
              
              {videoPreviewUrl ? (
                <div className="relative">
                  <video 
                    src={videoPreviewUrl}
                    controls
                    className="w-full max-h-48 rounded-lg border bg-black"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeVideo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : isRecording ? (
                <div className="border-2 border-red-500 rounded-lg p-4 text-center bg-red-500/5">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-500">
                      Grabando... {recordingTime}s / 30s
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                    className="gap-2"
                  >
                    <Square className="h-3 w-3" />
                    Detener grabación
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={startRecording}
                >
                  <Video className="h-4 w-4 text-red-500" />
                  Grabar pantalla
                </Button>
              )}
            </div>
          )}

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
              disabled={loading || uploadingImage || isRecording || !content.trim()}
              className="mt-6"
            >
              {uploadingImage || loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImage ? 'Subiendo...' : 'Enviando...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}