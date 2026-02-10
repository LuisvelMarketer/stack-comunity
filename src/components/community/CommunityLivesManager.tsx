import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, Video, Play, Square, Clock } from "lucide-react";

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  stream_url: string;
  platform: string;
  status: string;
  thumbnail_url: string | null;
  community_id: string;
  created_by: string;
  started_at: string | null;
  ended_at: string | null;
}

interface CommunityLivesManagerProps {
  communityId: string;
}

export function CommunityLivesManager({ communityId }: CommunityLivesManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLive, setEditingLive] = useState<LiveSession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    stream_url: "",
    platform: "youtube",
    thumbnail_url: "",
  });

  const queryKey = ["community-lives", communityId];

  const { data: lives, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("community_id", communityId)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as LiveSession[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { error } = await supabase.from("live_sessions").insert({
        title: data.title.trim(),
        description: data.description.trim() || null,
        scheduled_at: data.scheduled_at,
        stream_url: data.stream_url.trim(),
        platform: data.platform,
        thumbnail_url: data.thumbnail_url.trim() || null,
        community_id: communityId,
        created_by: userData.user.id,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Sesión en vivo creada correctamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al crear sesión: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("live_sessions")
        .update({
          title: data.title.trim(),
          description: data.description.trim() || null,
          scheduled_at: data.scheduled_at,
          stream_url: data.stream_url.trim(),
          platform: data.platform,
          thumbnail_url: data.thumbnail_url.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Sesión actualizada correctamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al actualizar sesión: " + error.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "live") updates.started_at = new Date().toISOString();
      else if (status === "ended") updates.ended_at = new Date().toISOString();

      const { error } = await supabase.from("live_sessions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Estado actualizado");
    },
    onError: (error) => toast.error("Error al actualizar estado: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Sesión eliminada correctamente");
    },
    onError: (error) => toast.error("Error al eliminar sesión: " + error.message),
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", scheduled_at: "", stream_url: "", platform: "youtube", thumbnail_url: "" });
    setEditingLive(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (live: LiveSession) => {
    setEditingLive(live);
    setFormData({
      title: live.title,
      description: live.description || "",
      scheduled_at: live.scheduled_at.slice(0, 16),
      stream_url: live.stream_url,
      platform: live.platform,
      thumbnail_url: live.thumbnail_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.scheduled_at || !formData.stream_url.trim()) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (editingLive) {
      updateMutation.mutate({ id: editingLive.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live": return <Badge className="bg-red-500 animate-pulse">EN VIVO</Badge>;
      case "ended": return <Badge variant="secondary">Finalizado</Badge>;
      default: return <Badge variant="outline">Programado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Gestión de Sesiones en Vivo
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingLive ? "Editar Sesión en Vivo" : "Crear Nueva Sesión en Vivo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Nombre de la sesión" maxLength={100} />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción de la sesión" maxLength={500} />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha y Hora *</label>
                <Input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Plataforma *</label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">URL del Stream *</label>
                <Input value={formData.stream_url} onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })} placeholder="https://youtube.com/watch?v=... o enlace de Zoom" />
              </div>
              <div>
                <label className="text-sm font-medium">URL de Miniatura</label>
                <Input value={formData.thumbnail_url} onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingLive ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Cargando sesiones...</p>
        ) : lives?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay sesiones creadas</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lives?.map((live) => (
                  <TableRow key={live.id}>
                    <TableCell className="font-medium">{live.title}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(live.scheduled_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{live.platform}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(live.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        {live.status === "scheduled" && (
                          <Button size="sm" variant="default" className="bg-red-500 hover:bg-red-600" onClick={() => statusMutation.mutate({ id: live.id, status: "live" })}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {live.status === "live" && (
                          <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: live.id, status: "ended" })}>
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEdit(live)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm("¿Eliminar esta sesión?")) deleteMutation.mutate(live.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
