import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarAddButton } from "@/components/ui/calendar-add-button";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_attendees: number;
  attendee_count?: number;
  is_attending?: boolean;
}

interface EventsListProps {
  communityId: string;
}

export function EventsList({ communityId }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [communityId, user]);

  const loadEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*")
        .eq("community_id", communityId)
        .gte("event_date", new Date().toISOString())
        .order("event_date");

      if (error) throw error;

      const eventsWithAttendees = await Promise.all(
        eventsData.map(async (event) => {
          const { count } = await supabase
            .from("event_attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id);

          let isAttending = false;
          if (user) {
            const { data: attendance } = await supabase
              .from("event_attendees")
              .select("id")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .maybeSingle();

            isAttending = !!attendance;
          }

          return {
            ...event,
            attendee_count: count || 0,
            is_attending: isAttending,
          };
        })
      );

      setEvents(eventsWithAttendees);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, currentlyAttending: boolean) => {
    if (!user) return;

    try {
      if (currentlyAttending) {
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "RSVP cancelado",
          description: "Has cancelado tu asistencia al evento",
        });
      } else {
        const { error } = await supabase
          .from("event_attendees")
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: "going",
          });

        if (error) throw error;

        toast({
          title: "¡Confirmado!",
          description: "Has confirmado tu asistencia al evento",
        });
      }

      loadEvents();
    } catch (error) {
      console.error("Error updating RSVP:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu asistencia",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay eventos próximos
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-2">{event.title}</CardTitle>
                <CardDescription>{event.description}</CardDescription>
              </div>
              {event.is_attending && (
                <Badge className="bg-primary">
                  <Check className="h-3 w-3 mr-1" />
                  Asistiendo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.event_date), "PPP 'a las' p", { locale: es })}
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              )}
              <div className="flex items-center justify-between pt-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.attendee_count} asistentes
                  {event.max_attendees && ` / ${event.max_attendees}`}
                </Badge>
                <div className="flex items-center gap-2">
                  <CalendarAddButton
                    title={event.title}
                    description={event.description}
                    location={event.location}
                    startDate={new Date(event.event_date)}
                  />
                  <Button
                    variant={event.is_attending ? "outline" : "default"}
                    onClick={() => handleRSVP(event.id, event.is_attending || false)}
                  >
                    {event.is_attending ? "Cancelar Asistencia" : "Confirmar Asistencia"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
