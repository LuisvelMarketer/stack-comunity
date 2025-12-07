import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Bell, Loader2 } from "lucide-react";

interface BroadcastNotificationProps {
  communityId: string;
  communityName: string;
}

export function BroadcastNotification({ communityId, communityName }: BroadcastNotificationProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
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

      toast({
        title: "Notificación enviada",
        description: `Se envió la notificación a ${members.length} miembro(s).`,
      });

      // Clear form
      setTitle("");
      setContent("");
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
  );
}
