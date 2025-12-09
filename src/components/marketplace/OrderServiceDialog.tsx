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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addDays } from "date-fns";

interface OrderServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    user_id: string;
    title: string;
    price: number;
    delivery_days: number;
    profiles?: {
      full_name: string | null;
    };
  };
  onSuccess: () => void;
}

const PLATFORM_FEE_PERCENT = 10;

export function OrderServiceDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: OrderServiceDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState("");

  const platformFee = service.price * (PLATFORM_FEE_PERCENT / 100);
  const sellerEarnings = service.price - platformFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para contratar");
      return;
    }

    if (!requirements.trim()) {
      toast.error("Describe lo que necesitas");
      return;
    }

    setLoading(true);
    try {
      const deliveryDeadline = addDays(new Date(), service.delivery_days);

      const { error } = await supabase.from("service_orders").insert({
        service_id: service.id,
        buyer_id: user.id,
        seller_id: service.user_id,
        title: service.title,
        requirements: requirements.trim(),
        price: service.price,
        platform_fee: platformFee,
        seller_earnings: sellerEarnings,
        status: "pending",
        delivery_deadline: deliveryDeadline.toISOString(),
      });

      if (error) throw error;

      toast.success("Pedido enviado al vendedor");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contratar Servicio</DialogTitle>
          <DialogDescription>
            {service.title} por {service.profiles?.full_name || "Vendedor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Precio del servicio</span>
              <span className="font-medium">${service.price} USD</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Comisión plataforma ({PLATFORM_FEE_PERCENT}%)</span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Gana el vendedor</span>
              <span>${sellerEarnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tiempo de entrega</span>
              <span>{service.delivery_days} días</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">
              Describe tu proyecto y requisitos *
            </Label>
            <Textarea
              id="requirements"
              placeholder="Cuéntale al vendedor qué necesitas exactamente. Incluye detalles como funcionalidades, diseño, referencias, etc."
              rows={5}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Al enviar este pedido, el vendedor recibirá una notificación y podrá
            aceptar o rechazar. El pago se procesará cuando el trabajo esté
            completado.
          </p>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
