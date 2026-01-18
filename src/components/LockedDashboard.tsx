import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Calendar, CreditCard, Check, Star, Zap, BookOpen, Users, Award, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const features = [
  "Acceso completo a todos los módulos",
  "Mentoría personalizada 1:1",
  "Garantía de lanzamiento de tu app",
  "Comunidad exclusiva de alumnos",
  "Soporte prioritario por chat",
  "Recursos descargables premium",
  "Certificación con peso real",
  "Acceso de por vida"
];

export const LockedDashboard = () => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingCalendly, setLoadingCalendly] = useState(false);

  const handleCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión para continuar");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-codigo-cero-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Error al procesar el pago. Intenta de nuevo.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleScheduleCall = async () => {
    setLoadingCalendly(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-calendly-link");
      
      if (error) throw error;
      
      if (data?.calendlyLink) {
        window.open(data.calendlyLink, "_blank");
      } else {
        toast.error("No se pudo obtener el enlace de Calendly");
      }
    } catch (error) {
      console.error("Error getting Calendly link:", error);
      toast.error("Error al obtener el enlace. Intenta de nuevo.");
    } finally {
      setLoadingCalendly(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Lock className="w-3 h-3 mr-1" />
            Acceso Exclusivo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Código Cero
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La mentoría intensiva para crear tu aplicación profesional sin experiencia previa en programación
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          
          <CardHeader className="relative text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Más de 100 estudiantes han lanzado su app
            </p>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Price */}
            <div className="text-center py-6 border-y border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Inversión única</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-bold text-foreground">$3,500</span>
                <span className="text-xl text-muted-foreground">USD</span>
              </div>
              <p className="text-sm text-primary mt-2">Acceso de por vida • Sin pagos mensuales</p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4 pt-4">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                onClick={handleCheckout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  "Procesando..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Comprar Ahora - $3,500 USD
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">o</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button 
                size="lg" 
                variant="outline"
                className="w-full h-14 text-lg border-primary/50 hover:bg-primary/10"
                onClick={handleScheduleCall}
                disabled={loadingCalendly}
              >
                {loadingCalendly ? (
                  "Cargando..."
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Agendar Llamada de Consulta
                  </>
                )}
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                ¿Tienes dudas? Agenda una llamada gratuita de 30 minutos para resolver todas tus preguntas
              </p>
            </div>

            {/* Guarantee */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <Award className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-400">Garantía de Lanzamiento</p>
                <p className="text-sm text-muted-foreground">
                  Si no lanzas tu app, te devolvemos el dinero + 3 sesiones 1:1 gratis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 rounded-lg bg-card/30 border border-border/50">
            <Rocket className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs text-muted-foreground">Módulos</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-card/30 border border-border/50">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">35+</div>
            <div className="text-xs text-muted-foreground">Lecciones</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-card/30 border border-border/50">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">100+</div>
            <div className="text-xs text-muted-foreground">Graduados</div>
          </div>
        </div>
      </div>
    </div>
  );
};
