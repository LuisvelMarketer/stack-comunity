import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCommunitySubscription } from "@/hooks/useCommunitySubscription";
import { useAIMentor } from "@/hooks/useAIMentor";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Lock, BookOpen, Bot } from "lucide-react";
import { ClassroomSidebar } from "@/components/course/ClassroomSidebar";
import { ClassroomContent } from "@/components/course/ClassroomContent";
import { LockedContent } from "@/components/LockedContent";
import { CourseCertificate } from "@/components/CourseCertificate";
import { Badge } from "@/components/ui/badge";
import { AIMentorFloating } from "@/components/AIMentorFloating";
import { AIMentorChat, AIMentorChatButton } from "@/components/AIMentorChat";

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

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  community_id: string | null;
}

interface Community {
  id: string;
  name: string;
  slug: string;
}

export default function Classroom() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity, analyzeProgress } = useAIMentor();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityId, setCommunityId] = useState<string | undefined>(undefined);
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  const [communityIsPaid, setCommunityIsPaid] = useState(false);
  const [communityPrice, setCommunityPrice] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Tracking state
  const moduleStartTime = useRef<Date | null>(null);
  const lastAnalysisTime = useRef<Date | null>(null);

  // Use community subscription hook for paid communities
  const { isSubscribed: isCommunitySubscribed, subscribe: subscribeToCommunity } = useCommunitySubscription(communityId);

  const isModuleAccessible = (module: Module) => {
    if (course?.community_id) {
      // For paid communities, require subscription or membership
      if (communityIsPaid) {
        return isCommunityMember && isCommunitySubscribed;
      }
      // For free communities, just require membership
      return isCommunityMember;
    }
    // For courses without community, allow access if module is free
    return module.is_free;
  };

  // Track module view time and detect if stuck
  useEffect(() => {
    if (selectedModule && user && courseId) {
      // Log module view
      logActivity('module_view', courseId, selectedModule.id, {
        module_title: selectedModule.title,
        module_order: selectedModule.order_index
      });
      
      // Start tracking time
      moduleStartTime.current = new Date();

      // Check if user is stuck (on same module for >10 minutes without completing)
      const stuckCheckTimer = setTimeout(async () => {
        if (selectedModule && !selectedModule.completed) {
          // Trigger AI analysis for contextual help
          const now = new Date();
          const lastAnalysis = lastAnalysisTime.current;
          
          // Only analyze once per 30 minutes to avoid spam
          if (!lastAnalysis || (now.getTime() - lastAnalysis.getTime()) > 30 * 60 * 1000) {
            console.log('[Classroom] User might be stuck, triggering AI analysis');
            await analyzeProgress(courseId, selectedModule.id);
            lastAnalysisTime.current = now;
          }
        }
      }, 10 * 60 * 1000); // 10 minutes

      return () => {
        clearTimeout(stuckCheckTimer);
        
        // Log time spent on module when leaving
        if (moduleStartTime.current) {
          const timeSpent = Math.round((new Date().getTime() - moduleStartTime.current.getTime()) / 1000);
          if (timeSpent > 5) { // Only log if spent more than 5 seconds
            logActivity('module_time_spent', courseId, selectedModule.id, {
              seconds: timeSpent,
              module_title: selectedModule.title,
              completed: selectedModule.completed
            });
          }
        }
      };
    }
  }, [selectedModule?.id, user, courseId]);

  // Track course entry
  useEffect(() => {
    if (courseId && user) {
      logActivity('course_enter', courseId, undefined, {
        course_title: course?.title
      });
    }
  }, [courseId, user]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      if (courseData.community_id && user) {
        const { data: communityData } = await supabase
          .from("communities")
          .select("id, name, slug, is_paid, price_monthly")
          .eq("id", courseData.community_id)
          .single();

        setCommunity(communityData);
        setCommunityId(communityData?.id);
        setCommunityIsPaid(communityData?.is_paid || false);
        setCommunityPrice(communityData?.price_monthly || null);

        const { data: membershipData } = await supabase
          .from("community_members")
          .select("id")
          .eq("community_id", courseData.community_id)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsCommunityMember(!!membershipData);
      }

      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;

      if (user) {
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("module_id, completed")
          .eq("user_id", user.id);

        const progressMap = new Map(
          progressData?.map((p) => [p.module_id, p.completed]) || []
        );

        const modulesWithProgress = modulesData.map((module) => ({
          ...module,
          completed: progressMap.get(module.id) || false,
        }));

        setModules(modulesWithProgress);
        
        // Auto-select first incomplete module or first module
        const firstIncomplete = modulesWithProgress.find((m) => !m.completed);
        setSelectedModule(firstIncomplete || modulesWithProgress[0] || null);

        const completed = modulesWithProgress.filter((m) => m.completed).length;
        const total = modulesWithProgress.length;
        setProgressPercent(total > 0 ? (completed / total) * 100 : 0);
      } else {
        const modulesWithProgress = modulesData.map((m) => ({ ...m, completed: false }));
        setModules(modulesWithProgress);
        setSelectedModule(modulesWithProgress[0] || null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleCompletion = async (moduleId: string, currentStatus: boolean) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para marcar tu progreso",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("user_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("module_id", moduleId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_progress")
          .update({
            completed: !currentStatus,
            completed_at: !currentStatus ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      // Log completion activity
      if (!currentStatus) {
        logActivity('module_complete', courseId!, moduleId, {
          module_title: modules.find(m => m.id === moduleId)?.title,
          time_to_complete: moduleStartTime.current 
            ? Math.round((new Date().getTime() - moduleStartTime.current.getTime()) / 1000)
            : null
        });
      }

      // Update local state immediately for better UX
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, completed: !currentStatus } : m
        )
      );
      
      if (selectedModule?.id === moduleId) {
        setSelectedModule((prev) => prev ? { ...prev, completed: !currentStatus } : null);
      }

      // Recalculate progress
      const newCompleted = modules.filter((m) => 
        m.id === moduleId ? !currentStatus : m.completed
      ).length;
      const newProgress = (newCompleted / modules.length) * 100;
      setProgressPercent(newProgress);

      // Trigger AI analysis on milestone completions
      if (!currentStatus && (newProgress === 25 || newProgress === 50 || newProgress === 75 || newProgress === 100)) {
        analyzeProgress(courseId!, moduleId);
      }

      toast({
        title: !currentStatus ? "¡Módulo completado!" : "Marcado como incompleto",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    // Log course exit
    if (courseId && user) {
      logActivity('course_exit', courseId, selectedModule?.id, {
        progress_percent: progressPercent,
        modules_completed: modules.filter(m => m.completed).length,
        total_modules: modules.length
      });
    }

    if (community) {
      navigate(`/communities/${community.slug}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="aspect-video w-full max-w-4xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Curso no encontrado</h1>
          <Button onClick={() => navigate("/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has access to the course
  // For paid communities: need membership + subscription
  // For free communities: just need membership
  const hasAccess = course.community_id 
    ? (communityIsPaid ? isCommunityMember && isCommunitySubscribed : isCommunityMember) 
    : true;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <LockedContent 
            title={communityIsPaid ? "Contenido de Pago" : "Únete a la comunidad"}
            description={communityIsPaid 
              ? `Este contenido requiere una suscripción a ${community?.name || 'la comunidad'}.` 
              : `Debes unirte a ${community?.name || 'la comunidad'} para acceder a este contenido.`
            }
            communityName={community?.name}
            price={communityIsPaid ? (communityPrice || undefined) : undefined}
            onSubscribe={communityIsPaid ? subscribeToCommunity : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
        
        {community && (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {community.name}
          </Badge>
        )}

        <div className="flex-1" />

        {progressPercent === 100 && (
          <CourseCertificate
            courseId={course.id}
            courseTitle={course.title}
            progressPercent={progressPercent}
          />
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ClassroomSidebar
          course={course}
          modules={modules}
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
          isModuleAccessible={isModuleAccessible}
          progressPercent={progressPercent}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {selectedModule ? (
          isModuleAccessible(selectedModule) ? (
            <ClassroomContent
              module={selectedModule}
              modules={modules}
              onToggleCompletion={toggleModuleCompletion}
              onNavigate={setSelectedModule}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              sidebarCollapsed={sidebarCollapsed}
              progressPercent={progressPercent}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <LockedContent 
                title={communityIsPaid ? "Módulo Premium" : "Módulo Bloqueado"}
                description={communityIsPaid 
                  ? `Este módulo requiere una suscripción a ${community?.name || 'la comunidad'}.`
                  : "Este módulo no está disponible en tu plan actual."
                }
                communityName={community?.name}
                price={communityIsPaid ? (communityPrice || undefined) : undefined}
                onSubscribe={communityIsPaid ? subscribeToCommunity : undefined}
              />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-medium">Selecciona un módulo</h2>
              <p className="text-muted-foreground">
                Elige un módulo del menú lateral para comenzar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Mentor */}
      <AIMentorFloating courseId={courseId} moduleId={selectedModule?.id} />
      
      {/* AI Mentor Chat */}
      {!isChatOpen && (
        <AIMentorChatButton onClick={() => setIsChatOpen(true)} />
      )}
      <AIMentorChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        courseId={courseId}
        moduleId={selectedModule?.id}
      />
    </div>
  );
}
