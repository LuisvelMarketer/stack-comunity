import { useEffect, useState } from "react";
import skoolifyLogo from "@/assets/skoolify-logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from "@/components/UserMenu";
import { BookOpen, Play, Users, Clock, CheckCircle } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface CourseWithProgress {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  community_id: string | null;
  community_name: string | null;
  community_slug: string | null;
  total_modules: number;
  completed_modules: number;
}

export default function Courses() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserCourses();
    }
  }, [user]);

  const fetchUserCourses = async () => {
    if (!user) return;

    try {
      // Get communities the user is a member of
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const communityIds = memberships.map((m) => m.community_id);

      // Get courses from those communities
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          community_id,
          communities (
            name,
            slug
          )
        `)
        .in("community_id", communityIds)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!coursesData) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Get module counts and progress for each course
      const coursesWithProgress: CourseWithProgress[] = await Promise.all(
        coursesData.map(async (course) => {
          // Get total modules
          const { count: totalModules } = await supabase
            .from("course_modules")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);

          // Get completed modules
          const { data: progressData } = await supabase
            .from("user_progress")
            .select("module_id")
            .eq("user_id", user.id)
            .eq("completed", true);

          const completedModuleIds = progressData?.map((p) => p.module_id) || [];

          const { count: completedModules } = await supabase
            .from("course_modules")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id)
            .in("id", completedModuleIds.length > 0 ? completedModuleIds : ["no-match"]);

          const community = course.communities as { name: string; slug: string } | null;

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            community_id: course.community_id,
            community_name: community?.name || null,
            community_slug: community?.slug || null,
            total_modules: totalModules || 0,
            completed_modules: completedModules || 0,
          };
        })
      );

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (course: CourseWithProgress) => {
    if (course.total_modules === 0) return 0;
    return Math.round((course.completed_modules / course.total_modules) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img src={skoolifyLogo} alt="Skoolify" className="w-8 h-8 rounded-lg" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Skoolify
              </h1>
            </div>
          </div>
          <UserMenu showAdminLink={isAdmin} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Todos los cursos disponibles en tus comunidades
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes cursos disponibles</h3>
              <p className="text-muted-foreground mb-4">
                Únete a una comunidad para acceder a sus cursos.
              </p>
              <Button onClick={() => navigate("/communities")} className="gap-2">
                <Users className="h-4 w-4" />
                Explorar Comunidades
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progress = getProgress(course);
              const isCompleted = progress === 100;
              const isStarted = progress > 0;

              return (
                <Card
                  key={course.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/classroom/${course.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    {/* Status badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completado
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    {course.community_name && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.community_name}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.completed_modules}/{course.total_modules} módulos
                        </span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <Button className="w-full" variant={isStarted ? "default" : "outline"}>
                      {isCompleted ? "Repasar" : isStarted ? "Continuar" : "Comenzar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
