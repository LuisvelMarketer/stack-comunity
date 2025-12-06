import { Lock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription, PREMIUM_PRODUCT } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface LockedContentProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function LockedContent({ 
  title = "Contenido Premium",
  description = "Este contenido está disponible exclusivamente para miembros Premium.",
  children 
}: LockedContentProps) {
  const { createCheckout, loading } = useSubscription();

  const handleUpgrade = async () => {
    try {
      await createCheckout();
    } catch (error) {
      toast.error('Error al iniciar el proceso de pago');
    }
  };

  return (
    <Card className="border-dashed border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse" />
          <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-full">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>

        {children}

        <div className="bg-card/50 rounded-lg p-4 mb-6 w-full max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{PREMIUM_PRODUCT.name}</span>
            <span className="text-2xl font-bold text-amber-500">
              ${PREMIUM_PRODUCT.price}
              <span className="text-sm text-muted-foreground">/mes</span>
            </span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Acceso a todos los cursos
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Módulos exclusivos
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Certificados verificables
            </li>
          </ul>
        </div>

        <Button 
          onClick={handleUpgrade}
          disabled={loading}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Crown className="h-4 w-4 mr-2" />
          Desbloquear con Premium
        </Button>
      </CardContent>
    </Card>
  );
}
