import { useState, useEffect } from 'react';
import { useAIMentor } from '@/hooks/useAIMentor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  X, 
  Sparkles, 
  AlertTriangle, 
  Trophy,
  Lightbulb,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIMentorFloatingProps {
  courseId?: string;
  moduleId?: string;
}

const suggestionIcons = {
  blocked: AlertTriangle,
  encouragement: Sparkles,
  tip: Lightbulb,
  milestone: Trophy,
};

const priorityStyles = {
  low: 'border-muted',
  medium: 'border-primary/50',
  high: 'border-destructive/50 animate-pulse',
};

export const AIMentorFloating = ({ courseId, moduleId }: AIMentorFloatingProps) => {
  const { suggestions, dismissSuggestion, analyzeProgress, analyzing } = useAIMentor();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewSuggestion, setHasNewSuggestion] = useState(false);

  // Get latest relevant suggestion
  const latestSuggestion = suggestions.find(s => 
    (s.course_id === courseId || !s.course_id) && 
    (s.module_id === moduleId || !s.module_id)
  );

  // Show notification dot when new suggestion arrives
  useEffect(() => {
    if (latestSuggestion && !isOpen) {
      setHasNewSuggestion(true);
    }
  }, [latestSuggestion?.id]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewSuggestion(false);
  };

  const handleDismiss = () => {
    if (latestSuggestion) {
      dismissSuggestion(latestSuggestion.id);
    }
    setIsOpen(false);
  };

  const handleAskHelp = () => {
    analyzeProgress(courseId, moduleId);
  };

  if (!latestSuggestion && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleAskHelp}
          disabled={analyzing}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-primary to-accent hover:scale-105 transition-transform"
        >
          <Bot className={cn("h-6 w-6", analyzing && "animate-pulse")} />
        </Button>
        <span className="absolute -top-1 -right-1 text-xs bg-background border rounded-full px-1.5 py-0.5 text-muted-foreground">
          AI
        </span>
      </div>
    );
  }

  if (!isOpen && latestSuggestion) {
    const Icon = suggestionIcons[latestSuggestion.suggestion_type] || Sparkles;
    
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpen}
          className={cn(
            "relative rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-primary to-accent hover:scale-105 transition-transform",
            latestSuggestion.priority === 'high' && "ring-2 ring-destructive ring-offset-2"
          )}
        >
          <Icon className="h-6 w-6" />
          {hasNewSuggestion && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full animate-bounce" />
          )}
        </Button>
      </div>
    );
  }

  if (isOpen && latestSuggestion) {
    const Icon = suggestionIcons[latestSuggestion.suggestion_type] || Sparkles;
    
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm">
        <Card className={cn(
          "p-4 shadow-xl border-2 bg-card/95 backdrop-blur-sm animate-in slide-in-from-bottom-4",
          priorityStyles[latestSuggestion.priority]
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-full shrink-0",
              latestSuggestion.priority === 'high' ? 'bg-destructive/10' : 'bg-primary/10'
            )}>
              <Icon className={cn(
                "h-5 w-5",
                latestSuggestion.priority === 'high' ? 'text-destructive' : 'text-primary'
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Bot className="h-3 w-3 mr-1" />
                  Vibe Code
                </Badge>
                {latestSuggestion.priority === 'high' && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Importante
                  </Badge>
                )}
              </div>
              
              <h4 className="font-semibold text-sm mb-1">
                {latestSuggestion.title}
              </h4>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {latestSuggestion.content}
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={handleDismiss}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cerrar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={handleAskHelp}
                  disabled={analyzing}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Más ayuda
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 -mt-1 -mr-1"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};
