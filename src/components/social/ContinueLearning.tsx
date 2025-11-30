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
}

export const ContinueLearning = () => {
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseProgress | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourseProgress();
  }, [user]);

  const loadCourseProgress = async () => {
    if (!user) return;

    const { data: courses, error } = await supabase
      .from("courses")
      .select("id, title, thumbnail_url")
      .eq("is_published", true)
      .limit(1);

    if (!error && courses && courses.length > 0) {
      setCourse({
        ...courses[0],
        progress: 35, // Mock progress for now
      });
    }
  };

  if (!course) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Continuar Aprendiendo</h3>
      </div>
      <div
        onClick={() => navigate(`/course/${course.id}`)}
        className="cursor-pointer group"
      >
        <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3 bg-muted">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
          )}
        </div>
        <h4 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h4>
        <div className="space-y-1">
          <Progress value={course.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{course.progress}% completado</p>
        </div>
      </div>
    </Card>
  );
};
