import { PortfolioAchievement } from "@/hooks/usePortfolio";
import { Trophy, Star, Award, Medal, Target, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PortfolioAchievementsProps {
  achievements: PortfolioAchievement[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  medal: Medal,
  target: Target,
  zap: Zap,
};

export function PortfolioAchievements({ achievements }: PortfolioAchievementsProps) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay logros para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        Logros ({achievements.length})
      </h2>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const IconComponent = ICON_MAP[achievement.icon] || Trophy;
          
          return (
            <div
              key={achievement.id}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-1">{achievement.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {achievement.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    +{achievement.points} pts
                  </span>
                  <span>•</span>
                  <span>
                    {format(new Date(achievement.unlocked_at), "MMM yyyy", { locale: es })}
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
