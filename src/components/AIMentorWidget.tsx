import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIMentor } from '@/hooks/useAIMentor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  X, 
  Sparkles, 
  AlertTriangle, 
  Trophy,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Flame,
  Target,
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestionIcons: Record<string, any> = {
  blocked: AlertTriangle,
  encouragement: Sparkles,
  tip: Lightbulb,
  milestone: Trophy,
  streak: Flame,
  challenge: Target,
  explore_feature: Sparkles,
};

const priorityStyles: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  medium: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  high: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
};

const actionLabels: Record<string, string> = {
  continue_course: 'Continuar',
  view_challenges: 'Ver desafíos',
  view_streak: 'Ver racha',
  explore_courses: 'Explorar cursos',
  explore_build_public: 'Ver Build in Public',
  explore_marketplace: 'Ver Marketplace',
  explore_incubator: 'Ver Incubadora',
  explore_portfolio: 'Mi Portafolio',
  explore_library: 'Ver Biblioteca',
  explore_communities: 'Ver Comunidades',
};

export const AIMentorWidget = () => {
  const navigate = useNavigate();
  const { 
    suggestions, 
    loading, 
    analyzing, 
    analysis,
    analyzeProgress, 
    dismissSuggestion 
  } = useAIMentor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 2);
  const hasHighPriority = suggestions.some(s => s.priority === 'high');

  const handleAction = (actionType: string | undefined, actionData: any) => {
    if (!actionType) return;

    switch (actionType) {
      case 'continue_course':
        if (actionData?.course_id) {
          navigate(`/classroom/${actionData.course_id}`);
        }
        break;
      case 'view_challenges':
        navigate('/dashboard');
        break;
      case 'view_streak':
        navigate('/profile');
        break;
      case 'explore_courses':
        navigate('/courses');
        break;
      case 'explore_build_public':
        navigate('/build-in-public');
        break;
      case 'explore_marketplace':
        navigate('/marketplace');
        break;
      case 'explore_incubator':
        navigate('/incubator');
        break;
      case 'explore_portfolio':
        navigate('/my-portfolio');
        break;
      case 'explore_library':
        navigate('/library');
        break;
      case 'explore_communities':
        navigate('/communities');
        break;
      default:
        break;
    }
  };

  if (suggestions.length === 0 && !analyzing) {
    return null;
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      hasHighPriority 
        ? "border-destructive/30 bg-gradient-to-br from-destructive/5 to-background shadow-lg shadow-destructive/5" 
        : "border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full transition-all",
            hasHighPriority ? "bg-destructive/10 animate-pulse" : "bg-primary/10"
          )}>
            <Bot className={cn(
              "w-5 h-5",
              hasHighPriority ? "text-destructive" : "text-primary"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">AI Mentor</h3>
              {hasHighPriority && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                  ¡Atención!
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''} para ti
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              analyzeProgress();
            }}
            disabled={analyzing}
          >
            <RefreshCw className={cn("w-4 h-4", analyzing && "animate-spin")} />
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      {isExpanded && analysis && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {analysis.currentStreak > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Flame className="w-3 h-3 text-orange-500" />
              {analysis.currentStreak} días
            </Badge>
          )}
          {analysis.streakAtRisk && (
            <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Racha en riesgo
            </Badge>
          )}
          {analysis.activeChallenges > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Target className="w-3 h-3 text-primary" />
              {analysis.activeChallenges} desafíos
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="w-3 h-3" />
            {analysis.completedModules}/{analysis.totalModules} módulos
          </Badge>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analizando tu progreso...
            </div>
          )}

          {displayedSuggestions.map((suggestion) => {
            const Icon = suggestionIcons[suggestion.suggestion_type] || Sparkles;
            const styles = priorityStyles[suggestion.priority] || priorityStyles.medium;
            const actionType = (suggestion as any).action_type;
            const actionData = (suggestion as any).action_data;
            
            return (
              <div
                key={suggestion.id}
                className={cn(
                  "relative p-3 rounded-lg bg-card border transition-all hover:shadow-sm",
                  styles.border,
                  suggestion.priority === 'high' && "ring-1 ring-destructive/20"
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100"
                  onClick={() => dismissSuggestion(suggestion.id)}
                >
                  <X className="w-3 h-3" />
                </Button>

                <div className="flex items-start gap-3 pr-6">
                  <div className={cn("p-1.5 rounded-full", styles.bg)}>
                    <Icon className={cn("w-4 h-4", styles.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {suggestion.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {suggestion.content}
                    </p>
                    
                    {actionType && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleAction(actionType, actionData)}
                      >
                        {actionLabels[actionType] || 'Ver más'}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {suggestions.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Ver menos' : `Ver ${suggestions.length - 2} más`}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
