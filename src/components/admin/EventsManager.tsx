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
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, Repeat, RefreshCw } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  max_attendees: number | null;
  community_id: string;
  created_by: string;
  created_at: string;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  parent_event_id: string | null;
  communities?: { name: string };
}

interface Community {
  id: string;
  name: string;
}

export function EventsManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    max_attendees: "",
    community_id: "",
    recurrence_type: "",
    recurrence_end_date: "",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, communities(name)")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
  });

  const { data: communities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data as Community[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { error } = await supabase.from("events").insert({
        title: data.title.trim(),
        description: data.description.trim() || null,
        event_date: data.event_date,
        location: data.location.trim() || null,
        max_attendees: data.max_attendees ? parseInt(data.max_attendees) : null,
        community_id: data.community_id,
        created_by: userData.user.id,
        recurrence_type: data.recurrence_type || null,
        recurrence_end_date: data.recurrence_end_date || null,
      });

      if (error) throw error;

      // If recurring, generate future instances
      if (data.recurrence_type) {
        await supabase.functions.invoke("generate-recurring-events");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Evento creado correctamente");
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al crear evento: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("events")
        .update({
          title: data.title.trim(),
          description: data.description.trim() || null,
          event_date: data.event_date,
          location: data.location.trim() || null,
          max_attendees: data.max_attendees ? parseInt(data.max_attendees) : null,
          community_id: data.community_id,
          recurrence_type: data.recurrence_type || null,
          recurrence_end_date: data.recurrence_end_date || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Evento actualizado correctamente");
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al actualizar evento: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Evento eliminado correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar evento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      location: "",
      max_attendees: "",
      community_id: "",
      recurrence_type: "",
      recurrence_end_date: "",
    });
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date.slice(0, 16),
      location: event.location || "",
      max_attendees: event.max_attendees?.toString() || "",
      community_id: event.community_id,
      recurrence_type: event.recurrence_type || "",
      recurrence_end_date: event.recurrence_end_date?.slice(0, 16) || "",
    });
    setIsDialogOpen(true);
  };

  const generateRecurringMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("generate-recurring-events");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Eventos recurrentes generados");
    },
    onError: (error) => {
      toast.error("Error al generar eventos: " + error.message);
    },
  });

  const getRecurrenceLabel = (type: string | null) => {
    switch (type) {
      case "daily": return "Diario";
      case "weekly": return "Semanal";
      case "monthly": return "Mensual";
      default: return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.event_date || !formData.community_id) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPastEvent = (date: string) => new Date(date) < new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gestión de Eventos
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => generateRecurringMutation.mutate()}
            disabled={generateRecurringMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generateRecurringMutation.isPending ? 'animate-spin' : ''}`} />
            Generar Recurrentes
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar Evento" : "Crear Nuevo Evento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nombre del evento"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del evento"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Comunidad *</label>
                  <Select
                    value={formData.community_id}
                    onValueChange={(value) => setFormData({ ...formData, community_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una comunidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {communities?.map((community) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha y Hora *</label>
                  <Input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ubicación</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ubicación del evento"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Máximo de asistentes</label>
                  <Input
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    placeholder="Sin límite"
                    min="1"
                  />
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Repeat className="h-4 w-4" />
                    Recurrencia (opcional)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tipo de repetición</label>
                      <Select
                        value={formData.recurrence_type || "none"}
                        onValueChange={(value) => setFormData({ ...formData, recurrence_type: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin repetición" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin repetición</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.recurrence_type && formData.recurrence_type !== "none" && (
                      <div>
                        <label className="text-sm font-medium">Hasta</label>
                        <Input
                          type="datetime-local"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingEvent ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Cargando eventos...</p>
        ) : events?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay eventos creados</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Comunidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Recurrencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TableRow key={event.id} className={event.parent_event_id ? "opacity-70" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {event.title}
                        {event.parent_event_id && (
                          <Badge variant="outline" className="text-xs">Instancia</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{event.communities?.name}</TableCell>
                    <TableCell>
                      {format(new Date(event.event_date), "dd MMM yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {event.recurrence_type && !event.parent_event_id ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Repeat className="h-3 w-3" />
                          {getRecurrenceLabel(event.recurrence_type)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isPastEvent(event.event_date) ? "secondary" : "default"}>
                        {isPastEvent(event.event_date) ? "Finalizado" : "Próximo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const msg = event.recurrence_type && !event.parent_event_id 
                              ? "¿Eliminar este evento y todas sus instancias futuras?"
                              : "¿Eliminar este evento?";
                            if (confirm(msg)) {
                              deleteMutation.mutate(event.id);
                            }
                          }}
                        >
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
