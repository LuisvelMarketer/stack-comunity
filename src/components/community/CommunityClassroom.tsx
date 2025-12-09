import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lock, CheckCircle2, PlayCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
}

interface Module {
  id: string;
  course_id: string;
}

interface UserProgress {
  module_id: string;
  completed: boolean;
}

interface CommunityClassroomProps {
  communityId: string;
  isMember: boolean;
}

export function CommunityClassroom({ communityId, isMember }: CommunityClassroomProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, [communityId, user]);

  const loadCourses = async () => {
    setLoading(true);

    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("id, title, description, thumbnail_url, is_published")
      .eq("community_id", communityId)
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (coursesError) {
      console.error("Error loading courses:", coursesError);
      setLoading(false);
      return;
    }

    setCourses(coursesData || []);

    if (coursesData && coursesData.length > 0) {
      const courseIds = coursesData.map(c => c.id);

      const { data: modulesData } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .in("course_id", courseIds);

      setModules(modulesData || []);

      if (user && modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(m => m.id);
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("module_id, completed")
          .eq("user_id", user.id)
          .in("module_id", moduleIds);

        setProgress(progressData || []);
      }
    }

    setLoading(false);
  };

  const getCourseProgress = (courseId: string) => {
    const courseModules = modules.filter(m => m.course_id === courseId);
    if (courseModules.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completedModules = courseModules.filter(m =>
      progress.some(p => p.module_id === m.id && p.completed)
    );

    return {
      completed: completedModules.length,
      total: courseModules.length,
      percentage: Math.round((completedModules.length / courseModules.length) * 100),
    };
  };

  const handleCourseClick = (courseId: string) => {
    if (!isMember) return;
    navigate(`/classroom/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="text-center py-12">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          Únete a la comunidad para acceder al Classroom
        </p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          Aún no hay cursos publicados en esta comunidad
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Tu Progreso</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">{courses.length}</p>
            <p className="text-sm text-muted-foreground">Cursos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">
              {progress.filter(p => p.completed).length}
            </p>
            <p className="text-sm text-muted-foreground">Módulos completados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">
              {courses.filter(c => getCourseProgress(c.id).percentage === 100 && getCourseProgress(c.id).total > 0).length}
            </p>
            <p className="text-sm text-muted-foreground">Cursos terminados</p>
          </div>
        </div>
      </div>

      {/* Course Cards - Skool Style */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const courseProgress = getCourseProgress(course.id);
          const isCompleted = courseProgress.percentage === 100 && courseProgress.total > 0;
          const isStarted = courseProgress.completed > 0;

          return (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            >
              {/* Background Image */}
              <div className="aspect-[16/10] relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary/60 to-accent/80" />
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Status Badge */}
                {isCompleted && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500/90 text-white gap-1 backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3" />
                      Completado
                    </Badge>
                  </div>
                )}
                
                {/* Play Icon on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <PlayCircle className="h-12 w-12 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                    {course.title}
                  </h3>
                  
                  {courseProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-white/90">
                        <span>
                          {isStarted 
                            ? `${courseProgress.completed}/${courseProgress.total} módulos`
                            : `${courseProgress.total} módulos`
                          }
                        </span>
                        {isStarted && (
                          <span className="font-medium">{courseProgress.percentage}%</span>
                        )}
                      </div>
                      {isStarted && (
                        <Progress 
                          value={courseProgress.percentage} 
                          className="h-1.5 bg-white/30"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
