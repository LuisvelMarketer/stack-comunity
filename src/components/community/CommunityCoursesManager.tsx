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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import { CommunityModulesManager } from "./CommunityModulesManager";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

interface CommunityCoursesManagerProps {
  communityId: string;
}

export function CommunityCoursesManager({ communityId }: CommunityCoursesManagerProps) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [managingModules, setManagingModules] = useState<Course | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    is_published: false,
  });

  useEffect(() => {
    loadCourses();
  }, [communityId]);

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("community_id", communityId)
      .order("order_index", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive",
      });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      thumbnail_url: "",
      is_published: false,
    });
    setEditingCourse(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description || "",
      thumbnail_url: course.thumbnail_url || "",
      is_published: course.is_published || false,
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

    if (editingCourse) {
      // Update existing course
      const { error } = await supabase
        .from("courses")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          thumbnail_url: form.thumbnail_url.trim() || null,
          is_published: form.is_published,
        })
        .eq("id", editingCourse.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Curso actualizado",
          description: "Los cambios han sido guardados.",
        });
        setDialogOpen(false);
        loadCourses();
      }
    } else {
      // Create new course
      const maxOrderIndex = courses.length > 0 
        ? Math.max(...courses.map(c => c.order_index)) + 1 
        : 0;

      const { error } = await supabase
        .from("courses")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          thumbnail_url: form.thumbnail_url.trim() || null,
          is_published: form.is_published,
          community_id: communityId,
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
          title: "Curso creado",
          description: "El curso ha sido creado exitosamente.",
        });
        setDialogOpen(false);
        loadCourses();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (courseId: string) => {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el curso.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Curso eliminado",
        description: "El curso ha sido eliminado.",
      });
      loadCourses();
    }
  };

  const togglePublished = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ is_published: !course.is_published })
      .eq("id", course.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    } else {
      loadCourses();
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

  // Show modules manager if a course is selected
  if (managingModules) {
    return (
      <CommunityModulesManager
        courseId={managingModules.id}
        courseTitle={managingModules.title}
        onBack={() => setManagingModules(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Cursos de la Comunidad
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Editar Curso" : "Nuevo Curso"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Título *</Label>
                <Input
                  id="course-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Introducción a React"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-description">Descripción</Label>
                <Textarea
                  id="course-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe el contenido del curso..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-thumbnail">URL de imagen</Label>
                <Input
                  id="course-thumbnail"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="course-published">Publicar curso</Label>
                <Switch
                  id="course-published"
                  checked={form.is_published}
                  onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Guardando..." : editingCourse ? "Guardar cambios" : "Crear curso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay cursos en esta comunidad.</p>
            <p className="text-sm">Crea tu primer curso para tus miembros.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="h-10 w-14 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{course.title}</p>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Publicado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setManagingModules(course)}
                        title="Gestionar módulos"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublished(course)}
                        title={course.is_published ? "Ocultar" : "Publicar"}
                      >
                        {course.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(course)}
                        title="Editar curso"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará el curso "{course.title}" y todos sus módulos permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(course.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}