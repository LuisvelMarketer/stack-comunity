import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, Plus, Edit, Trash2, GripVertical, Video } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  is_free: boolean;
  order_index: number;
}

interface CommunityModulesManagerProps {
  courseId: string;
  courseTitle: string;
  onBack: () => void;
}

export function CommunityModulesManager({ courseId, courseTitle, onBack }: CommunityModulesManagerProps) {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    video_url: "",
    is_free: false,
  });

  useEffect(() => {
    loadModules();
  }, [courseId]);

  const loadModules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los módulos.",
        variant: "destructive",
      });
    } else {
      setModules(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      content: "",
      video_url: "",
      is_free: false,
    });
    setEditingModule(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (module: Module) => {
    setEditingModule(module);
    setForm({
      title: module.title,
      description: module.description || "",
      content: module.content || "",
      video_url: module.video_url || "",
      is_free: module.is_free || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    if (editingModule) {
      const { error } = await supabase
        .from("course_modules")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          content: form.content.trim() || null,
          video_url: form.video_url.trim() || null,
          is_free: form.is_free,
        })
        .eq("id", editingModule.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Módulo actualizado",
          description: "Los cambios han sido guardados.",
        });
        setDialogOpen(false);
        loadModules();
      }
    } else {
      const maxOrderIndex = modules.length > 0
        ? Math.max(...modules.map(m => m.order_index)) + 1
        : 0;

      const { error } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          content: form.content.trim() || null,
          video_url: form.video_url.trim() || null,
          is_free: form.is_free,
          order_index: maxOrderIndex,
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Módulo creado",
          description: "El módulo ha sido creado exitosamente.",
        });
        setDialogOpen(false);
        loadModules();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (moduleId: string) => {
    const { error } = await supabase
      .from("course_modules")
      .delete()
      .eq("id", moduleId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el módulo.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Módulo eliminado",
        description: "El módulo ha sido eliminado.",
      });
      loadModules();
    }
  };

  const moveModule = async (moduleId: string, direction: "up" | "down") => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const currentModule = modules[currentIndex];
    const targetModule = modules[targetIndex];

    // Swap order_index values
    const { error: error1 } = await supabase
      .from("course_modules")
      .update({ order_index: targetModule.order_index })
      .eq("id", currentModule.id);

    const { error: error2 } = await supabase
      .from("course_modules")
      .update({ order_index: currentModule.order_index })
      .eq("id", targetModule.id);

    if (error1 || error2) {
      toast({
        title: "Error",
        description: "No se pudo reordenar el módulo.",
        variant: "destructive",
      });
    } else {
      loadModules();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Módulos: {courseTitle}
          </CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Editar Módulo" : "Nuevo Módulo"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="module-title">Título *</Label>
                <Input
                  id="module-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Introducción al tema"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-description">Descripción breve</Label>
                <Textarea
                  id="module-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Resumen del módulo..."
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-video">URL del video (YouTube, Vimeo, etc.)</Label>
                <Input
                  id="module-video"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="module-content">Contenido (Markdown soportado)</Label>
                <Textarea
                  id="module-content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Escribe el contenido de la lección aquí..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="module-free">Módulo gratuito</Label>
                  <p className="text-xs text-muted-foreground">
                    Los módulos gratuitos son visibles para todos
                  </p>
                </div>
                <Switch
                  id="module-free"
                  checked={form.is_free}
                  onCheckedChange={(checked) => setForm({ ...form, is_free: checked })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Guardando..." : editingModule ? "Guardar cambios" : "Crear módulo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay módulos en este curso.</p>
            <p className="text-sm">Crea tu primer módulo para estructurar el contenido.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => moveModule(module.id, "up")}
                  >
                    <GripVertical className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === modules.length - 1}
                    onClick={() => moveModule(module.id, "down")}
                  >
                    <GripVertical className="h-4 w-4 rotate-90" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="font-medium truncate">{module.title}</span>
                    {module.is_free && (
                      <Badge variant="secondary" className="text-xs">Gratis</Badge>
                    )}
                    {module.video_url && (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {module.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {module.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(module)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará el módulo "{module.title}" permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(module.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}