import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Clock, Star, Eye, DollarSign, Users, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IncubatorProject {
  id: string;
  user_id: string;
  project_id: string | null;
  pitch: string;
  funding_goal: number;
  funding_received: number;
  equity_offered: number | null;
  status: string;
  team_size: number | null;
  business_model: string | null;
  target_market: string | null;
  revenue_projection: string | null;
  deck_url: string | null;
  video_pitch_url: string | null;
  created_at: string;
  approved_at: string | null;
  featured_at: string | null;
  build_project?: {
    title: string;
    description: string | null;
    live_url: string | null;
    screenshot_url: string | null;
  } | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function IncubatorManager() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<IncubatorProject | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-incubator-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incubator_projects')
        .select(`
          *,
          build_project:build_projects(title, description, live_url, screenshot_url),
          profile:profiles!incubator_projects_user_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as IncubatorProject[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status, featured }: { projectId: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, unknown> = {};
      
      if (status) {
        updates.status = status;
        if (status === 'approved') {
          updates.approved_at = new Date().toISOString();
        }
      }
      
      if (featured !== undefined) {
        updates.featured_at = featured ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('incubator_projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incubator-projects'] });
      toast.success('Proyecto actualizado');
      setSelectedProject(null);
    },
    onError: () => {
      toast.error('Error al actualizar el proyecto');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-green-500"><Check className="h-3 w-3" /> Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Rechazado</Badge>;
      case 'funded':
        return <Badge className="gap-1 bg-primary"><DollarSign className="h-3 w-3" /> Financiado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredProjects = projects?.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const pendingCount = projects?.filter(p => p.status === 'pending').length || 0;
  const approvedCount = projects?.filter(p => p.status === 'approved').length || 0;
  const fundedCount = projects?.filter(p => p.status === 'funded').length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando proyectos...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fundedCount}</p>
                <p className="text-sm text-muted-foreground">Financiados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Proyectos de Incubadora</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pendientes ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved">Aprobados</TabsTrigger>
              <TabsTrigger value="rejected">Rechazados</TabsTrigger>
              <TabsTrigger value="funded">Financiados</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredProjects?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay proyectos en esta categoría
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Creador</TableHead>
                      <TableHead>Meta de Financiación</TableHead>
                      <TableHead>Equity</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects?.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {project.build_project?.screenshot_url ? (
                              <img
                                src={project.build_project.screenshot_url}
                                alt=""
                                className="w-12 h-8 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {project.build_project?.title || 'Proyecto sin título'}
                              </p>
                              {project.featured_at && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                  Destacado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {project.profile?.full_name || 'Usuario'}
                          </div>
                        </TableCell>
                        <TableCell>
                          ${project.funding_goal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {project.equity_offered ? `${project.equity_offered}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(project.status)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Proyecto</DialogTitle>
          </DialogHeader>

          {selectedProject && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                {selectedProject.build_project?.screenshot_url && (
                  <img
                    src={selectedProject.build_project.screenshot_url}
                    alt=""
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedProject.build_project?.title || 'Proyecto sin título'}
                  </h3>
                  <p className="text-muted-foreground">
                    por {selectedProject.profile?.full_name || 'Usuario'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(selectedProject.status)}
                    {selectedProject.featured_at && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Meta de Financiación</p>
                  <p className="text-xl font-bold">${selectedProject.funding_goal.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Equity Ofrecido</p>
                  <p className="text-xl font-bold">
                    {selectedProject.equity_offered ? `${selectedProject.equity_offered}%` : 'No especificado'}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Tamaño del Equipo</p>
                  <p className="text-xl font-bold">{selectedProject.team_size || 1} personas</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Financiación Recibida</p>
                  <p className="text-xl font-bold">${selectedProject.funding_received.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Pitch</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedProject.pitch}
                </p>
              </div>

              {selectedProject.business_model && (
                <div>
                  <h4 className="font-medium mb-2">Modelo de Negocio</h4>
                  <p className="text-muted-foreground">{selectedProject.business_model}</p>
                </div>
              )}

              {selectedProject.target_market && (
                <div>
                  <h4 className="font-medium mb-2">Mercado Objetivo</h4>
                  <p className="text-muted-foreground">{selectedProject.target_market}</p>
                </div>
              )}

              {selectedProject.revenue_projection && (
                <div>
                  <h4 className="font-medium mb-2">Proyección de Ingresos</h4>
                  <p className="text-muted-foreground">{selectedProject.revenue_projection}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedProject.build_project?.live_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedProject.build_project.live_url} target="_blank" rel="noopener noreferrer">
                      Ver Proyecto
                    </a>
                  </Button>
                )}
                {selectedProject.deck_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedProject.deck_url} target="_blank" rel="noopener noreferrer">
                      Ver Deck
                    </a>
                  </Button>
                )}
                {selectedProject.video_pitch_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedProject.video_pitch_url} target="_blank" rel="noopener noreferrer">
                      Ver Video Pitch
                    </a>
                  </Button>
                )}
              </div>

              <div className="border-t pt-4 flex flex-wrap gap-2">
                {selectedProject.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ projectId: selectedProject.id, status: 'approved' })}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ projectId: selectedProject.id, status: 'rejected' })}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </>
                )}

                {selectedProject.status === 'approved' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ 
                        projectId: selectedProject.id, 
                        featured: !selectedProject.featured_at 
                      })}
                      className="gap-2"
                    >
                      <Star className={`h-4 w-4 ${selectedProject.featured_at ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      {selectedProject.featured_at ? 'Quitar Destacado' : 'Destacar'}
                    </Button>
                    <Button
                      onClick={() => updateStatusMutation.mutate({ projectId: selectedProject.id, status: 'funded' })}
                      className="gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Marcar como Financiado
                    </Button>
                  </>
                )}

                {selectedProject.status === 'rejected' && (
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ projectId: selectedProject.id, status: 'pending' })}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Volver a Pendiente
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
