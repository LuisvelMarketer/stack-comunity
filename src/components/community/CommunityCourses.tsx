import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, Lock, CheckCircle2 } from "lucide-react";

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

interface CommunityCoursesProps {
  communityId: string;
  isMember: boolean;
}

export function CommunityCourses({ communityId, isMember }: CommunityCoursesProps) {
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

    // Load published courses for this community
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

      // Load modules for all courses
      const { data: modulesData } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .in("course_id", courseIds);

      setModules(modulesData || []);

      // Load user progress if authenticated
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
    navigate(`/courses/${courseId}`);
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
          Únete a la comunidad para acceder a los cursos
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const courseProgress = getCourseProgress(course.id);
        const isCompleted = courseProgress.percentage === 100 && courseProgress.total > 0;

        return (
          <Card
            key={course.id}
            className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
            onClick={() => handleCourseClick(course.id)}
          >
            <div className="relative h-40 bg-muted">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <BookOpen className="h-12 w-12 text-primary/50" />
                </div>
              )}
              {isCompleted && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500 text-white gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completado
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {course.description}
                </p>
              )}

              {courseProgress.total > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {courseProgress.completed} de {courseProgress.total} módulos
                    </span>
                    <span className="font-medium">{courseProgress.percentage}%</span>
                  </div>
                  <Progress value={courseProgress.percentage} className="h-2" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin módulos todavía
                </p>
              )}

              <Button className="w-full mt-4 gap-2" variant={isCompleted ? "secondary" : "default"}>
                <Play className="h-4 w-4" />
                {courseProgress.completed > 0
                  ? isCompleted
                    ? "Revisar curso"
                    : "Continuar"
                  : "Comenzar curso"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}