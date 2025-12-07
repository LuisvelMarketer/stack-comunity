import { CheckCircle2, Circle, FileText, MessageCircle, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumBadge } from "@/components/PremiumBadge";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Quiz } from "@/components/Quiz";
import { ModuleComments } from "@/components/ModuleComments";
import { ModuleAttachmentsView } from "@/components/ModuleAttachmentsView";
import { getEmbedUrl } from "@/lib/video-utils";
import { Progress } from "@/components/ui/progress";

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

interface ClassroomContentProps {
  module: Module;
  modules: Module[];
  onToggleCompletion: (moduleId: string, currentStatus: boolean) => void;
  onNavigate: (module: Module) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  progressPercent: number;
}

export function ClassroomContent({
  module,
  modules,
  onToggleCompletion,
  onNavigate,
  onToggleSidebar,
  sidebarCollapsed,
  progressPercent,
}: ClassroomContentProps) {
  const currentIndex = modules.findIndex((m) => m.id === module.id);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Bar */}
      <div className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Módulo {currentIndex + 1} de {modules.length}
            </span>
            <span className="text-muted-foreground">•</span>
            <h1 className="font-medium truncate">{module.title}</h1>
            {!module.is_free && <PremiumBadge />}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-32">
            <Progress value={progressPercent} className="h-2" />
          </div>
          <span className="text-sm font-medium text-primary">{Math.round(progressPercent)}%</span>
        </div>

        <Button
          variant={module.completed ? "outline" : "default"}
          size="sm"
          onClick={() => onToggleCompletion(module.id, module.completed)}
          className="shrink-0"
        >
          {module.completed ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Completado</span>
            </>
          ) : (
            <>
              <Circle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Marcar completado</span>
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="content">
                <FileText className="mr-2 h-4 w-4" />
                Contenido
              </TabsTrigger>
              <TabsTrigger value="quiz">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageCircle className="mr-2 h-4 w-4" />
                Discusión
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {module.video_url && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    src={getEmbedUrl(module.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={module.title}
                  />
                </div>
              )}
              
              {module.content && (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <MarkdownRenderer content={module.content} />
                </div>
              )}

              <ModuleAttachmentsView moduleId={module.id} />

              {!module.video_url && !module.content && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No hay contenido disponible para este módulo</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="quiz">
              <Quiz moduleId={module.id} />
            </TabsContent>

            <TabsContent value="comments">
              <ModuleComments moduleId={module.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="h-16 border-t bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <Button
          variant="ghost"
          onClick={() => prevModule && onNavigate(prevModule)}
          disabled={!prevModule}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {prevModule ? prevModule.title : "Anterior"}
          </span>
          <span className="sm:hidden">Anterior</span>
        </Button>

        <div className="flex items-center gap-1">
          {modules.map((m, i) => (
            <button
              key={m.id}
              onClick={() => onNavigate(m)}
              className={`w-2 h-2 rounded-full transition-all ${
                m.id === module.id
                  ? "bg-primary w-6"
                  : m.completed
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
              }`}
              title={m.title}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={() => nextModule && onNavigate(nextModule)}
          disabled={!nextModule}
          className="gap-2"
        >
          <span className="hidden sm:inline">
            {nextModule ? nextModule.title : "Siguiente"}
          </span>
          <span className="sm:hidden">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
