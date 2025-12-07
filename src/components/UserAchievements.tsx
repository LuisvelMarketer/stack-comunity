import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Award, Medal, Target, Zap, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserAchievementsProps {
  userId: string;
  showTitle?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked_at: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  medal: Medal,
  target: Target,
  zap: Zap,
};

export function UserAchievements({ userId, showTitle = true }: UserAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        unlocked_at,
        achievements (
          id,
          name,
          description,
          icon,
          points
        )
      `)
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    if (!error && data) {
      const formattedAchievements = data
        .filter((item: any) => item.achievements)
        .map((item: any) => ({
          ...item.achievements,
          unlocked_at: item.unlocked_at,
        }));
      setAchievements(formattedAchievements);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aún no hay logros desbloqueados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Logros ({achievements.length})
        </h3>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((achievement) => {
          const IconComponent = ICON_MAP[achievement.icon] || Trophy;
          return (
            <div
              key={achievement.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {achievement.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    +{achievement.points} pts
                  </span>
                  <span>•</span>
                  <span>
                    {format(new Date(achievement.unlocked_at), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
