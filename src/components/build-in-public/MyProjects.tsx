import { useBuildProjects } from '@/hooks/useBuildProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Heart,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateProjectDialog } from './CreateProjectDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusLabels = {
  idea: 'Idea',
  in_progress: 'En progreso',
  paused: 'Pausado',
  completed: 'Completado',
  abandoned: 'Abandonado',
};

const statusColors = {
  idea: 'bg-purple-500',
  in_progress: 'bg-blue-500',
  paused: 'bg-yellow-500',
  completed: 'bg-green-500',
  abandoned: 'bg-gray-500',
};

export function MyProjects() {
  const { myProjects, loading, deleteProject } = useBuildProjects();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <CardTitle>Mis Proyectos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <CardTitle>Mis Proyectos</CardTitle>
          </div>
          <CreateProjectDialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuevo
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {myProjects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No tienes proyectos aún</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza a construir en público y comparte tu progreso
            </p>
            <CreateProjectDialog />
          </div>
        ) : (
          <div className="space-y-3">
            {myProjects.map((project) => (
              <div 
                key={project.id} 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {project.thumbnail_url ? (
                  <img 
                    src={project.thumbnail_url} 
                    alt={project.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {project.title[0]}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/build-in-public/${project.id}`}
                      className="font-medium hover:text-primary truncate"
                    >
                      {project.title}
                    </Link>
                    <Badge 
                      variant="secondary" 
                      className={`${statusColors[project.status]} text-white text-xs`}
                    >
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {project.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {project.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(project.updated_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link to={`/build-in-public/${project.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/build-in-public/${project.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminarán todas las actualizaciones y comentarios del proyecto.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
