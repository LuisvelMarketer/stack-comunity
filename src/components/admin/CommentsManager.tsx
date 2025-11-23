import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string };
  course_module?: {
    title: string;
    course?: { title: string };
  };
}

export const CommentsManager = () => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("module_comments")
        .select(`
          *,
          course_module:course_modules(
            title,
            course:courses(title)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
        
        const commentsWithProfiles = data.map((comment: any) => ({
          ...comment,
          profile: profilesMap.get(comment.user_id),
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este comentario?")) return;

    try {
      const { error } = await supabase.from("module_comments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Comentario eliminado correctamente" });
      fetchComments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Comentarios</CardTitle>
        <CardDescription>Modera los comentarios de los estudiantes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay comentarios</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">{comment.profile?.full_name || "Usuario"}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{comment.content}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                          {comment.course_module?.course?.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.course_module?.title}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
