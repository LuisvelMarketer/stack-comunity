import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Circle, Play, FileText, MessageCircle, Lock, Crown, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Quiz } from "@/components/Quiz";
import { ModuleComments } from "@/components/ModuleComments";
import { CourseCertificate } from "@/components/CourseCertificate";
import { LockedContent } from "@/components/LockedContent";
import { PremiumBadge } from "@/components/PremiumBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getEmbedUrl } from "@/lib/video-utils";

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

export default function Course() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [course, setCourse] = useState<Course | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [isCommunityMember, setIsCommunityMember] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);

  // Check if current module is accessible
  // For community courses: user must be a member
  // For global courses: free modules or premium subscription
  const isModuleAccessible = (module: Module) => {
    if (course?.community_id) {
      // Community course - all modules accessible to members
      return isCommunityMember;
    }
    // Global course - check free/premium
    return module.is_free || isPremium;
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // If community course, fetch community info and check membership
      if (courseData.community_id && user) {
        const { data: communityData } = await supabase
          .from("communities")
          .select("id, name, slug")
          .eq("id", courseData.community_id)
          .single();

        setCommunity(communityData);

        const { data: membershipData } = await supabase
          .from("community_members")
          .select("id")
          .eq("community_id", courseData.community_id)
          .eq("user_id", user.id)
          .maybeSingle();

        setIsCommunityMember(!!membershipData);
      }

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;

      if (modulesError) throw modulesError;

      // Fetch user progress
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

        // Calculate progress
        const completed = modulesWithProgress.filter((m) => m.completed).length;
        const total = modulesWithProgress.length;
        setProgressPercent(total > 0 ? (completed / total) * 100 : 0);
      } else {
        setModules(modulesData.map((m) => ({ ...m, completed: false })));
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

      fetchCourseData();
      toast({
        title: !currentStatus ? "¡Módulo completado!" : "Marcado como incompleto",
        description: !currentStatus
          ? "Has marcado este módulo como completado"
          : "Has marcado este módulo como incompleto",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Curso no encontrado</CardTitle>
            <CardDescription>
              No se pudo encontrar el curso solicitado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle back navigation based on course type
  const handleBack = () => {
    if (community) {
      navigate(`/communities/${community.slug}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {community && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {community.name}
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Info & Modules List */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-semibold text-primary">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {modules.filter((m) => m.completed).length} de {modules.length}{" "}
                    módulos completados
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Section */}
            <CourseCertificate 
              courseId={course.id} 
              courseTitle={course.title}
              progressPercent={progressPercent}
            />

            <Card>
              <CardHeader>
                <CardTitle>Módulos del Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {modules.map((module, index) => {
                  const accessible = isModuleAccessible(module);
                  return (
                    <button
                      key={module.id}
                      onClick={() => setSelectedModule(module)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        selectedModule?.id === module.id
                          ? "border-primary bg-primary/5"
                          : accessible
                          ? "border-border hover:border-primary/50"
                          : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {!accessible ? (
                            <Lock className="h-5 w-5 text-amber-500" />
                          ) : module.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {index + 1}. {module.title}
                            </p>
                            {!module.is_free && (
                              <Crown className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          {module.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-2">
            {selectedModule ? (
              isModuleAccessible(selectedModule) ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-2xl">
                            {selectedModule.title}
                          </CardTitle>
                          {!selectedModule.is_free && <PremiumBadge />}
                        </div>
                        <CardDescription>{selectedModule.description}</CardDescription>
                      </div>
                      <Button
                        variant={selectedModule.completed ? "outline" : "default"}
                        onClick={() =>
                          toggleModuleCompletion(
                            selectedModule.id,
                            selectedModule.completed
                          )
                        }
                      >
                        {selectedModule.completed ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completado
                          </>
                        ) : (
                          <>
                            <Circle className="mr-2 h-4 w-4" />
                            Marcar como completado
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
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

                      <TabsContent value="content" className="space-y-6 mt-6">
                        {selectedModule.video_url && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-elegant">
                            <iframe
                              src={getEmbedUrl(selectedModule.video_url)}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              title={selectedModule.title}
                            />
                          </div>
                        )}
                        {selectedModule.content && (
                          <div className="mt-6">
                            <MarkdownRenderer content={selectedModule.content} />
                          </div>
                        )}
                        {!selectedModule.video_url && !selectedModule.content && (
                          <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay contenido disponible para este módulo</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="quiz" className="mt-6">
                        <Quiz moduleId={selectedModule.id} />
                      </TabsContent>

                      <TabsContent value="comments" className="mt-6">
                        <ModuleComments moduleId={selectedModule.id} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <LockedContent
                  title={selectedModule.title}
                  description="Este módulo está disponible exclusivamente para miembros Premium. Suscríbete para desbloquear todo el contenido."
                />
              )
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">
                    Selecciona un módulo para comenzar
                  </CardTitle>
                  <CardDescription>
                    Elige un módulo de la lista para ver su contenido
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
