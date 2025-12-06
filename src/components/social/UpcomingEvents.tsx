import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { generateGoogleCalendarUrl, downloadICalFile } from "@/lib/calendar-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
}

export const UpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date, location")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay eventos próximos
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.event_date), "PPP", { locale: es })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <CalendarPlus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const url = generateGoogleCalendarUrl({
                            title: event.title,
                            location: event.location || undefined,
                            startDate: new Date(event.event_date),
                          });
                          window.open(url, "_blank");
                        }}
                      >
                        Google Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          downloadICalFile({
                            title: event.title,
                            location: event.location || undefined,
                            startDate: new Date(event.event_date),
                          });
                        }}
                      >
                        Apple / iCal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};