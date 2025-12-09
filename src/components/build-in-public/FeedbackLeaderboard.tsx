import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, MessageSquare, CheckCircle } from "lucide-react";
import { UserAvatar, getInitials } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackStats {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_feedback: number;
  resolved_feedback: number;
  total_points: number;
}

export function FeedbackLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["feedback-leaderboard"],
    queryFn: async () => {
      // Get feedback stats per user
      const { data: feedbackStats, error } = await supabase
        .from("project_feedback")
        .select(`
          user_id,
          status,
          profiles!inner(full_name, avatar_url)
        `);

      if (error) throw error;

      // Aggregate stats by user
      const userStats: Record<string, FeedbackStats> = {};
      
      feedbackStats?.forEach((feedback: any) => {
        const userId = feedback.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            full_name: feedback.profiles?.full_name,
            avatar_url: feedback.profiles?.avatar_url,
            total_feedback: 0,
            resolved_feedback: 0,
            total_points: 0,
          };
        }
        userStats[userId].total_feedback++;
        if (feedback.status === "resolved") {
          userStats[userId].resolved_feedback++;
        }
      });

      // Calculate points: 5 per feedback + 10 per resolved
      Object.values(userStats).forEach((stats) => {
        stats.total_points = stats.total_feedback * 5 + stats.resolved_feedback * 10;
      });

      // Sort by total points and return top 10
      return Object.values(userStats)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 10);
    },
  });

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>;
  };

  const getFeedbackBadge = (count: number) => {
    if (count >= 50) return { label: "Experto QA", variant: "default" as const };
    if (count >= 25) return { label: "Tester Pro", variant: "secondary" as const };
    if (count >= 10) return { label: "Colaborador", variant: "outline" as const };
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Top Testers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Top Testers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            ¡Sé el primero en dar feedback y ganar puntos!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Top Testers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.map((user, index) => {
          const badge = getFeedbackBadge(user.total_feedback);
          return (
            <div
              key={user.user_id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-6 flex justify-center">
                {getRankBadge(index)}
              </div>
              <UserAvatar
                src={user.avatar_url}
                fallback={getInitials(user.full_name)}
                size="sm"
                showLevel={false}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {user.full_name || "Usuario"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {user.total_feedback}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {user.resolved_feedback}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{user.total_points}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </div>
          );
        })}
        
        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-2">
            <MessageSquare className="h-3 w-3" /> +5 pts por feedback
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" /> +10 pts si se resuelve
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
