import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, MessageSquare, TrendingUp, Calendar, Trophy, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityAnalyticsProps {
  communityId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const CommunityAnalytics: React.FC<CommunityAnalyticsProps> = ({ communityId }) => {
  // Fetch community stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['community-stats', communityId],
    queryFn: async () => {
      const [membersRes, coursesRes, messagesRes, eventsRes, postsRes] = await Promise.all([
        supabase.from('community_members').select('*', { count: 'exact' }).eq('community_id', communityId),
        supabase.from('courses').select('*', { count: 'exact' }).eq('community_id', communityId),
        supabase.from('community_messages').select('*', { count: 'exact' }).eq('community_id', communityId),
        supabase.from('events').select('*', { count: 'exact' }).eq('community_id', communityId),
        supabase.from('posts').select('*', { count: 'exact' }).eq('community_id', communityId),
      ]);

      return {
        members: membersRes.count || 0,
        courses: coursesRes.count || 0,
        messages: messagesRes.count || 0,
        events: eventsRes.count || 0,
        posts: postsRes.count || 0,
      };
    },
  });

  // Fetch member growth over last 30 days
  const { data: memberGrowth, isLoading: loadingGrowth } = useQuery({
    queryKey: ['member-growth', communityId],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data } = await supabase
        .from('community_members')
        .select('joined_at')
        .eq('community_id', communityId)
        .gte('joined_at', thirtyDaysAgo.toISOString())
        .order('joined_at', { ascending: true });

      // Group by day
      const grouped: { [key: string]: number } = {};
      for (let i = 0; i <= 30; i++) {
        const date = format(subDays(new Date(), 30 - i), 'yyyy-MM-dd');
        grouped[date] = 0;
      }

      data?.forEach((member) => {
        const date = format(new Date(member.joined_at), 'yyyy-MM-dd');
        if (grouped[date] !== undefined) {
          grouped[date]++;
        }
      });

      return Object.entries(grouped).map(([date, count]) => ({
        date: format(new Date(date), 'dd MMM', { locale: es }),
        miembros: count,
      }));
    },
  });

  // Fetch engagement data (messages per day)
  const { data: engagementData, isLoading: loadingEngagement } = useQuery({
    queryKey: ['engagement-data', communityId],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data: messages } = await supabase
        .from('community_messages')
        .select('created_at')
        .eq('community_id', communityId)
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: posts } = await supabase
        .from('posts')
        .select('created_at')
        .eq('community_id', communityId)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Group by day
      const grouped: { [key: string]: { mensajes: number; publicaciones: number } } = {};
      for (let i = 0; i <= 7; i++) {
        const date = format(subDays(new Date(), 7 - i), 'yyyy-MM-dd');
        grouped[date] = { mensajes: 0, publicaciones: 0 };
      }

      messages?.forEach((msg) => {
        const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
        if (grouped[date]) grouped[date].mensajes++;
      });

      posts?.forEach((post) => {
        const date = format(new Date(post.created_at), 'yyyy-MM-dd');
        if (grouped[date]) grouped[date].publicaciones++;
      });

      return Object.entries(grouped).map(([date, data]) => ({
        date: format(new Date(date), 'EEE', { locale: es }),
        ...data,
      }));
    },
  });

  // Fetch course completion stats
  const { data: courseStats, isLoading: loadingCourseStats } = useQuery({
    queryKey: ['course-stats', communityId],
    queryFn: async () => {
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          course_modules (
            id,
            user_progress (completed)
          )
        `)
        .eq('community_id', communityId);

      return courses?.map((course) => {
        const totalModules = course.course_modules?.length || 0;
        const completedProgress = course.course_modules?.reduce((acc, mod) => {
          return acc + (mod.user_progress?.filter((p: any) => p.completed)?.length || 0);
        }, 0) || 0;
        
        return {
          name: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
          completados: completedProgress,
          total: totalModules,
        };
      }) || [];
    },
  });

  // Fetch subscription revenue (if paid community)
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['revenue-data', communityId],
    queryFn: async () => {
      const { data: subscriptions } = await supabase
        .from('community_subscriptions')
        .select('status, created_at')
        .eq('community_id', communityId);

      const { data: community } = await supabase
        .from('communities')
        .select('price_monthly')
        .eq('id', communityId)
        .single();

      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
      const monthlyRevenue = activeSubscriptions * (community?.price_monthly || 0);

      return {
        activeSubscriptions,
        monthlyRevenue,
        totalSubscriptions: subscriptions?.length || 0,
      };
    },
  });

  // Fetch top contributors
  const { data: topContributors, isLoading: loadingContributors } = useQuery({
    queryKey: ['top-contributors', communityId],
    queryFn: async () => {
      const { data: messages } = await supabase
        .from('community_messages')
        .select('user_id, profiles:user_id(full_name, avatar_url)')
        .eq('community_id', communityId);

      // Count messages per user
      const userCounts: { [key: string]: { count: number; name: string; avatar: string | null } } = {};
      
      messages?.forEach((msg: any) => {
        const userId = msg.user_id;
        if (!userCounts[userId]) {
          userCounts[userId] = {
            count: 0,
            name: msg.profiles?.full_name || 'Usuario',
            avatar: msg.profiles?.avatar_url,
          };
        }
        userCounts[userId].count++;
      });

      return Object.entries(userCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]) => ({
          id,
          name: data.name,
          messages: data.count,
        }));
    },
  });

  if (loadingStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.members || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.courses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.messages || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.events || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publicaciones</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.posts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suscripciones Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData?.activeSubscriptions || 0}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${revenueData?.monthlyRevenue?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crecimiento de Miembros (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGrowth ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={memberGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="miembros" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEngagement ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="mensajes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="publicaciones" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Contribuidores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingContributors ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topContributors?.map((contributor, index) => (
                  <div key={contributor.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{contributor.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {contributor.messages} mensajes
                    </span>
                  </div>
                ))}
                {(!topContributors || topContributors.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay datos de contribuidores aún
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progreso en Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCourseStats ? (
              <Skeleton className="h-[200px] w-full" />
            ) : courseStats && courseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={courseStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="completados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay cursos en esta comunidad
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
