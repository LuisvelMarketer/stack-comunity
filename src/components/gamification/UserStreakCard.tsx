import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Target, Trophy, Calendar, Zap, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserStreakCardProps {
  compact?: boolean;
}

const STREAK_MILESTONES = [
  { days: 7, label: '7 días', icon: '🔥' },
  { days: 30, label: '30 días', icon: '⚡' },
  { days: 100, label: '100 días', icon: '🏆' },
];

export const UserStreakCard: React.FC<UserStreakCardProps> = ({ compact = false }) => {
  const { user } = useAuth();
  
  // Initialize streak tracking
  useStreak();

  const { data: streakData, isLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return data;
    },
    enabled: !!user,
  });

  const { data: streakAchievements } = useQuery({
    queryKey: ['streak-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          achievements (
            name,
            icon,
            points
          )
        `)
        .eq('user_id', user.id);

      return data?.filter((a: any) => 
        a.achievements?.name?.includes('Racha')
      ) || [];
    },
    enabled: !!user,
  });

  const { data: challenges, isLoading: loadingChallenges } = useQuery({
    queryKey: ['active-challenges'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('weekly_challenges')
        .select(`
          *,
          user_challenge_progress (
            current_count,
            completed
          )
        `)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(3);

      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;
  const totalDays = streakData?.total_activity_days || 0;

  // Calculate streak tier for visual feedback
  const getStreakTier = (streak: number) => {
    if (streak >= 100) return { color: 'text-yellow-500', label: 'Legendario', icon: '🏆' };
    if (streak >= 30) return { color: 'text-orange-500', label: 'En fuego', icon: '⚡' };
    if (streak >= 7) return { color: 'text-red-500', label: 'Racha caliente', icon: '🔥' };
    if (streak >= 3) return { color: 'text-primary', label: 'Buen ritmo', icon: '💪' };
    return { color: 'text-muted-foreground', label: 'Comenzando', icon: '✨' };
  };

  const tier = getStreakTier(currentStreak);

  // Get next milestone
  const getNextMilestone = () => {
    for (const milestone of STREAK_MILESTONES) {
      if (currentStreak < milestone.days) {
        return milestone;
      }
    }
    return null;
  };

  const nextMilestone = getNextMilestone();
  const progressToNextMilestone = nextMilestone 
    ? (currentStreak / nextMilestone.days) * 100 
    : 100;

  // Check which badges are unlocked
  const unlockedBadges = new Set(
    streakAchievements?.map((a: any) => a.achievements?.name) || []
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <Flame className={`h-5 w-5 ${tier.color}`} />
        <div>
          <p className="text-sm font-medium">
            <span className="text-lg font-bold">{currentStreak}</span> días de racha
          </p>
        </div>
        {currentStreak >= 7 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {tier.icon} {tier.label}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className={`h-5 w-5 ${tier.color}`} />
          Racha de Actividad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Main streak display */}
        <div className="text-center">
          <div className="text-5xl font-bold mb-1">{currentStreak}</div>
          <p className="text-sm text-muted-foreground">días consecutivos</p>
          {currentStreak >= 3 && (
            <Badge variant="secondary" className="mt-2">
              {tier.icon} {tier.label}
            </Badge>
          )}
        </div>

        {/* Streak Badges Progress */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Award className="h-4 w-4 text-primary" />
            Badges de Racha
          </div>
          <div className="flex justify-between gap-2">
            {STREAK_MILESTONES.map((milestone) => {
              const isUnlocked = currentStreak >= milestone.days || 
                unlockedBadges.has(`Racha de ${milestone.days} días`);
              const progress = Math.min((currentStreak / milestone.days) * 100, 100);
              
              return (
                <div 
                  key={milestone.days} 
                  className={`flex-1 text-center p-2 rounded-lg border transition-all ${
                    isUnlocked 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {isUnlocked ? milestone.icon : '🔒'}
                  </div>
                  <p className={`text-xs font-medium ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                    {milestone.label}
                  </p>
                  {!isUnlocked && (
                    <Progress value={progress} className="h-1 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
          {nextMilestone && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {nextMilestone.days - currentStreak} días para desbloquear {nextMilestone.icon}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
              <span className="text-xs">Récord</span>
            </div>
            <p className="text-xl font-semibold">{longestStreak}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Total días</span>
            </div>
            <p className="text-xl font-semibold">{totalDays}</p>
          </div>
        </div>

        {/* Active challenges */}
        {challenges && challenges.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              Desafíos Activos
            </div>
            {challenges.map((challenge: any) => {
              const progress = challenge.user_challenge_progress?.[0];
              const currentCount = progress?.current_count || 0;
              const progressPercent = Math.min((currentCount / challenge.target_count) * 100, 100);
              const isCompleted = progress?.completed;

              return (
                <div key={challenge.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {challenge.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentCount}/{challenge.target_count}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>+{challenge.points_reward} pts</span>
                    {isCompleted && (
                      <Badge variant="default" className="text-xs h-5">
                        <Zap className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
