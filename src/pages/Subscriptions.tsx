import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, CreditCard, ExternalLink, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface CommunitySubscription {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  community: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    price_monthly: number | null;
  };
}

export default function Subscriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<CommunitySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingId, setManagingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("community_subscriptions")
        .select(`
          id,
          status,
          current_period_end,
          cancel_at_period_end,
          community:communities(id, name, slug, image_url, price_monthly)
        `)
        .eq("user_id", user?.id)
        .in("status", ["active", "trialing", "past_due"]);

      if (error) throw error;

      // Transform data to handle the community object properly
      const transformedData = (data || []).map(sub => ({
        ...sub,
        community: Array.isArray(sub.community) ? sub.community[0] : sub.community
      })).filter(sub => sub.community);

      setSubscriptions(transformedData);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Error al cargar las suscripciones");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async (subscriptionId: string) => {
    setManagingId(subscriptionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Error al abrir el portal de gestión");
    } finally {
      setManagingId(null);
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean | null) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="secondary">Se cancela al final del período</Badge>;
    }
    
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Activa</Badge>;
      case "trialing":
        return <Badge variant="secondary">Período de prueba</Badge>;
      case "past_due":
        return <Badge variant="destructive">Pago pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Mis Suscripciones</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tus membresías a comunidades
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No tienes suscripciones activas</CardTitle>
              <CardDescription>
                Explora comunidades y suscríbete para acceder a contenido exclusivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/communities")}>
                <Users className="mr-2 h-4 w-4" />
                Explorar Comunidades
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-lg">
                        {subscription.community.image_url && (
                          <AvatarImage 
                            src={subscription.community.image_url} 
                            alt={subscription.community.name}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                          {subscription.community.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {subscription.community.name}
                        </CardTitle>
                        <CardDescription>
                          ${subscription.community.price_monthly}/mes
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.current_period_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {subscription.cancel_at_period_end ? "Acceso hasta" : "Próxima renovación"}:{" "}
                        {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/communities/${subscription.community.slug}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Comunidad
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleManageSubscription(subscription.id)}
                      disabled={managingId === subscription.id}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {managingId === subscription.id ? "Cargando..." : "Gestionar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
