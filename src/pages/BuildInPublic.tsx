import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildProjects } from '@/hooks/useBuildProjects';
import { CreateProjectDialog } from '@/components/build-in-public/CreateProjectDialog';
import { ProjectCard } from '@/components/build-in-public/ProjectCard';
import { FeedbackLeaderboard } from '@/components/build-in-public/FeedbackLeaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  Rocket, 
  Search,
  Users,
  Bug,
  Lightbulb,
  Trophy,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectWithFeedback {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  repository_url: string | null;
  live_url: string | null;
  thumbnail_url: string | null;
  screenshot_url: string | null;
  status: 'idea' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  visibility: 'public' | 'community' | 'private';
  community_id: string | null;
  is_featured: boolean;
  featured_at: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    level?: number;
  };
  feedback_counts?: {
    bugs: number;
    improvements: number;
    design: number;
    open: number;
  };
}

export default function BuildInPublic() {
  const { user } = useAuth();
  const { myProjects } = useBuildProjects();
  const [projects, setProjects] = useState<ProjectWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Fetch projects with feedback counts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch public projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('build_projects')
          .select('*')
          .eq('visibility', 'public')
          .order('updated_at', { ascending: false });

        if (projectsError) throw projectsError;

        if (!projectsData || projectsData.length === 0) {
          setProjects([]);
          return;
        }

        // Fetch profiles for project authors
        const userIds = [...new Set(projectsData.map(p => p.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, level')
          .in('id', userIds);

        // Fetch feedback counts for each project
        const projectIds = projectsData.map(p => p.id);
        const { data: feedbackData } = await supabase
          .from('project_feedback')
          .select('project_id, category, status')
          .in('project_id', projectIds);

        // Process projects with profiles and feedback counts
        const projectsWithData = projectsData.map(project => {
          const profile = profilesData?.find(p => p.id === project.user_id);
          const projectFeedback = feedbackData?.filter(f => f.project_id === project.id) || [];
          
          const feedbackCounts = {
            bugs: projectFeedback.filter(f => f.category === 'bug').length,
            improvements: projectFeedback.filter(f => f.category === 'improvement').length,
            design: projectFeedback.filter(f => f.category === 'design').length,
            open: projectFeedback.filter(f => f.status === 'open').length,
          };

          return {
            ...project,
            profiles: profile,
            feedback_counts: feedbackCounts,
          } as ProjectWithFeedback;
        });

        setProjects(projectsWithData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter and sort projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tech_stack?.some((tech) => 
        tech.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'popular':
        return (b.likes_count || 0) - (a.likes_count || 0);
      case 'feedback':
        return (b.feedback_counts?.open || 0) - (a.feedback_counts?.open || 0);
      default:
        return 0;
    }
  });

  // Stats
  const stats = {
    totalProjects: projects.length,
    totalBugs: projects.reduce((acc, p) => acc + (p.feedback_counts?.bugs || 0), 0),
    totalImprovements: projects.reduce((acc, p) => acc + (p.feedback_counts?.improvements || 0), 0),
    projectsNeedingHelp: projects.filter(p => (p.feedback_counts?.open || 0) > 0).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          {/* Back to Dashboard Button */}
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Bug className="h-10 w-10 text-red-500" />
              <h1 className="text-4xl font-bold">Testing Lab</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Prueba las apps de tus compañeros, encuentra bugs y ayúdales a mejorar.
              <br />
              <span className="text-primary">La mejor forma de aprender es ayudando a otros.</span>
            </p>
            {user ? (
              <CreateProjectDialog
                trigger={
                  <Button size="lg" className="gap-2">
                    <Rocket className="h-5 w-5" />
                    Subir Mi Proyecto
                  </Button>
                }
              />
            ) : (
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  <Users className="h-5 w-5" />
                  Únete para Participar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="font-semibold">{stats.totalProjects}</span>
              <span className="text-muted-foreground">proyectos</span>
            </div>
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-500" />
              <span className="font-semibold">{stats.totalBugs}</span>
              <span className="text-muted-foreground">bugs reportados</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{stats.totalImprovements}</span>
              <span className="text-muted-foreground">mejoras sugeridas</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              <span className="font-semibold">{stats.projectsNeedingHelp}</span>
              <span className="text-muted-foreground">necesitan ayuda</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left Column - Projects */}
          <div className="flex-1">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proyectos, tecnologías..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="in_progress">En desarrollo</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="idea">Ideas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="popular">Más populares</SelectItem>
                  <SelectItem value="feedback">Necesitan ayuda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* My Projects Section */}
            {user && myProjects.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Mis Proyectos</h2>
                  <CreateProjectDialog
                    trigger={
                      <Button variant="outline" size="sm">
                        <Rocket className="h-4 w-4 mr-2" />
                        Nuevo
                      </Button>
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myProjects.slice(0, 3).map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project as ProjectWithFeedback} 
                      showFeedbackCounts={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Projects */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                Proyectos para Probar
                {filteredProjects.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredProjects.length}
                  </Badge>
                )}
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-0">
                        <Skeleton className="h-48 rounded-t-lg" />
                        <div className="p-5 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No se encontraron proyectos' 
                        : 'No hay proyectos aún'
                      }
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Intenta con otros filtros'
                        : '¡Sé el primero en subir tu proyecto!'
                      }
                    </p>
                    {user && (
                      <CreateProjectDialog
                        trigger={
                          <Button>
                            <Rocket className="h-4 w-4 mr-2" />
                            Subir Mi Proyecto
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      showFeedbackCounts={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Leaderboard */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4">
              <FeedbackLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}