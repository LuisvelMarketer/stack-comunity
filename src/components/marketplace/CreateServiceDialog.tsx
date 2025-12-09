import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingService?: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    delivery_days: number;
    skills: string[];
    portfolio_urls: string[];
  } | null;
}

export function CreateServiceDialog({
  open,
  onOpenChange,
  onSuccess,
  editingService,
}: CreateServiceDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editingService?.title || "",
    description: editingService?.description || "",
    category: editingService?.category || "mvp",
    price: editingService?.price?.toString() || "",
    delivery_days: editingService?.delivery_days?.toString() || "7",
    skills: editingService?.skills || [] as string[],
    portfolio_urls: editingService?.portfolio_urls || [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleAddUrl = () => {
    if (newUrl.trim() && !formData.portfolio_urls.includes(newUrl.trim())) {
      setFormData({
        ...formData,
        portfolio_urls: [...formData.portfolio_urls, newUrl.trim()],
      });
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (url: string) => {
    setFormData({
      ...formData,
      portfolio_urls: formData.portfolio_urls.filter((u) => u !== url),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title || !formData.description || !formData.price) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        delivery_days: parseInt(formData.delivery_days),
        skills: formData.skills,
        portfolio_urls: formData.portfolio_urls,
      };

      if (editingService) {
        const { error } = await supabase
          .from("student_services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        toast.success("Servicio actualizado");
      } else {
        const { error } = await supabase
          .from("student_services")
          .insert(serviceData);

        if (error) throw error;
        toast.success("Servicio publicado");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast.error(error.message || "Error al guardar el servicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Editar Servicio" : "Ofrecer un Servicio"}
          </DialogTitle>
          <DialogDescription>
            Describe lo que puedes crear para otros estudiantes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del servicio *</Label>
            <Input
              id="title"
              placeholder="Ej: Creo tu MVP con Lovable en 7 días"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              placeholder="Describe qué incluye tu servicio, tu experiencia, y qué puede esperar el cliente..."
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mvp">MVP / App</SelectItem>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="automation">Automatización</SelectItem>
                  <SelectItem value="design">Diseño UI/UX</SelectItem>
                  <SelectItem value="other">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio (USD) *</Label>
              <Input
                id="price"
                type="number"
                min="1"
                placeholder="50"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_days">Tiempo de entrega (días)</Label>
            <Input
              id="delivery_days"
              type="number"
              min="1"
              value={formData.delivery_days}
              onChange={(e) =>
                setFormData({ ...formData, delivery_days: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Habilidades</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Añadir habilidad..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" variant="outline" onClick={handleAddSkill}>
                Añadir
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Portfolio URLs</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
              />
              <Button type="button" variant="outline" onClick={handleAddUrl}>
                Añadir
              </Button>
            </div>
            {formData.portfolio_urls.length > 0 && (
              <div className="space-y-1 mt-2">
                {formData.portfolio_urls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="truncate flex-1">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(url)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Guardando..."
              : editingService
              ? "Actualizar Servicio"
              : "Publicar Servicio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
