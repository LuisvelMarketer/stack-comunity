import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Send, Bell, Loader2, History, Users, Filter, Clock, Calendar } from "lucide-react";
import { format, subDays, subMonths, addMinutes } from "date-fns";
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
  scheduled_at: string | null;
  status: string;
}

export function BroadcastNotification({ communityId, communityName }: BroadcastNotificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Segmentation filters
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [joinDateFilter, setJoinDateFilter] = useState<string>("all");
  const [estimatedRecipients, setEstimatedRecipients] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    loadHistory();
  }, [communityId]);

  useEffect(() => {
    estimateRecipients();
  }, [levelFilter, joinDateFilter, communityId]);

  // Set default date/time when scheduling is enabled
  useEffect(() => {
    if (isScheduled && !scheduledDate) {
      const tomorrow = addMinutes(new Date(), 60);
      setScheduledDate(format(tomorrow, "yyyy-MM-dd"));
      setScheduledTime(format(tomorrow, "HH:mm"));
    }
  }, [isScheduled]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("broadcast_notifications")
      .select("id, title, content, recipients_count, created_at, scheduled_at, status")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setHistory(data);
    }
    setLoadingHistory(false);
  };

  const getFilteredMembers = async () => {
    const { data: members, error: membersError } = await supabase
      .from("community_members")
      .select("user_id, joined_at")
      .eq("community_id", communityId)
      .eq("is_owner", false);

    if (membersError || !members) return [];

    let filteredMembers = members;

    if (joinDateFilter !== "all") {
      const now = new Date();
      let cutoffDate: Date;

      switch (joinDateFilter) {
        case "7days":
          cutoffDate = subDays(now, 7);
          break;
        case "30days":
          cutoffDate = subDays(now, 30);
          break;
        case "3months":
          cutoffDate = subMonths(now, 3);
          break;
        case "6months":
          cutoffDate = subMonths(now, 6);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filteredMembers = filteredMembers.filter(
        (m) => new Date(m.joined_at) >= cutoffDate
      );
    }

    if (levelFilter !== "all") {
      const userIds = filteredMembers.map((m) => m.user_id);
      
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, level")
        .in("id", userIds);

      if (profiles) {
        const targetLevel = parseInt(levelFilter);
        const levelUserIds = new Set(
          profiles
            .filter((p) => p.level >= targetLevel)
            .map((p) => p.id)
        );
        filteredMembers = filteredMembers.filter((m) =>
          levelUserIds.has(m.user_id)
        );
      }
    }

    return filteredMembers;
  };

  const estimateRecipients = async () => {
    setLoadingEstimate(true);
    const members = await getFilteredMembers();
    setEstimatedRecipients(members.length);
    setLoadingEstimate(false);
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

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast({
        title: "Fecha requerida",
        description: "Por favor selecciona fecha y hora para programar.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      if (isScheduled) {
        // Save scheduled notification
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        
        const { error: insertError } = await supabase
          .from("broadcast_notifications")
          .insert({
            community_id: communityId,
            sender_id: user.id,
            title: title,
            content: content,
            recipients_count: estimatedRecipients || 0,
            status: "scheduled",
            scheduled_at: scheduledAt,
            level_filter: levelFilter,
            join_date_filter: joinDateFilter,
          });

        if (insertError) throw insertError;

        toast({
          title: "Notificación programada",
          description: `Se enviará el ${format(new Date(scheduledAt), "dd MMM yyyy 'a las' HH:mm", { locale: es })}.`,
        });
      } else {
        // Send immediately
        const filteredMembers = await getFilteredMembers();

        if (filteredMembers.length === 0) {
          toast({
            title: "Sin destinatarios",
            description: "No hay miembros que cumplan con los filtros seleccionados.",
            variant: "destructive",
          });
          setSending(false);
          return;
        }

        const notifications = filteredMembers.map((member) => ({
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

        await supabase
          .from("broadcast_notifications")
          .insert({
            community_id: communityId,
            sender_id: user.id,
            title: title,
            content: content,
            recipients_count: filteredMembers.length,
            status: "sent",
            level_filter: levelFilter,
            join_date_filter: joinDateFilter,
          });

        toast({
          title: "Notificación enviada",
          description: `Se envió la notificación a ${filteredMembers.length} miembro(s).`,
        });
      }

      // Clear form
      setTitle("");
      setContent("");
      setLevelFilter("all");
      setJoinDateFilter("all");
      setIsScheduled(false);
      setScheduledDate("");
      setScheduledTime("");
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

  const handleCancelScheduled = async (id: string) => {
    const { error } = await supabase
      .from("broadcast_notifications")
      .delete()
      .eq("id", id)
      .eq("status", "scheduled");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la notificación.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cancelada",
        description: "La notificación programada fue cancelada.",
      });
      loadHistory();
    }
  };

  const getStatusBadge = (status: string, scheduledAt: string | null) => {
    if (status === "scheduled" && scheduledAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          Programada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Enviada
      </span>
    );
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
            Envía una notificación a los miembros de tu comunidad
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

          {/* Segmentation Filters */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Segmentación (opcional)
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel mínimo</Label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="2">Nivel 2+</SelectItem>
                    <SelectItem value="3">Nivel 3+</SelectItem>
                    <SelectItem value="5">Nivel 5+</SelectItem>
                    <SelectItem value="10">Nivel 10+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de ingreso</Label>
                <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier fecha</SelectItem>
                    <SelectItem value="7days">Últimos 7 días</SelectItem>
                    <SelectItem value="30days">Últimos 30 días</SelectItem>
                    <SelectItem value="3months">Últimos 3 meses</SelectItem>
                    <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {loadingEstimate ? (
                <span>Calculando...</span>
              ) : (
                <span>
                  {estimatedRecipients === 0
                    ? "No hay destinatarios con estos filtros"
                    : `${estimatedRecipients} miembro(s) recibirán esta notificación`}
                </span>
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Programar envío
              </div>
              <Switch
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
              />
            </div>

            {isScheduled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSend} 
            disabled={sending || !title.trim() || !content.trim() || estimatedRecipients === 0}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isScheduled ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending 
              ? "Procesando..." 
              : isScheduled 
                ? "Programar notificación" 
                : `Enviar a ${estimatedRecipients || 0} miembro(s)`}
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
            Últimas 20 notificaciones enviadas o programadas
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{broadcast.title}</h4>
                      {getStatusBadge(broadcast.status, broadcast.scheduled_at)}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {broadcast.status === "scheduled" && broadcast.scheduled_at
                        ? `Programada: ${format(new Date(broadcast.scheduled_at), "dd MMM yyyy, HH:mm", { locale: es })}`
                        : format(new Date(broadcast.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{broadcast.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {broadcast.status === "scheduled" 
                          ? `Estimado: ${broadcast.recipients_count} miembro(s)`
                          : `Enviado a ${broadcast.recipients_count} miembro(s)`}
                      </span>
                    </div>
                    {broadcast.status === "scheduled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancelScheduled(broadcast.id)}
                      >
                        Cancelar
                      </Button>
                    )}
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
