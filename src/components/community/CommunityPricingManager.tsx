import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Loader2 } from "lucide-react";

interface CommunityPricingManagerProps {
  communityId: string;
  currentPrice: number;
  isPaid: boolean;
  stripePriceId: string | null;
  onUpdate: () => void;
}

export const CommunityPricingManager = ({
  communityId,
  currentPrice,
  isPaid,
  stripePriceId,
  onUpdate,
}: CommunityPricingManagerProps) => {
  const [price, setPrice] = useState(currentPrice || 0);
  const [enabled, setEnabled] = useState(isPaid);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      // For now, just update the local database
      // In production, you would create the Stripe product/price here
      const { error } = await supabase
        .from("communities")
        .update({
          price_monthly: price,
          is_paid: enabled && price > 0,
        })
        .eq("id", communityId);

      if (error) throw error;

      toast({
        title: "Precio actualizado",
        description: enabled && price > 0
          ? `Membresía establecida en $${price}/mes`
          : "Comunidad configurada como gratuita",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuración de Membresía
        </CardTitle>
        <CardDescription>
          Establece el precio mensual para acceder a tu comunidad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Comunidad de pago</Label>
            <p className="text-sm text-muted-foreground">
              Activa para cobrar membresía mensual
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="price">Precio mensual (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">$</span>
              <Input
                id="price"
                type="number"
                min="1"
                max="999"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-muted-foreground">/mes</span>
            </div>
          </div>
        )}

        {!stripePriceId && enabled && price > 0 && (
          <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            Para activar pagos, necesitas configurar el producto en Stripe y añadir el Price ID.
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar configuración
        </Button>
      </CardContent>
    </Card>
  );
};
