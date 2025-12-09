import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface ExpressInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    build_project?: {
      title: string;
    } | null;
    funding_goal: number;
    equity_offered: number | null;
  };
  investorId: string;
  onSuccess: () => void;
}

export function ExpressInterestDialog({
  open,
  onOpenChange,
  project,
  investorId,
  onSuccess,
}: ExpressInterestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    message: "",
  });

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("investment_interests").insert({
        incubator_project_id: project.id,
        investor_id: investorId,
        amount: Number(form.amount),
        message: form.message.trim() || null,
        status: "interested",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya has expresado interés en este proyecto");
        } else {
          throw error;
        }
      } else {
        toast.success("¡Interés registrado! El fundador será notificado.");
        setForm({ amount: "", message: "" });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al expresar interés");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expresar Interés de Inversión</DialogTitle>
          <DialogDescription>
            Indica cuánto te gustaría invertir en{" "}
            <span className="font-medium">{project.build_project?.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meta de financiamiento:</span>
              <span className="font-medium">${project.funding_goal.toLocaleString()}</span>
            </div>
            {project.equity_offered && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equity ofrecido:</span>
                <span className="font-medium">{project.equity_offered}%</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Monto a invertir ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                placeholder="1000"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mensaje al fundador (opcional)</Label>
            <Textarea
              placeholder="Me interesa este proyecto porque..."
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Al expresar interés, el fundador recibirá una notificación y podrá contactarte
            para discutir los términos de la inversión.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "Expresar Interés"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}