import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { UserAvatar, getInitials } from "@/components/UserAvatar";

interface LeaderboardUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
}

export const Leaderboard = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopUsers();
  }, []);

  const loadTopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, points, level")
        .order("points", { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopUsers(data || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className={`font-bold w-5 ${getMedalColor(index)}`}>
                  {index + 1}
                </div>
                <UserAvatar
                  src={user.avatar_url}
                  fallback={getInitials(user.full_name)}
                  level={user.level}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.full_name || "Usuario"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {user.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};