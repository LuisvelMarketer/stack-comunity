import { CheckCircle2, Circle, Lock, Crown, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  content: string | null;
  order_index: number;
  is_free: boolean;
  completed: boolean;
}

interface ClassroomSidebarProps {
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  modules: Module[];
  selectedModule: Module | null;
  onSelectModule: (module: Module) => void;
  isModuleAccessible: (module: Module) => boolean;
  progressPercent: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function ClassroomSidebar({
  course,
  modules,
  selectedModule,
  onSelectModule,
  isModuleAccessible,
  progressPercent,
  collapsed,
  onToggleCollapse,
}: ClassroomSidebarProps) {
  const completedCount = modules.filter((m) => m.completed).length;

  if (collapsed) {
    return (
      <div className="w-16 bg-card border-r flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto py-2">
          {modules.map((module, index) => {
            const accessible = isModuleAccessible(module);
            const isSelected = selectedModule?.id === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => onSelectModule(module)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : accessible
                    ? module.completed
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "hover:bg-muted"
                    : "bg-amber-500/10 text-amber-500"
                )}
                title={module.title}
              >
                {!accessible ? (
                  <Lock className="h-4 w-4" />
                ) : module.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </button>
            );
          })}
        </div>
        
        {/* Mini progress indicator */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-bold">{Math.round(progressPercent)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg truncate flex-1">{course.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-semibold text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedCount} de {modules.length} módulos completados
          </p>
        </div>
      </div>

      {/* Modules List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {modules.map((module, index) => {
            const accessible = isModuleAccessible(module);
            const isSelected = selectedModule?.id === module.id;
            
            return (
              <button
                key={module.id}
                onClick={() => onSelectModule(module)}
                className={cn(
                  "w-full p-3 rounded-lg transition-all text-left group",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : accessible
                    ? "hover:bg-muted"
                    : "opacity-60 cursor-not-allowed"
                )}
                disabled={!accessible}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium",
                    isSelected
                      ? "bg-primary-foreground/20"
                      : module.completed
                      ? "bg-primary/10 text-primary"
                      : !accessible
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-muted"
                  )}>
                    {!accessible ? (
                      <Lock className="h-4 w-4" />
                    ) : module.completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        isSelected ? "text-primary-foreground" : ""
                      )}>
                        {module.title}
                      </p>
                      {!module.is_free && (
                        <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                    {module.description && (
                      <p className={cn(
                        "text-xs line-clamp-1 mt-0.5",
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {module.description}
                      </p>
                    )}
                    
                    {/* Module indicators */}
                    <div className={cn(
                      "flex items-center gap-2 mt-1",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {module.video_url && (
                        <span className="flex items-center gap-1 text-xs">
                          <Play className="h-3 w-3" />
                          Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
