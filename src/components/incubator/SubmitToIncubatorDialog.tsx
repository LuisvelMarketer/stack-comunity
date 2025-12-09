import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

interface SubmitToIncubatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProjects: {
    id: string;
    title: string;
    description: string | null;
  }[];
  onSuccess: () => void;
}

export function SubmitToIncubatorDialog({
  open,
  onOpenChange,
  availableProjects,
  onSuccess,
}: SubmitToIncubatorDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    project_id: "",
    pitch: "",
    funding_goal: "",
    equity_offered: "",
    business_model: "",
    target_market: "",
    team_size: "1",
    video_pitch_url: "",
    deck_url: "",
  });

  const handleSubmit = async () => {
    if (!user) return;

    if (!form.project_id) {
      toast.error("Por favor selecciona un proyecto");
      return;
    }
    if (!form.pitch.trim()) {
      toast.error("Por favor escribe un pitch");
      return;
    }
    if (!form.funding_goal || Number(form.funding_goal) <= 0) {
      toast.error("Por favor ingresa una meta de financiamiento válida");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("incubator_projects").insert({
        user_id: user.id,
        project_id: form.project_id,
        pitch: form.pitch.trim(),
        funding_goal: Number(form.funding_goal),
        equity_offered: form.equity_offered ? Number(form.equity_offered) : null,
        business_model: form.business_model.trim() || null,
        target_market: form.target_market.trim() || null,
        team_size: Number(form.team_size) || 1,
        video_pitch_url: form.video_pitch_url.trim() || null,
        deck_url: form.deck_url.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("¡Proyecto enviado! Será revisado por el equipo.");
      setForm({
        project_id: "",
        pitch: "",
        funding_goal: "",
        equity_offered: "",
        business_model: "",
        target_market: "",
        team_size: "1",
        video_pitch_url: "",
        deck_url: "",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Enviar Proyecto a la Incubadora
          </DialogTitle>
          <DialogDescription>
            Completa la información para que los inversores puedan conocer tu proyecto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Proyecto *</Label>
            <Select
              value={form.project_id}
              onValueChange={(value) => setForm((prev) => ({ ...prev, project_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pitch (máx. 500 caracteres) *</Label>
            <Textarea
              placeholder="Describe tu proyecto y por qué es una buena inversión..."
              value={form.pitch}
              onChange={(e) => setForm((prev) => ({ ...prev, pitch: e.target.value }))}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.pitch.length}/500
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meta de financiamiento ($) *</Label>
              <Input
                type="number"
                min={1}
                placeholder="5000"
                value={form.funding_goal}
                onChange={(e) => setForm((prev) => ({ ...prev, funding_goal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Equity a ofrecer (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="10"
                value={form.equity_offered}
                onChange={(e) => setForm((prev) => ({ ...prev, equity_offered: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mercado objetivo</Label>
            <Input
              placeholder="Ej: Startups en Latinoamérica, Estudiantes universitarios..."
              value={form.target_market}
              onChange={(e) => setForm((prev) => ({ ...prev, target_market: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Modelo de negocio</Label>
            <Textarea
              placeholder="¿Cómo planeas generar ingresos?"
              value={form.business_model}
              onChange={(e) => setForm((prev) => ({ ...prev, business_model: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tamaño del equipo</Label>
              <Input
                type="number"
                min={1}
                value={form.team_size}
                onChange={(e) => setForm((prev) => ({ ...prev, team_size: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Video pitch (URL)</Label>
              <Input
                type="url"
                placeholder="https://youtube.com/..."
                value={form.video_pitch_url}
                onChange={(e) => setForm((prev) => ({ ...prev, video_pitch_url: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deck de presentación (URL)</Label>
            <Input
              type="url"
              placeholder="https://drive.google.com/..."
              value={form.deck_url}
              onChange={(e) => setForm((prev) => ({ ...prev, deck_url: e.target.value }))}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Tu proyecto será revisado antes de ser publicado en la incubadora.
            Este proceso puede tomar hasta 48 horas.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "Enviar a revisión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}