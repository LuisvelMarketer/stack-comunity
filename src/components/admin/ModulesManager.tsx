import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  is_free: boolean;
  order_index: number;
  course?: { title: string };
}

interface Course {
  id: string;
  title: string;
}

export const ModulesManager = () => {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    content: "",
    video_url: "",
    is_free: false,
    order_index: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modulesRes, coursesRes] = await Promise.all([
        supabase.from("course_modules").select("*, course:courses(title)").order("order_index"),
        supabase.from("courses").select("id, title").order("title"),
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setModules(modulesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingModule) {
        const { error } = await supabase
          .from("course_modules")
          .update(formData)
          .eq("id", editingModule.id);

        if (error) throw error;
        toast({ title: "Módulo actualizado correctamente" });
      } else {
        const { error } = await supabase.from("course_modules").insert([formData]);
        if (error) throw error;
        toast({ title: "Módulo creado correctamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este módulo?")) return;

    try {
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Módulo eliminado correctamente" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      title: "",
      description: "",
      content: "",
      video_url: "",
      is_free: false,
      order_index: 0,
    });
    setEditingModule(null);
  };

  const openEditDialog = (module: Module) => {
    setEditingModule(module);
    setFormData({
      course_id: module.course_id,
      title: module.title,
      description: module.description || "",
      content: module.content || "",
      video_url: module.video_url || "",
      is_free: module.is_free,
      order_index: module.order_index,
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Módulos</CardTitle>
            <CardDescription>Administra los módulos de cada curso</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Módulo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingModule ? "Editar Módulo" : "Nuevo Módulo"}</DialogTitle>
                <DialogDescription>Completa los datos del módulo</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course_id">Curso *</Label>
                  <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contenido (Markdown)</Label>
                  <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6} placeholder="Usa markdown para formatear el contenido..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL del Video</Label>
                  <Input id="video_url" value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_index">Orden</Label>
                  <Input id="order_index" type="number" value={formData.order_index} onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_free" checked={formData.is_free} onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })} />
                  <Label htmlFor="is_free">Módulo Gratuito</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingModule ? "Actualizar" : "Crear"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : modules.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay módulos creados</p>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => (
              <Card key={module.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{module.course?.title}</span>
                        <span className="text-xs text-muted-foreground">Orden: {module.order_index}</span>
                        {module.is_free && <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600">Gratis</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(module)}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(module.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
