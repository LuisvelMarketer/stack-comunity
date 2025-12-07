import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, Plus, Trash2, Loader2, Star, Award, Medal, Target, Zap } from "lucide-react";

interface AchievementsManagerProps {
  courseId: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  module_id: string | null;
  achievement_type: string;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

const ICON_OPTIONS = [
  { value: "trophy", label: "Trofeo", icon: Trophy },
  { value: "star", label: "Estrella", icon: Star },
  { value: "award", label: "Premio", icon: Award },
  { value: "medal", label: "Medalla", icon: Medal },
  { value: "target", label: "Objetivo", icon: Target },
  { value: "zap", label: "Rayo", icon: Zap },
];

const getIconComponent = (iconName: string) => {
  const iconOption = ICON_OPTIONS.find((o) => o.value === iconName);
  return iconOption ? iconOption.icon : Trophy;
};

export function AchievementsManager({ courseId }: AchievementsManagerProps) {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "trophy",
    points: 10,
    moduleId: "",
    achievementType: "module_complete",
  });

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);

    // Load achievements
    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (achievementsData) {
      setAchievements(achievementsData);
    }

    // Load modules
    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesData) {
      setModules(modulesData);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Completa el nombre y descripción del logro.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("achievements").insert({
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon,
      points: form.points,
      course_id: courseId,
      module_id: form.achievementType === "module_complete" && form.moduleId ? form.moduleId : null,
      achievement_type: form.achievementType,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el logro.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logro creado",
        description: "El logro se creó correctamente.",
      });
      setForm({
        name: "",
        description: "",
        icon: "trophy",
        points: 10,
        moduleId: "",
        achievementType: "module_complete",
      });
      setDialogOpen(false);
      loadData();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("achievements").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el logro.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logro eliminado",
        description: "El logro se eliminó correctamente.",
      });
      loadData();
    }
  };

  const getModuleName = (moduleId: string | null) => {
    if (!moduleId) return null;
    const module = modules.find((m) => m.id === moduleId);
    return module ? module.title : "Módulo eliminado";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Logros del Curso
            </CardTitle>
            <CardDescription>
              Define logros que los estudiantes desbloquearán al completar módulos
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Logro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Logro</DialogTitle>
                <DialogDescription>
                  Define un logro que los estudiantes podrán desbloquear
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre del logro</Label>
                  <Input
                    placeholder="Ej: Primer paso"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Ej: Completaste tu primer módulo"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icono</Label>
                    <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Puntos</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={form.points}
                      onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de logro</Label>
                  <Select
                    value={form.achievementType}
                    onValueChange={(v) => setForm({ ...form, achievementType: v, moduleId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="module_complete">Completar módulo específico</SelectItem>
                      <SelectItem value="course_complete">Completar todo el curso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.achievementType === "module_complete" && (
                  <div className="space-y-2">
                    <Label>Módulo requerido</Label>
                    <Select value={form.moduleId} onValueChange={(v) => setForm({ ...form, moduleId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.order_index + 1}. {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Logro"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay logros definidos para este curso. Crea uno para motivar a tus estudiantes.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements.map((achievement) => {
              const IconComponent = getIconComponent(achievement.icon);
              return (
                <div
                  key={achievement.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium truncate">{achievement.name}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(achievement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {achievement.points} pts
                      </span>
                      <span>
                        {achievement.achievement_type === "course_complete"
                          ? "Al completar el curso"
                          : `Al completar: ${getModuleName(achievement.module_id)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
