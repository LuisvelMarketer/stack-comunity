import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, Star, Trophy, Crown, Award, Lightbulb, 
  Code, Laptop, Hammer, GraduationCap, BookOpen, Sprout, Gem, ChevronRight
} from 'lucide-react';
import { LevelBenefitsDialog } from './LevelBenefitsDialog';

interface LevelBenefit {
  id: string;
  level: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  min_points: number;
  benefits: string[];
  is_prestige: boolean;
}

interface UserProfile {
  level: number;
  points: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  seedling: Sprout,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  code: Code,
  laptop: Laptop,
  hammer: Hammer,
  lightbulb: Lightbulb,
  award: Award,
  crown: Crown,
  trophy: Trophy,
  sparkles: Sparkles,
  star: Star,
  gem: Gem,
};

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  indigo: 'from-indigo-500 to-indigo-600',
  violet: 'from-violet-500 to-violet-600',
  purple: 'from-purple-500 to-purple-600',
  amber: 'from-amber-500 to-amber-600',
  yellow: 'from-yellow-500 to-yellow-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  gold: 'from-yellow-400 to-amber-500',
  rose: 'from-rose-500 to-rose-600',
  pink: 'from-pink-500 to-pink-600',
  cyan: 'from-cyan-400 to-cyan-500',
};

export const LevelProgressCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<LevelBenefit[]>([]);
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [profileRes, levelsRes] = await Promise.all([
        supabase.from('profiles').select('level, points').eq('id', user.id).single(),
        supabase.from('level_benefits').select('*').order('level', { ascending: true }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (levelsRes.data) {
        setLevels(levelsRes.data.map(l => ({
          ...l,
          benefits: Array.isArray(l.benefits) ? l.benefits as string[] : []
        })));
      }
    } catch (error) {
      console.error('Error fetching level data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile || levels.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentLevel = levels.find(l => l.level === profile.level) || levels[0];
  const nextLevel = levels.find(l => l.level === profile.level + 1);
  
  const pointsForCurrentLevel = currentLevel.min_points;
  const pointsForNextLevel = nextLevel?.min_points || currentLevel.min_points + 1000;
  const progressPoints = profile.points - pointsForCurrentLevel;
  const neededPoints = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercent = Math.min((progressPoints / neededPoints) * 100, 100);

  const IconComponent = iconMap[currentLevel.icon] || Star;
  const gradientClass = colorMap[currentLevel.color] || colorMap.blue;

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Tu Nivel</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowBenefitsDialog(true)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Ver todos los niveles
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{currentLevel.name}</h3>
                {currentLevel.is_prestige && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Prestigio
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{currentLevel.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso al nivel {profile.level + 1}</span>
              <span className="font-medium">{profile.points.toLocaleString()} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nivel {profile.level}</span>
              {nextLevel ? (
                <span>{pointsForNextLevel.toLocaleString()} XP para nivel {profile.level + 1}</span>
              ) : (
                <span className="text-primary">¡Nivel máximo alcanzado!</span>
              )}
            </div>
          </div>

          {currentLevel.benefits.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Beneficios activos:</p>
              <div className="flex flex-wrap gap-1">
                {currentLevel.benefits.slice(0, 3).map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
                {currentLevel.benefits.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{currentLevel.benefits.length - 3} más
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LevelBenefitsDialog 
        open={showBenefitsDialog}
        onOpenChange={setShowBenefitsDialog}
        levels={levels}
        currentLevel={profile.level}
        currentPoints={profile.points}
      />
    </>
  );
};
