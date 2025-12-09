import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Clock, TrendingUp, Target, Calendar, Zap, Trophy, Lightbulb, BookOpen, Rocket } from 'lucide-react';
import { format, subWeeks, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ProjectUpdate } from '@/hooks/useBuildProjects';

interface ProjectStatsProps {
  updates: ProjectUpdate[];
  createdAt: string;
}

const updateTypeColors = {
  progress: '#3b82f6',
  milestone: '#eab308',
  challenge: '#f97316',
  learning: '#a855f7',
  launch: '#22c55e',
};

const updateTypeLabels = {
  progress: 'Progreso',
  milestone: 'Hito',
  challenge: 'Desafío',
  learning: 'Aprendizaje',
  launch: 'Lanzamiento',
};

export function ProjectStats({ updates, createdAt }: ProjectStatsProps) {
  const stats = useMemo(() => {
    // Total hours
    const totalHours = updates.reduce((acc, update) => acc + (update.hours_spent || 0), 0);
    
    // Updates by type
    const updatesByType = updates.reduce((acc, update) => {
      acc[update.update_type] = (acc[update.update_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Weekly activity (last 8 weeks)
    const weeklyActivity = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      
      const weekUpdates = updates.filter(update => {
        const updateDate = parseISO(update.created_at);
        return isWithinInterval(updateDate, { start: weekStart, end: weekEnd });
      });

      const weekHours = weekUpdates.reduce((acc, update) => acc + (update.hours_spent || 0), 0);
      
      weeklyActivity.push({
        week: format(weekStart, 'dd MMM', { locale: es }),
        updates: weekUpdates.length,
        hours: weekHours,
      });
    }

    // Pie chart data for update types
    const pieData = Object.entries(updatesByType).map(([type, count]) => ({
      name: updateTypeLabels[type as keyof typeof updateTypeLabels] || type,
      value: count,
      color: updateTypeColors[type as keyof typeof updateTypeColors] || '#6b7280',
    }));

    // Average hours per update
    const avgHoursPerUpdate = updates.length > 0 
      ? (totalHours / updates.length).toFixed(1) 
      : '0';

    // Days since start
    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Updates this week
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const updatesThisWeek = updates.filter(update => 
      parseISO(update.created_at) >= thisWeekStart
    ).length;

    // Streak calculation (consecutive weeks with updates)
    let currentStreak = 0;
    for (let i = 0; i < weeklyActivity.length; i++) {
      if (weeklyActivity[weeklyActivity.length - 1 - i].updates > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalHours,
      totalUpdates: updates.length,
      updatesByType,
      weeklyActivity,
      pieData,
      avgHoursPerUpdate,
      daysSinceStart,
      updatesThisWeek,
      currentStreak,
    };
  }, [updates, createdAt]);

  if (updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Estadísticas del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Las estadísticas aparecerán cuando agregues actualizaciones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.totalHours}h</p>
            <p className="text-xs text-muted-foreground">Horas invertidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.totalUpdates}</p>
            <p className="text-xs text-muted-foreground">Actualizaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.daysSinceStart}</p>
            <p className="text-xs text-muted-foreground">Días activo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Semanas seguidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Actividad Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="updates" 
                  name="Actualizaciones"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hours Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Horas por Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  name="Horas"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Update Types Distribution */}
      {stats.pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tipos de Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {stats.pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Promedio de horas por actualización</span>
            <span className="font-medium">{stats.avgHoursPerUpdate}h</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Actualizaciones esta semana</span>
            <span className="font-medium">{stats.updatesThisWeek}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Promedio semanal de actualizaciones</span>
            <span className="font-medium">
              {(stats.totalUpdates / Math.max(1, Math.ceil(stats.daysSinceStart / 7))).toFixed(1)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
