import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitToIncubatorDialog } from "./SubmitToIncubatorDialog";
import { ProjectInterestsDialog } from "./ProjectInterestsDialog";
import { 
  Plus, 
  Rocket, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  Users,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MyProject {
  id: string;
  project_id: string | null;
  pitch: string;
  funding_goal: number;
  funding_received: number;
  equity_offered: number | null;
  status: string;
  created_at: string;
  build_project?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
}

interface MyIncubatorProjectsProps {
  onRefresh: () => void;
}

export function MyIncubatorProjects({ onRefresh }: MyIncubatorProjectsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [interestsDialogOpen, setInterestsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<MyProject | null>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadMyProjects();
      loadAvailableProjects();
    }
  }, [user]);

  const loadMyProjects = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("incubator_projects")
      .select(`
        *,
        build_project:project_id (
          id,
          title,
          thumbnail_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const loadAvailableProjects = async () => {
    if (!user) return;

    // Get user's build projects that are not already in incubator
    const { data: buildProjects } = await supabase
      .from("build_projects")
      .select("id, title, description, thumbnail_url, live_url, tech_stack")
      .eq("user_id", user.id)
      .eq("visibility", "public");

    const { data: incubatorProjects } = await supabase
      .from("incubator_projects")
      .select("project_id")
      .eq("user_id", user.id);

    const incubatorProjectIds = new Set(incubatorProjects?.map(p => p.project_id) || []);
    const available = buildProjects?.filter(p => !incubatorProjectIds.has(p.id)) || [];
    
    setAvailableProjects(available);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: any; label: string; variant: any }> = {
      pending: { icon: Clock, label: "Pendiente", variant: "secondary" },
      approved: { icon: CheckCircle2, label: "Aprobado", variant: "default" },
      rejected: { icon: XCircle, label: "Rechazado", variant: "destructive" },
      funded: { icon: DollarSign, label: "Financiado", variant: "default" },
      closed: { icon: XCircle, label: "Cerrado", variant: "outline" },
    };
    const { icon: Icon, label, variant } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleViewInterests = (project: MyProject) => {
    setSelectedProject(project);
    setInterestsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Skeleton className="h-24 w-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mis Proyectos en Incubadora</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona tus proyectos enviados a la incubadora
          </p>
        </div>
        {availableProjects.length > 0 && (
          <Button onClick={() => setSubmitDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Enviar Proyecto
          </Button>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes proyectos en la incubadora</h3>
            <p className="text-muted-foreground mb-4">
              Envía tu proyecto para conectar con inversores potenciales
            </p>
            {availableProjects.length > 0 ? (
              <Button onClick={() => setSubmitDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enviar Proyecto
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/build-in-public")}>
                Crear un proyecto primero
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const progress = project.funding_goal > 0
              ? (project.funding_received / project.funding_goal) * 100
              : 0;

            return (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {project.build_project?.thumbnail_url ? (
                      <img
                        src={project.build_project.thumbnail_url}
                        alt={project.build_project.title}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                        <Rocket className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {project.build_project?.title || "Proyecto"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Enviado el {format(new Date(project.created_at), "d MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {project.pitch}
                      </p>

                      {/* Funding Progress */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-sm">
                          <span>${project.funding_received.toLocaleString()} recaudado</span>
                          <span className="text-muted-foreground">
                            Meta: ${project.funding_goal.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {project.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInterests(project)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Ver Interesados
                          </Button>
                        )}
                        {project.project_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/project/${project.project_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Proyecto
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SubmitToIncubatorDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        availableProjects={availableProjects}
        onSuccess={() => {
          loadMyProjects();
          loadAvailableProjects();
          onRefresh();
        }}
      />

      {selectedProject && (
        <ProjectInterestsDialog
          open={interestsDialogOpen}
          onOpenChange={setInterestsDialogOpen}
          projectId={selectedProject.id}
          projectTitle={selectedProject.build_project?.title || "Proyecto"}
        />
      )}
    </div>
  );
}