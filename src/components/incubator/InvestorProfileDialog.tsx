import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface InvestorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    user_id: string;
    bio: string | null;
    investment_range_min: number;
    investment_range_max: number;
    interests: string[];
    linkedin_url?: string | null;
  } | null;
  onSuccess: () => void;
}

export function InvestorProfileDialog({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: InvestorProfileDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    investment_range_min: 100,
    investment_range_max: 5000,
    interests: [] as string[],
    linkedin_url: "",
  });
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || "",
        investment_range_min: profile.investment_range_min,
        investment_range_max: profile.investment_range_max,
        interests: profile.interests || [],
        linkedin_url: profile.linkedin_url || "",
      });
    } else {
      setForm({
        bio: "",
        investment_range_min: 100,
        investment_range_max: 5000,
        interests: [],
        linkedin_url: "",
      });
    }
  }, [profile, open]);

  const handleAddInterest = () => {
    if (newInterest.trim() && !form.interests.includes(newInterest.trim())) {
      setForm((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (profile) {
        const { error } = await supabase
          .from("investor_profiles")
          .update({
            bio: form.bio.trim() || null,
            investment_range_min: form.investment_range_min,
            investment_range_max: form.investment_range_max,
            interests: form.interests,
            linkedin_url: form.linkedin_url.trim() || null,
          })
          .eq("id", profile.id);

        if (error) throw error;
        toast.success("Perfil de inversor actualizado");
      } else {
        const { error } = await supabase.from("investor_profiles").insert({
          user_id: user.id,
          bio: form.bio.trim() || null,
          investment_range_min: form.investment_range_min,
          investment_range_max: form.investment_range_max,
          interests: form.interests,
          linkedin_url: form.linkedin_url.trim() || null,
        });

        if (error) throw error;
        toast.success("¡Ahora eres un inversor!");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {profile ? "Editar Perfil de Inversor" : "Convertirse en Inversor"}
          </DialogTitle>
          <DialogDescription>
            {profile
              ? "Actualiza tu perfil para que los fundadores sepan más sobre ti."
              : "Crea tu perfil de inversor para empezar a explorar oportunidades."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bio / Experiencia</Label>
            <Textarea
              placeholder="Cuéntanos sobre tu experiencia e intereses de inversión..."
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inversión mínima ($)</Label>
              <Input
                type="number"
                min={0}
                value={form.investment_range_min}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    investment_range_min: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Inversión máxima ($)</Label>
              <Input
                type="number"
                min={0}
                value={form.investment_range_max}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    investment_range_max: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>LinkedIn (opcional)</Label>
            <Input
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={form.linkedin_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, linkedin_url: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Sectores de interés</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: SaaS, EdTech, FinTech..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={handleAddInterest}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="gap-1">
                    {interest}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : profile ? "Guardar cambios" : "Crear perfil"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}