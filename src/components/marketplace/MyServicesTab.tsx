import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star, Clock, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { CreateServiceDialog } from "./CreateServiceDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyServicesTabProps {
  onRefresh: () => void;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_days: number;
  skills: string[];
  portfolio_urls: string[];
  is_active: boolean;
  orders_completed: number;
  rating_average: number;
  rating_count: number;
}

export function MyServicesTab({ onRefresh }: MyServicesTabProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyServices();
    }
  }, [user]);

  const loadMyServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("student_services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices((data as any) || []);
    } catch (error) {
      console.error("Error loading my services:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("student_services")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentState ? "Servicio desactivado" : "Servicio activado");
      loadMyServices();
      onRefresh();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("student_services")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Servicio eliminado");
      setDeletingId(null);
      loadMyServices();
      onRefresh();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const categoryLabels: Record<string, string> = {
    mvp: "MVP / App",
    landing: "Landing Page",
    automation: "Automatización",
    design: "Diseño UI/UX",
    other: "Otros",
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mis Servicios</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No tienes servicios publicados
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              Crear mi primer servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base">{service.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabels[service.category]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() =>
                        toggleActive(service.id, service.is_active)
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {service.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">${service.price} USD</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.delivery_days}d
                  </span>
                  {service.rating_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {service.rating_average}
                    </span>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {service.orders_completed} pedidos completados
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingService(service)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(service.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateServiceDialog
        open={isCreateOpen || !!editingService}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingService(null);
        }}
        onSuccess={() => {
          loadMyServices();
          onRefresh();
        }}
        editingService={editingService}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
