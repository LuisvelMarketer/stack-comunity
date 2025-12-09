import { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestionIcons = {
  blocked: AlertTriangle,
  encouragement: Sparkles,
  tip: Lightbulb,
  milestone: Trophy,
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-destructive/10 text-destructive',
};

export const AIMentorWidget = () => {
  const { 
    suggestions, 
    loading, 
    analyzing, 
    analyzeProgress, 
    dismissSuggestion 
  } = useAIMentor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 2);

  if (suggestions.length === 0 && !analyzing) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Mentor</h3>
            <p className="text-xs text-muted-foreground">
              {suggestions.length} sugerencias personalizadas
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
            
            return (
              <div
                key={suggestion.id}
                className="relative p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
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
                  <div className={cn(
                    "p-1.5 rounded-full",
                    priorityColors[suggestion.priority]
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {suggestion.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-[10px] px-1.5 py-0", priorityColors[suggestion.priority])}
                      >
                        {suggestion.priority === 'high' ? 'Urgente' : 
                         suggestion.priority === 'medium' ? 'Importante' : 'Tip'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {suggestion.content}
                    </p>
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
