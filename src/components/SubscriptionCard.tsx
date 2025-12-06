import { Crown, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription, PREMIUM_PRODUCT } from '@/hooks/useSubscription';
import { PremiumBadge } from './PremiumBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function SubscriptionCard() {
  const { isPremium, subscriptionEnd, loading, createCheckout, openCustomerPortal } = useSubscription();

  const handleUpgrade = async () => {
    try {
      await createCheckout();
    } catch (error) {
      toast.error('Error al iniciar el proceso de pago');
    }
  };

  const handleManage = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error('Error al abrir el portal de gestión');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isPremium) {
    return (
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              {PREMIUM_PRODUCT.name}
            </CardTitle>
            <PremiumBadge />
          </div>
          <CardDescription>
            Tu suscripción está activa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionEnd && (
            <p className="text-sm text-muted-foreground">
              Próxima renovación: {format(new Date(subscriptionEnd), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          )}
          <Button variant="outline" onClick={handleManage} className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Gestionar suscripción
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          {PREMIUM_PRODUCT.name}
        </CardTitle>
        <CardDescription>
          Desbloquea todo el contenido premium
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${PREMIUM_PRODUCT.price}</span>
          <span className="text-muted-foreground">/mes</span>
        </div>
        
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Acceso completo a todos los cursos
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Módulos y lecciones exclusivas
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Certificados de finalización
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Soporte prioritario
          </li>
        </ul>

        <Button 
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Crown className="h-4 w-4 mr-2" />
          Suscribirse ahora
        </Button>
      </CardContent>
    </Card>
  );
}
