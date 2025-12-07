import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Bell, Loader2, History, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BroadcastNotificationProps {
  communityId: string;
  communityName: string;
}

interface BroadcastHistory {
  id: string;
  title: string;
  content: string;
  recipients_count: number;
  created_at: string;
}

export function BroadcastNotification({ communityId, communityName }: BroadcastNotificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [communityId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("broadcast_notifications")
      .select("id, title, content, recipients_count, created_at")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setHistory(data);
    }
    setLoadingHistory(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim() || !user) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el título y el contenido.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      // Get all member user_ids except the owner
      const { data: members, error: membersError } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", communityId)
        .eq("is_owner", false);

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        toast({
          title: "Sin miembros",
          description: "No hay miembros a quienes enviar la notificación.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Create notifications for all members
      const notifications = members.map((member) => ({
        user_id: member.user_id,
        type: "community_broadcast",
        title: `${communityName}: ${title}`,
        content: content,
        link: `/community/${communityId}`,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) throw insertError;

      // Save to broadcast history
      await supabase
        .from("broadcast_notifications")
        .insert({
          community_id: communityId,
          sender_id: user.id,
          title: title,
          content: content,
          recipients_count: members.length,
        });

      toast({
        title: "Notificación enviada",
        description: `Se envió la notificación a ${members.length} miembro(s).`,
      });

      // Clear form and reload history
      setTitle("");
      setContent("");
      loadHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la notificación.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enviar Notificación Masiva
          </CardTitle>
          <CardDescription>
            Envía una notificación a todos los miembros de tu comunidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">Título</Label>
            <Input
              id="notification-title"
              placeholder="Ej: Nueva clase disponible"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-content">Mensaje</Label>
            <Textarea
              id="notification-content"
              placeholder="Escribe el contenido de la notificación..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/500 caracteres
            </p>
          </div>
          <Button 
            onClick={handleSend} 
            disabled={sending || !title.trim() || !content.trim()}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? "Enviando..." : "Enviar a todos los miembros"}
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Notificaciones
          </CardTitle>
          <CardDescription>
            Últimas 20 notificaciones enviadas a tu comunidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aún no has enviado ninguna notificación.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((broadcast) => (
                <div 
                  key={broadcast.id} 
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-medium">{broadcast.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(broadcast.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{broadcast.content}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>Enviado a {broadcast.recipients_count} miembro(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
