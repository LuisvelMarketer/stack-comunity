import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Flame, Trophy, Star, Gift, Sparkles, 
  BookOpen, MessageCircle, Compass, ThumbsUp, LogIn,
  GraduationCap, Hammer, Users, Check, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_count: number;
  xp_reward: number;
  icon: string;
}

interface UserDailyChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  daily_challenges: DailyChallenge;
}

interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  target_count: number;
  xp_reward: number;
  icon: string;
  difficulty: string;
}

interface UserWeeklyMission {
  id: string;
  mission_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  weekly_missions: WeeklyMission;
}

const iconMap: Record<string, React.ElementType> = {
  'target': Target,
  'log-in': LogIn,
  'book-open': BookOpen,
  'message-circle': MessageCircle,
  'compass': Compass,
  'thumbs-up': ThumbsUp,
  'graduation-cap': GraduationCap,
  'hammer': Hammer,
  'star': Star,
  'flame': Flame,
  'users': Users,
  'trophy': Trophy,
};

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  hard: 'bg-red-500/10 text-red-500',
};

export const DailyMissionsCard: React.FC = () => {
  const { user } = useAuth();
  const [dailyChallenges, setDailyChallenges] = useState<UserDailyChallenge[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<UserWeeklyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getWeekStart();

      // Fetch all active daily challenges
      const { data: challenges } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('is_active', true);

      if (challenges) {
        // Ensure user has entries for today's challenges
        for (const challenge of challenges) {
          await supabase
            .from('user_daily_challenges')
            .upsert({
              user_id: user.id,
              challenge_id: challenge.id,
              challenge_date: today,
              current_progress: 0,
              is_completed: false,
              xp_claimed: false
            }, { onConflict: 'user_id,challenge_id,challenge_date' });
        }
      }

      // Fetch user's daily challenges with progress
      const { data: userDaily } = await supabase
        .from('user_daily_challenges')
        .select(`
          *,
          daily_challenges (*)
        `)
        .eq('user_id', user.id)
        .eq('challenge_date', today);

      if (userDaily) {
        setDailyChallenges(userDaily as unknown as UserDailyChallenge[]);
      }

      // Fetch all active weekly missions
      const { data: missions } = await supabase
        .from('weekly_missions')
        .select('*')
        .eq('is_active', true);

      if (missions) {
        // Ensure user has entries for this week's missions
        for (const mission of missions) {
          await supabase
            .from('user_weekly_missions')
            .upsert({
              user_id: user.id,
              mission_id: mission.id,
              week_start: weekStart,
              current_progress: 0,
              is_completed: false,
              xp_claimed: false
            }, { onConflict: 'user_id,mission_id,week_start' });
        }
      }

      // Fetch user's weekly missions with progress
      const { data: userWeekly } = await supabase
        .from('user_weekly_missions')
        .select(`
          *,
          weekly_missions (*)
        `)
        .eq('user_id', user.id)
        .eq('week_start', weekStart);

      if (userWeekly) {
        setWeeklyMissions(userWeekly as unknown as UserWeeklyMission[]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const claimReward = async (type: 'daily' | 'weekly', id: string, xp: number) => {
    if (!user) return;
    
    setClaiming(id);
    try {
      const table = type === 'daily' ? 'user_daily_challenges' : 'user_weekly_missions';
      
      await supabase
        .from(table)
        .update({ xp_claimed: true })
        .eq('id', id);

      // Add XP to user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: (profile.points || 0) + xp })
          .eq('id', user.id);
      }

      toast.success(`¡+${xp} XP reclamados!`, {
        description: '¡Sigue así para ganar más recompensas!'
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Error al reclamar recompensa');
    } finally {
      setClaiming(null);
    }
  };

  const completedDaily = dailyChallenges.filter(c => c.is_completed).length;
  const completedWeekly = weeklyMissions.filter(m => m.is_completed).length;

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Target className="h-4 w-4 text-primary" />
            </div>
            Misiones
          </CardTitle>
          <Badge variant="outline" className="bg-primary/5">
            <Sparkles className="h-3 w-3 mr-1" />
            {completedDaily + completedWeekly} completadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger 
              value="daily" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              <Flame className="h-4 w-4 mr-2" />
              Diarias ({completedDaily}/{dailyChallenges.length})
            </TabsTrigger>
            <TabsTrigger 
              value="weekly"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Semanales ({completedWeekly}/{weeklyMissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="p-4 pt-2 mt-0 space-y-3">
            {dailyChallenges.map((challenge) => {
              const Icon = iconMap[challenge.daily_challenges.icon] || Target;
              const progress = (challenge.current_progress / challenge.daily_challenges.target_count) * 100;
              
              return (
                <div 
                  key={challenge.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    challenge.is_completed 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-muted/30 border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      challenge.is_completed ? "bg-green-500/10" : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        challenge.is_completed ? "text-green-500" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {challenge.daily_challenges.title}
                        </h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          +{challenge.daily_challenges.xp_reward} XP
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {challenge.daily_challenges.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {challenge.current_progress}/{challenge.daily_challenges.target_count}
                        </span>
                      </div>
                      {challenge.is_completed && !challenge.xp_claimed && (
                        <Button 
                          size="sm" 
                          className="mt-2 w-full h-7 text-xs"
                          onClick={() => claimReward('daily', challenge.id, challenge.daily_challenges.xp_reward)}
                          disabled={claiming === challenge.id}
                        >
                          {claiming === challenge.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Gift className="h-3 w-3 mr-1" />
                              Reclamar recompensa
                            </>
                          )}
                        </Button>
                      )}
                      {challenge.xp_claimed && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
                          <Check className="h-3 w-3" />
                          Recompensa reclamada
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="weekly" className="p-4 pt-2 mt-0 space-y-3">
            {weeklyMissions.map((mission) => {
              const Icon = iconMap[mission.weekly_missions.icon] || Trophy;
              const progress = (mission.current_progress / mission.weekly_missions.target_count) * 100;
              
              return (
                <div 
                  key={mission.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    mission.is_completed 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-muted/30 border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      mission.is_completed ? "bg-green-500/10" : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        mission.is_completed ? "text-green-500" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {mission.weekly_missions.title}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", difficultyColors[mission.weekly_missions.difficulty])}
                          >
                            {mission.weekly_missions.difficulty === 'easy' ? 'Fácil' : 
                             mission.weekly_missions.difficulty === 'medium' ? 'Media' : 'Difícil'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            +{mission.weekly_missions.xp_reward} XP
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mission.weekly_missions.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {mission.current_progress}/{mission.weekly_missions.target_count}
                        </span>
                      </div>
                      {mission.is_completed && !mission.xp_claimed && (
                        <Button 
                          size="sm" 
                          className="mt-2 w-full h-7 text-xs"
                          onClick={() => claimReward('weekly', mission.id, mission.weekly_missions.xp_reward)}
                          disabled={claiming === mission.id}
                        >
                          {claiming === mission.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Gift className="h-3 w-3 mr-1" />
                              Reclamar recompensa
                            </>
                          )}
                        </Button>
                      )}
                      {mission.xp_claimed && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-500">
                          <Check className="h-3 w-3" />
                          Recompensa reclamada
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DailyMissionsCard;
