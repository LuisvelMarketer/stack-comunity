import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  achievements_count: number;
}

interface CommunityAchievementsLeaderboardProps {
  communityId: string;
}

export function CommunityAchievementsLeaderboard({ communityId }: CommunityAchievementsLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [communityId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all achievements for courses in this community
      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select(`
          id,
          points,
          courses!inner (
            community_id
          )
        `)
        .eq("courses.community_id", communityId);

      if (achievementsError) throw achievementsError;

      if (!achievements || achievements.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const achievementIds = achievements.map(a => a.id);

      // Get user achievements for these achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select(`
          user_id,
          achievement_id,
          achievements (
            points
          )
        `)
        .in("achievement_id", achievementIds);

      if (userAchievementsError) throw userAchievementsError;

      if (!userAchievements || userAchievements.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Aggregate by user
      const userStats: Record<string, { total_points: number; achievements_count: number }> = {};
      
      userAchievements.forEach((ua: any) => {
        if (!userStats[ua.user_id]) {
          userStats[ua.user_id] = { total_points: 0, achievements_count: 0 };
        }
        userStats[ua.user_id].total_points += ua.achievements?.points || 0;
        userStats[ua.user_id].achievements_count += 1;
      });

      const userIds = Object.keys(userStats);

      if (userIds.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine data and sort by points
      const leaderboardData: LeaderboardEntry[] = (profiles || [])
        .map(profile => ({
          user_id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          total_points: userStats[profile.id]?.total_points || 0,
          achievements_count: userStats[profile.id]?.achievements_count || 0,
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 10);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error loading achievements leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center font-bold text-muted-foreground">{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Ranking de Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Ranking de Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aún no hay logros desbloqueados en esta comunidad</p>
            <p className="text-sm mt-1">¡Completa módulos para aparecer en el ranking!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Ranking de Logros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <Link
              key={entry.user_id}
              to={`/user/${entry.user_id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-6">
                {getRankIcon(index)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(entry.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entry.full_name || "Usuario"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {entry.achievements_count} logro{entry.achievements_count !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {entry.total_points} pts
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
