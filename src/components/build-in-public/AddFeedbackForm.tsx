import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Bug, 
  Lightbulb, 
  Palette,
  MessageSquare,
  Send,
  X,
  Upload,
  Plus,
  Video,
  Square,
  Loader2,
  Pencil,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ScreenRecorder } from '@/utils/screenRecorder';
import { ScreenshotAnnotator } from './ScreenshotAnnotator';
import { cn } from '@/lib/utils';

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

interface FeedbackFields {
  bug: string;
  improvement: string;
  design: string;
  general: string;
}

type CategoryKey = keyof FeedbackFields;

const categories: { key: CategoryKey; label: string; icon: React.ReactNode; color: string; placeholder: string }[] = [
  { 
    key: 'bug', 
    label: 'Bug', 
    icon: <Bug className="h-4 w-4" />, 
    color: 'text-red-500 border-red-500 bg-red-500/10',
    placeholder: '1. Fui a la página X\n2. Hice clic en Y\n3. Esperaba Z pero pasó W'
  },
  { 
    key: 'improvement', 
    label: 'Mejora', 
    icon: <Lightbulb className="h-4 w-4" />, 
    color: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
    placeholder: 'Sería útil agregar... / Podrían mejorar...'
  },
  { 
    key: 'design', 
    label: 'Diseño', 
    icon: <Palette className="h-4 w-4" />, 
    color: 'text-purple-500 border-purple-500 bg-purple-500/10',
    placeholder: 'El botón está muy pequeño... / Los colores no contrastan bien...'
  },
  { 
    key: 'general', 
    label: 'Otro', 
    icon: <MessageSquare className="h-4 w-4" />, 
    color: 'text-blue-500 border-blue-500 bg-blue-500/10',
    placeholder: 'Cualquier otro comentario, pregunta o sugerencia...'
  },
];

export function AddFeedbackForm({ onAdd, disabled, projectLiveUrl }: AddFeedbackFormProps) {
  const { user } = useAuth();
  const [fields, setFields] = useState<FeedbackFields>({
    bug: '',
    improvement: '',
    design: '',
    general: ''
  });
  const [openCategories, setOpenCategories] = useState<Set<CategoryKey>>(new Set());
  const MAX_RECORDING_SECONDS = 60;
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotFile[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenRecorderRef = useRef<ScreenRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleCategory = (key: CategoryKey) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const updateField = (field: CategoryKey, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

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

  const handleAnnotationSave = async (annotatedImageUrl: string) => {
    if (annotatingIndex === null) return;

    const response = await fetch(annotatedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], `annotated-${Date.now()}.png`, { type: 'image/png' });
    const preview = URL.createObjectURL(blob);

    setScreenshots(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[annotatingIndex].preview);
      updated[annotatingIndex] = { file, preview };
      return updated;
    });

    setAnnotatingIndex(null);
    toast.success('Anotaciones guardadas');
  };

  const startRecording = async () => {
    if (!ScreenRecorder.isSupported()) {
      toast.error('Tu navegador no soporta grabación de pantalla');
      return;
    }

    try {
      screenRecorderRef.current = new ScreenRecorder(MAX_RECORDING_SECONDS);
      await screenRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast.success(`Grabación iniciada (máx. ${MAX_RECORDING_SECONDS} segundos)`);
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
    
    const hasContent = Object.values(fields).some(v => v.trim() !== '');
    if (!hasContent) {
      toast.error('Rellena al menos un campo de feedback');
      return;
    }

    setLoading(true);
    try {
      const [screenshotUrls, videoUrl] = await Promise.all([
        uploadScreenshots(),
        uploadVideo()
      ]);

      const submissions = [];
      
      if (fields.bug.trim()) {
        submissions.push(onAdd({
          content: fields.bug.trim(),
          category: 'bug',
          priority: 'medium',
          screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : undefined,
          video_url: videoUrl || undefined,
        }));
      }
      
      if (fields.improvement.trim()) {
        submissions.push(onAdd({
          content: fields.improvement.trim(),
          category: 'improvement',
          priority: 'medium',
        }));
      }
      
      if (fields.design.trim()) {
        submissions.push(onAdd({
          content: fields.design.trim(),
          category: 'design',
          priority: 'medium',
        }));
      }
      
      if (fields.general.trim()) {
        submissions.push(onAdd({
          content: fields.general.trim(),
          category: 'general',
          priority: 'low',
        }));
      }

      await Promise.all(submissions);

      setFields({ bug: '', improvement: '', design: '', general: '' });
      setOpenCategories(new Set());
      screenshots.forEach(s => URL.revokeObjectURL(s.preview));
      setScreenshots([]);
      removeVideo();
      toast.success(`${submissions.length} feedback(s) enviado(s)`);
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast.error('Error al enviar feedback');
    } finally {
      setLoading(false);
    }
  };

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

  const filledCategories = categories.filter(c => fields[c.key].trim() !== '');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Deja tu Feedback
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
          {/* Category Buttons */}
          <div className="space-y-2">
            <Label>Selecciona las categorías (clic para expandir)</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isOpen = openCategories.has(cat.key);
                const hasContent = fields[cat.key].trim() !== '';
                
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggleCategory(cat.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                      isOpen || hasContent ? cat.color : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
                    )}
                  >
                    {cat.icon}
                    {cat.label}
                    {hasContent && <Check className="h-3 w-3 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expanded Textareas */}
          {categories.map((cat) => {
            if (!openCategories.has(cat.key)) return null;
            
            return (
              <div key={cat.key} className={cn("space-y-2 p-3 rounded-lg border-2 animate-in slide-in-from-top-2 duration-200", cat.color)}>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    {cat.icon}
                    {cat.label}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleCategory(cat.key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={fields[cat.key]}
                  onChange={(e) => updateField(cat.key, e.target.value)}
                  placeholder={cat.placeholder}
                  rows={3}
                  className="resize-none bg-background"
                  autoFocus
                />
              </div>
            );
          })}

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label>Capturas de pantalla (máx. {MAX_SCREENSHOTS})</Label>
            
            <div className="flex flex-wrap gap-2">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={screenshot.preview} 
                    alt={`Preview ${index + 1}`} 
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAnnotatingIndex(index)}
                      title="Anotar"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeScreenshot(index)}
                      title="Eliminar"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
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
              <Label>Grabación de pantalla con audio (máx. {MAX_RECORDING_SECONDS} seg)</Label>
              
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
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    Grabando... {recordingTime}s / {MAX_RECORDING_SECONDS}s
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                    className="ml-auto"
                  >
                    <Square className="h-3 w-3 mr-1.5" />
                    Detener
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startRecording}
                  className="w-full"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Iniciar grabación de pantalla
                </Button>
              )}
            </div>
          )}

          {/* Summary of filled categories */}
          {filledCategories.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Categorías con feedback: {filledCategories.map(c => c.label).join(', ')}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Feedback
              </>
            )}
          </Button>
        </form>

        {/* Screenshot Annotator Modal */}
        {annotatingIndex !== null && screenshots[annotatingIndex] && (
          <ScreenshotAnnotator
            imageUrl={screenshots[annotatingIndex].preview}
            onSave={handleAnnotationSave}
            onCancel={() => setAnnotatingIndex(null)}
            open={true}
          />
        )}
      </CardContent>
    </Card>
  );
}
