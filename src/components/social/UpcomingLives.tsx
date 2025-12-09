import { useState, useEffect } from 'react';
import { Radio, Play, Calendar, CalendarPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateGoogleCalendarUrl, downloadICalFile } from '@/lib/calendar-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LiveSession {
  id: string;
  community_id: string;
  title: string;
  platform: string;
  stream_url: string;
  scheduled_at: string;
  status: string;
  communities: {
    name: string;
    slug: string;
  };
}

export function UpcomingLives() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingSessions();
  }, []);

  const fetchUpcomingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          id,
          community_id,
          title,
          platform,
          stream_url,
          scheduled_at,
          status,
          communities (
            name,
            slug
          )
        `)
        .in('status', ['scheduled', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setSessions((data || []) as unknown as LiveSession[]);
    } catch (error) {
      console.error('Error fetching upcoming lives:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500" />
            Lives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const liveSessions = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500" />
          Sesiones en Vivo
          {liveSessions.length > 0 && (
            <Badge className="bg-red-500 text-white text-xs animate-pulse">
              {liveSessions.length} EN VIVO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay lives programados
          </p>
        ) : (
          <>
            {/* Live Now */}
            {liveSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
                onClick={() => navigate(`/communities/${session.communities?.slug}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500 text-white text-xs">
                        <Radio className="h-2 w-2 mr-1 animate-pulse" /> LIVE
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.communities?.name}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Scheduled */}
            {scheduledSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div 
                    className="space-y-1 flex-1 cursor-pointer"
                    onClick={() => navigate(`/communities/${session.communities?.slug}`)}
                  >
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.communities?.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(session.scheduled_at), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <CalendarPlus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = generateGoogleCalendarUrl({
                            title: session.title,
                            location: session.stream_url,
                            startDate: new Date(session.scheduled_at),
                          });
                          window.open(url, "_blank");
                        }}
                      >
                        Google Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadICalFile({
                            title: session.title,
                            location: session.stream_url,
                            startDate: new Date(session.scheduled_at),
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
