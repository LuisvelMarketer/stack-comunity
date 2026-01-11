import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAIMentor } from '@/hooks/useAIMentor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIMentorChat } from '@/components/AIMentorChat';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  X, 
  Sparkles, 
  MessageCircle,
  Heart,
  Flame,
  Trophy,
  Target,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Coffee,
  Rocket,
  Star
} from 'lucide-react';

interface CeroCompanionProps {
  courseId?: string;
  moduleId?: string;
}

// Mensajes de ánimo contextuales
const encouragementMessages = [
  { icon: Heart, text: "¡Estoy aquí contigo! ¿Cómo puedo ayudarte hoy?", mood: "caring" },
  { icon: Coffee, text: "¡Un paso a la vez! Cada pequeño avance cuenta.", mood: "supportive" },
  { icon: Rocket, text: "¡Vamos, tú puedes! ¿Continuamos con la lección?", mood: "motivating" },
  { icon: Star, text: "Me alegra verte. ¿Listo para aprender algo nuevo?", mood: "welcoming" },
];

const suggestionIcons: Record<string, any> = {
  blocked: AlertTriangle,
  encouragement: Sparkles,
  tip: Lightbulb,
  milestone: Trophy,
  streak: Flame,
  challenge: Target,
  explore_feature: Sparkles,
};

export const CeroCompanion = ({ courseId, moduleId }: CeroCompanionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    suggestions, 
    analysis, 
    analyzing,
    analyzeProgress, 
    dismissSuggestion 
  } = useAIMentor();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Get latest relevant suggestion
  const latestSuggestion = suggestions[0];
  const hasHighPriority = suggestions.some(s => s.priority === 'high');
  const hasUnreadSuggestions = suggestions.length > 0;

  // Analyze on mount and periodically
  useEffect(() => {
    if (user && !hasInteracted) {
      const timer = setTimeout(() => {
        analyzeProgress(courseId, moduleId);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, courseId, moduleId]);

  // Show greeting after a short delay if no suggestions
  useEffect(() => {
    if (user && !latestSuggestion && !analyzing && !hasInteracted) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
        setPulseAnimation(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, latestSuggestion, analyzing, hasInteracted]);

  // Rotate encouragement messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % encouragementMessages.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation when there's a high priority suggestion
  useEffect(() => {
    if (hasHighPriority && !isExpanded) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasHighPriority, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    setShowGreeting(false);
    setHasInteracted(true);
    setPulseAnimation(false);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setIsExpanded(false);
    setHasInteracted(true);
  };

  const handleDismissSuggestion = (id: string) => {
    dismissSuggestion(id);
  };

  const handleAction = (actionType: string | undefined, actionData: any) => {
    if (!actionType) return;
    
    const routes: Record<string, string> = {
      continue_course: actionData?.course_id ? `/classroom/${actionData.course_id}` : '/courses',
      view_challenges: '/dashboard',
      view_streak: '/profile',
      explore_courses: '/courses',
      explore_build_public: '/build-in-public',
      explore_marketplace: '/marketplace',
      explore_incubator: '/incubator',
      explore_portfolio: '/my-portfolio',
      explore_library: '/library',
      explore_communities: '/communities',
    };
    
    const route = routes[actionType];
    if (route) {
      navigate(route);
      setIsExpanded(false);
    }
  };

  // Don't show if not authenticated or on auth page
  if (!user || location.pathname === '/auth') return null;

  const currentEncouragement = encouragementMessages[currentMessage];
  const EncouragementIcon = currentEncouragement.icon;

  return (
    <>
      {/* Main Companion Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Collapsed State - Floating Button */}
        {!isExpanded && (
          <div className="relative">
            {/* Greeting Bubble */}
            {(showGreeting || hasUnreadSuggestions) && !isChatOpen && (
              <div 
                className={cn(
                  "absolute bottom-16 right-0 w-72 animate-in slide-in-from-bottom-2 fade-in duration-300",
                  showGreeting && "cursor-pointer"
                )}
                onClick={handleExpand}
              >
                <Card className="bg-card/95 backdrop-blur-lg border-primary/20 shadow-xl">
                  <CardContent className="p-3">
                    {latestSuggestion ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "p-1.5 rounded-full shrink-0",
                            latestSuggestion.priority === 'high' ? 'bg-destructive/10' : 'bg-primary/10'
                          )}>
                            {(() => {
                              const Icon = suggestionIcons[latestSuggestion.suggestion_type] || Sparkles;
                              return <Icon className={cn(
                                "h-4 w-4",
                                latestSuggestion.priority === 'high' ? 'text-destructive' : 'text-primary'
                              )} />;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{latestSuggestion.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {latestSuggestion.content}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 -mt-1 -mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissSuggestion(latestSuggestion.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat();
                            }}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Hablar con Cero
                          </Button>
                          {(latestSuggestion as any).action_type && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(
                                  (latestSuggestion as any).action_type,
                                  (latestSuggestion as any).action_data
                                );
                              }}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 shrink-0">
                          <EncouragementIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">¡Hola! Soy Cero 👋</p>
                          <p className="text-xs text-muted-foreground">{currentEncouragement.text}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Arrow */}
                <div className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 bg-card border-b border-r border-primary/20" />
              </div>
            )}

            {/* Floating Button */}
            <Button
              onClick={hasUnreadSuggestions ? handleExpand : handleOpenChat}
              className={cn(
                "rounded-full h-14 w-14 shadow-lg transition-all duration-300",
                "bg-gradient-to-br from-primary to-accent hover:scale-105 hover:shadow-xl",
                pulseAnimation && "animate-pulse ring-4 ring-primary/30",
                hasHighPriority && "ring-2 ring-destructive ring-offset-2 ring-offset-background"
              )}
            >
              <Bot className={cn(
                "h-6 w-6",
                analyzing && "animate-bounce"
              )} />
            </Button>

            {/* Notification Badge */}
            {suggestions.length > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center",
                "bg-destructive text-destructive-foreground text-xs font-bold rounded-full",
                hasHighPriority && "animate-bounce"
              )}>
                {suggestions.length}
              </span>
            )}

            {/* Status Indicator */}
            <span className={cn(
              "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background",
              analyzing ? "bg-yellow-500" : "bg-green-500"
            )} />
          </div>
        )}

        {/* Expanded State - Full Widget */}
        {isExpanded && (
          <Card className={cn(
            "w-80 max-h-[500px] overflow-hidden animate-in slide-in-from-bottom-4",
            "bg-card/95 backdrop-blur-lg border-primary/20 shadow-2xl"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/20">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Cero - Tu Mentor</h3>
                  <p className="text-[10px] text-muted-foreground">Siempre aquí para ti</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCollapse}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 max-h-[350px] overflow-y-auto">
              {/* Status Cards */}
              {analysis && (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.currentStreak > 0 && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {analysis.currentStreak} días
                    </Badge>
                  )}
                  {analysis.streakAtRisk && (
                    <Badge variant="destructive" className="gap-1 text-[10px] animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      Racha en riesgo
                    </Badge>
                  )}
                  {analysis.activeChallenges > 0 && (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Target className="h-3 w-3" />
                      {analysis.activeChallenges} desafíos
                    </Badge>
                  )}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion) => {
                    const Icon = suggestionIcons[suggestion.suggestion_type] || Sparkles;
                    const actionType = (suggestion as any).action_type;
                    const actionData = (suggestion as any).action_data;
                    
                    return (
                      <div 
                        key={suggestion.id}
                        className={cn(
                          "p-2.5 rounded-lg border bg-card transition-colors",
                          suggestion.priority === 'high' 
                            ? 'border-destructive/30 bg-destructive/5' 
                            : 'border-muted hover:border-primary/30'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "p-1.5 rounded-full shrink-0",
                            suggestion.priority === 'high' ? 'bg-destructive/10' : 'bg-primary/10'
                          )}>
                            <Icon className={cn(
                              "h-3.5 w-3.5",
                              suggestion.priority === 'high' ? 'text-destructive' : 'text-primary'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs">{suggestion.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {suggestion.content}
                            </p>
                            {actionType && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-[11px] mt-1"
                                onClick={() => handleAction(actionType, actionData)}
                              >
                                {getActionLabel(actionType)}
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
                            onClick={() => handleDismissSuggestion(suggestion.id)}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-2">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">¡Todo va genial! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sigue así. Estoy aquí si me necesitas.
                  </p>
                </div>
              )}

              {/* Encouragement */}
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <EncouragementIcon className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground italic">
                    {currentEncouragement.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-muted/30">
              <Button
                className="w-full gap-2"
                onClick={handleOpenChat}
              >
                <MessageCircle className="h-4 w-4" />
                Hablar con Cero
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Chat Modal */}
      <AIMentorChat
        courseId={courseId}
        moduleId={moduleId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
};

function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    continue_course: 'Continuar curso',
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
  return labels[actionType] || 'Ver más';
}
