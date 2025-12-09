import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, Send, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

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
  created_at: string;
}

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onStatusChange: (orderId: string, status: string) => void;
  onRefresh: () => void;
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  onStatusChange,
  onRefresh,
}: OrderDetailDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const isSeller = user?.id === order?.seller_id;
  const isBuyer = user?.id === order?.buyer_id;

  useEffect(() => {
    if (open && order) {
      loadMessages();
      checkReview();
    }
  }, [open, order]);

  const loadMessages = async () => {
    if (!order) return;

    const { data, error } = await supabase
      .from("service_order_messages")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages((data as any) || []);
    }
  };

  const checkReview = async () => {
    if (!order || !user) return;

    const { data } = await supabase
      .from("service_reviews")
      .select("id")
      .eq("order_id", order.id)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    setHasReviewed(!!data);
  };

  const sendMessage = async () => {
    if (!order || !user || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from("service_order_messages").insert({
        order_id: order.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
      loadMessages();
    } catch (error) {
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const submitReview = async () => {
    if (!order || !user || rating === 0) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("service_reviews").insert({
        order_id: order.id,
        service_id: order.service_id,
        reviewer_id: user.id,
        rating,
        comment: reviewComment.trim() || null,
      });

      if (error) throw error;
      toast.success("¡Gracias por tu valoración!");
      setHasReviewed(true);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Error al enviar valoración");
    } finally {
      setSubmittingReview(false);
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

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg">{order.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Pedido #{order.id.slice(0, 8)}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Order Details */}
          <div className="p-4 bg-muted rounded-lg mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio</span>
              <span className="font-medium">${order.price} USD</span>
            </div>
            {order.delivery_deadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrega estimada</span>
                <span>
                  {format(new Date(order.delivery_deadline), "d MMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Requisitos</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {order.requirements}
            </p>
          </div>

          <Separator className="my-4" />

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h4 className="text-sm font-medium mb-2">Mensajes</h4>
            <ScrollArea className="flex-1 max-h-48 mb-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay mensajes aún
                </p>
              ) : (
                <div className="space-y-3 pr-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.sender_id === user?.id ? "flex-row-reverse" : ""
                      }`}
                    >
                      <UserAvatar 
                        src={null} 
                        fallback="U" 
                        size="sm" 
                        showLevel={false}
                      />
                      <div
                        className={`max-w-[70%] rounded-lg p-2 text-sm ${
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Review Section (for completed orders, buyer only) */}
          {order.status === "completed" && isBuyer && !hasReviewed && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Deja una valoración</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Comentario opcional..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={submitReview}
                  disabled={rating === 0 || submittingReview}
                >
                  Enviar Valoración
                </Button>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {isSeller && order.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onStatusChange(order.id, "rejected")}
                >
                  Rechazar
                </Button>
                <Button onClick={() => onStatusChange(order.id, "in_progress")}>
                  Aceptar Pedido
                </Button>
              </>
            )}
            {isSeller && order.status === "in_progress" && (
              <Button onClick={() => onStatusChange(order.id, "delivered")}>
                Marcar como Entregado
              </Button>
            )}
            {isBuyer && order.status === "delivered" && (
              <Button onClick={() => onStatusChange(order.id, "completed")}>
                Confirmar Entrega
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
