import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Star, Trophy, Crown, Award, Lightbulb, 
  Code, Laptop, Hammer, GraduationCap, BookOpen, Sprout, Gem, Lock, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface LevelBenefitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levels: LevelBenefit[];
  currentLevel: number;
  currentPoints: number;
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

const bgColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/30',
  blue: 'bg-blue-500/10 border-blue-500/30',
  indigo: 'bg-indigo-500/10 border-indigo-500/30',
  violet: 'bg-violet-500/10 border-violet-500/30',
  purple: 'bg-purple-500/10 border-purple-500/30',
  amber: 'bg-amber-500/10 border-amber-500/30',
  yellow: 'bg-yellow-500/10 border-yellow-500/30',
  orange: 'bg-orange-500/10 border-orange-500/30',
  red: 'bg-red-500/10 border-red-500/30',
  gold: 'bg-yellow-400/10 border-yellow-400/30',
  rose: 'bg-rose-500/10 border-rose-500/30',
  pink: 'bg-pink-500/10 border-pink-500/30',
  cyan: 'bg-cyan-500/10 border-cyan-500/30',
};

export const LevelBenefitsDialog = ({ 
  open, 
  onOpenChange, 
  levels, 
  currentLevel, 
  currentPoints 
}: LevelBenefitsDialogProps) => {
  const regularLevels = levels.filter(l => !l.is_prestige);
  const prestigeLevels = levels.filter(l => l.is_prestige);

  const renderLevelCard = (level: LevelBenefit) => {
    const isUnlocked = currentLevel >= level.level;
    const isCurrent = currentLevel === level.level;
    const IconComponent = iconMap[level.icon] || Star;
    const gradientClass = colorMap[level.color] || colorMap.blue;
    const bgClass = bgColorMap[level.color] || bgColorMap.blue;

    return (
      <div
        key={level.id}
        className={cn(
          'relative p-4 rounded-xl border transition-all',
          isUnlocked ? bgClass : 'bg-muted/30 border-border/50 opacity-60',
          isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {isCurrent && (
          <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
            Actual
          </Badge>
        )}
        
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
            isUnlocked ? `bg-gradient-to-br ${gradientClass}` : 'bg-muted'
          )}>
            {isUnlocked ? (
              <IconComponent className="h-6 w-6 text-white" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">Nivel {level.level}: {level.name}</h4>
              {level.is_prestige && (
                <Sparkles className="h-4 w-4 text-pink-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{level.description}</p>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {level.min_points.toLocaleString()} XP requeridos
            </p>
            
            {level.benefits.length > 0 && (
              <div className="space-y-1">
                {level.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {isUnlocked ? (
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-muted-foreground/50 shrink-0" />
                    )}
                    <span className={isUnlocked ? 'text-foreground' : 'text-muted-foreground'}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Sistema de Niveles
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Tu progreso total</span>
            <span className="text-sm text-primary font-bold">{currentPoints.toLocaleString()} XP</span>
          </div>
          <Progress 
            value={(currentLevel / levels.length) * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Nivel {currentLevel} de {levels.length} - {levels.filter(l => l.level <= currentLevel).length} niveles desbloqueados
          </p>
        </div>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Niveles Regulares
              </h3>
              <div className="grid gap-3">
                {regularLevels.map(renderLevelCard)}
              </div>
            </div>

            {prestigeLevels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  Niveles de Prestigio
                </h3>
                <div className="grid gap-3">
                  {prestigeLevels.map(renderLevelCard)}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
