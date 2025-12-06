import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarAddButton } from "@/components/ui/calendar-add-button";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Video, 
  MapPin, 
  Clock,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  location: string | null;
  type: "event" | "live";
  status?: string;
  community_name?: string;
  community_slug?: string;
  stream_url?: string;
  platform?: string;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentMonth]);

  const loadEvents = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      // Cargar eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          id, title, description, event_date, location,
          communities (name, slug)
        `)
        .gte("event_date", start.toISOString())
        .lte("event_date", end.toISOString())
        .order("event_date");

      if (eventsError) throw eventsError;

      // Cargar sesiones en vivo
      const { data: livesData, error: livesError } = await supabase
        .from("live_sessions")
        .select(`
          id, title, description, scheduled_at, status, stream_url, platform,
          communities (name, slug)
        `)
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString())
        .order("scheduled_at");

      if (livesError) throw livesError;

      const events: CalendarEvent[] = [
        ...(eventsData || []).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: new Date(e.event_date),
          location: e.location,
          type: "event" as const,
          community_name: e.communities?.name,
          community_slug: e.communities?.slug,
        })),
        ...(livesData || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          date: new Date(l.scheduled_at),
          location: null,
          type: "live" as const,
          status: l.status,
          stream_url: l.stream_url,
          platform: l.platform,
          community_name: l.communities?.name,
          community_slug: l.communities?.slug,
        })),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      setAllEvents(events);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const eventsForSelectedDate = selectedDate
    ? allEvents.filter((event) => isSameDay(event.date, selectedDate))
    : [];

  const datesWithEvents = allEvents.map((event) => event.date);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Calendario</h1>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Calendario */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-medium">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                >
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border pointer-events-auto w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-2",
                  cell: "flex-1 h-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                }}
                modifiers={{
                  hasEvent: (date) =>
                    datesWithEvents.some((eventDate) => isSameDay(eventDate, date)),
                }}
                modifiersClassNames={{
                  hasEvent: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary",
                }}
              />

              {/* Leyenda */}
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Evento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span>En vivo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eventos del día seleccionado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                {selectedDate
                  ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })
                  : "Selecciona una fecha"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : eventsForSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay eventos programados para este día
                </p>
              ) : (
                <div className="space-y-4">
                  {eventsForSelectedDate.map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {event.type === "live" ? (
                            <>
                              <Video className="h-4 w-4 text-destructive" />
                              {event.status === "live" && (
                                <Badge variant="destructive" className="animate-pulse">
                                  EN VIVO
                                </Badge>
                              )}
                            </>
                          ) : (
                            <CalendarIcon className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {event.community_name}
                        </Badge>
                      </div>

                      <h4 className="font-medium mb-1">{event.title}</h4>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-1 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {format(event.date, "HH:mm", { locale: es })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.platform && (
                          <div className="flex items-center gap-2">
                            <Video className="h-3 w-3" />
                            {event.platform === "youtube" ? "YouTube" : "Zoom"}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarAddButton
                          title={event.title}
                          description={event.description || undefined}
                          location={event.location || event.stream_url || undefined}
                          startDate={event.date}
                          size="sm"
                        />
                        {event.type === "live" && event.status === "live" && event.stream_url && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => window.open(event.stream_url, "_blank")}
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Ver ahora
                          </Button>
                        )}
                        {event.community_slug && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/communities/${event.community_slug}`)}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Comunidad
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

        {/* Lista de próximos eventos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Próximos eventos este mes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2 p-4 border rounded-lg">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : allEvents.filter((e) => e.date >= new Date()).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay eventos próximos este mes
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allEvents
                  .filter((e) => e.date >= new Date())
                  .slice(0, 6)
                  .map((event) => (
                    <div
                      key={`upcoming-${event.type}-${event.id}`}
                      className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedDate(event.date)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {event.type === "live" ? (
                          <Video className="h-4 w-4 text-destructive" />
                        ) : (
                          <CalendarIcon className="h-4 w-4 text-primary" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {event.community_name}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-1">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(event.date, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
