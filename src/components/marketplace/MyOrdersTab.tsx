import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { Clock, Check, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { OrderDetailDialog } from "./OrderDetailDialog";

interface Order {
  id: string;
  service_id: string;
  buyer_id: string;
  seller_id: string;
  title: string;
  requirements: string;
  price: number;
  platform_fee: number;
  seller_earnings: number;
  status: string;
  delivery_deadline: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  buyer_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  seller_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function MyOrdersTab() {
  const { user } = useAuth();
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      // Orders where I'm the buyer
      const { data: buying, error: buyingError } = await supabase
        .from("service_orders")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (buyingError) throw buyingError;

      // Orders where I'm the seller
      const { data: selling, error: sellingError } = await supabase
        .from("service_orders")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (sellingError) throw sellingError;

      // Get profiles for all orders
      const allUserIds = new Set([
        ...(buying || []).map((o) => o.seller_id),
        ...(selling || []).map((o) => o.buyer_id),
      ]);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", Array.from(allUserIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      setBuyerOrders(
        (buying || []).map((o) => ({
          ...o,
          seller_profile: profileMap.get(o.seller_id),
        })) as Order[]
      );

      setSellerOrders(
        (selling || []).map((o) => ({
          ...o,
          buyer_profile: profileMap.get(o.buyer_id),
        })) as Order[]
      );
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "in_progress") {
        // Nothing extra
      } else if (status === "delivered") {
        updates.delivered_at = new Date().toISOString();
      } else if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      } else if (status === "cancelled") {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("service_orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Estado actualizado");
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      in_progress: { variant: "default", label: "En progreso" },
      delivered: { variant: "outline", label: "Entregado" },
      completed: { variant: "default", label: "Completado" },
      cancelled: { variant: "destructive", label: "Cancelado" },
      rejected: { variant: "destructive", label: "Rechazado" },
    };
    const style = styles[status] || { variant: "secondary", label: status };
    return <Badge variant={style.variant}>{style.label}</Badge>;
  };

  const OrderCard = ({
    order,
    isSeller,
  }: {
    order: Order;
    isSeller: boolean;
  }) => {
    const otherUser = isSeller ? order.buyer_profile : order.seller_profile;
    const otherUserId = isSeller ? order.buyer_id : order.seller_id;

    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedOrder(order)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <UserAvatar 
              src={otherUser?.avatar_url} 
              fallback={otherUser?.full_name?.charAt(0) || "U"} 
              size="sm" 
              showLevel={false}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{order.title}</h4>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isSeller ? "Comprador" : "Vendedor"}:{" "}
                {otherUser?.full_name || "Usuario"}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  ${order.price} USD
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(order.created_at), "d MMM", { locale: es })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="buying">
        <TabsList>
          <TabsTrigger value="buying">
            Mis Compras ({buyerOrders.length})
          </TabsTrigger>
          <TabsTrigger value="selling">
            Mis Ventas ({sellerOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buying" className="mt-4 space-y-4">
          {buyerOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No has realizado ningún pedido
              </CardContent>
            </Card>
          ) : (
            buyerOrders.map((order) => (
              <OrderCard key={order.id} order={order} isSeller={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value="selling" className="mt-4 space-y-4">
          {sellerOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No has recibido ningún pedido
              </CardContent>
            </Card>
          ) : (
            sellerOrders.map((order) => (
              <OrderCard key={order.id} order={order} isSeller={true} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <OrderDetailDialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        order={selectedOrder}
        onStatusChange={updateOrderStatus}
        onRefresh={loadOrders}
      />
    </div>
  );
}
