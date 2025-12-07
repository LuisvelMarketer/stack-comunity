import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourseProgress {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progress: number;
  completedModules: number;
  totalModules: number;
}

export const ContinueLearning = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourseProgress();
  }, [user]);

  const loadCourseProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's progress on all modules
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select("module_id, completed")
        .eq("user_id", user.id);

      if (!userProgress || userProgress.length === 0) {
        setLoading(false);
        return;
      }

      // Get module IDs that user has interacted with
      const moduleIds = userProgress.map((p) => p.module_id);

      // Get modules with their course info
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .in("id", moduleIds);

      if (!modules || modules.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique course IDs
      const courseIds = [...new Set(modules.map((m) => m.course_id))];

      // Get courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url")
        .in("id", courseIds)
        .eq("is_published", true);

      if (!coursesData) {
        setLoading(false);
        return;
      }

      // Get all modules for these courses to calculate total
      const { data: allModules } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .in("course_id", courseIds);

      // Create progress map
      const progressMap = new Map(
        userProgress.map((p) => [p.module_id, p.completed])
      );

      // Calculate progress for each course
      const coursesWithProgress: CourseProgress[] = coursesData.map((course) => {
        const courseModules = allModules?.filter((m) => m.course_id === course.id) || [];
        const totalModules = courseModules.length;
        const completedModules = courseModules.filter(
          (m) => progressMap.get(m.id) === true
        ).length;
        const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

        return {
          ...course,
          progress,
          completedModules,
          totalModules,
        };
      });

      // Filter courses that are in progress (started but not 100% complete)
      // and sort by progress descending
      const inProgressCourses = coursesWithProgress
        .filter((c) => c.progress > 0 && c.progress < 100)
        .sort((a, b) => b.progress - a.progress);

      setCourses(inProgressCourses.slice(0, 2)); // Show top 2 courses in progress
    } catch (error) {
      console.error("Error loading course progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Continuar Aprendiendo</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-2 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (courses.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Continuar Aprendiendo</h3>
      </div>
      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/course/${course.id}`)}
            className="cursor-pointer group"
          >
            <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2 bg-muted">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary-foreground" />
                </div>
              )}
            </div>
            <h4 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
              {course.title}
            </h4>
            <div className="space-y-1">
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {course.completedModules} de {course.totalModules} módulos ({Math.round(course.progress)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
