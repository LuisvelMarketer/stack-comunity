import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildProjects } from '@/hooks/useBuildProjects';
import { BuildPublicFeed } from '@/components/build-in-public/BuildPublicFeed';
import { FeaturedProjects, ProjectCard } from '@/components/build-in-public/FeaturedProjects';
import { MyProjects } from '@/components/build-in-public/MyProjects';
import { CreateProjectDialog } from '@/components/build-in-public/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  TrendingUp, 
  Clock, 
  Search,
  Users,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BuildInPublic() {
  const { user } = useAuth();
  const { projects, loading } = useBuildProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('feed');

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tech_stack?.some((tech) => 
      tech.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Rocket className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Build in Public</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Construye tu proyecto a la vista de todos. Comparte tu progreso, 
              aprende de otros y crea tu portafolio documentado.
            </p>
            {user ? (
              <CreateProjectDialog
                trigger={
                  <Button size="lg" className="gap-2">
                    <Rocket className="h-5 w-5" />
                    Empezar Mi Proyecto
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - My Projects */}
          {user && (
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="sticky top-24 space-y-6">
                <MyProjects />
              </div>
            </div>
          )}

          {/* Main Feed */}
          <div className={`${user ? 'lg:col-span-1' : 'lg:col-span-2'} order-1 lg:order-2`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <TabsList>
                  <TabsTrigger value="feed" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Actualizaciones
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Proyectos
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar proyectos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <TabsContent value="feed" className="mt-6">
                <BuildPublicFeed />
              </TabsContent>

              <TabsContent value="projects" className="mt-6">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos aún'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Intenta con otros términos de búsqueda'
                        : '¡Sé el primero en crear uno!'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Featured */}
          <div className="lg:col-span-1 order-3">
            <div className="sticky top-24 space-y-6">
              <FeaturedProjects />
              
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border">
                <h3 className="font-semibold mb-4">📊 Estadísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{projects.length}</p>
                    <p className="text-sm text-muted-foreground">Proyectos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {projects.filter(p => p.status === 'completed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completados</p>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-muted/50 rounded-lg p-6 border">
                <h3 className="font-semibold mb-3">💡 Tips para Build in Public</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Comparte actualizaciones frecuentes</li>
                  <li>✅ Sé honesto sobre los desafíos</li>
                  <li>✅ Celebra los pequeños logros</li>
                  <li>✅ Pide feedback a la comunidad</li>
                  <li>✅ Documenta lo que aprendes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
