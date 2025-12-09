import { useBuildProjects, type BuildProject } from '@/hooks/useBuildProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { Star, Heart, ExternalLink, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export function FeaturedProjects() {
  const { featuredProjects, loading } = useBuildProjects();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Proyectos Destacados</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
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

  if (featuredProjects.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Proyectos Destacados</h3>
          </div>
          <p className="text-sm text-muted-foreground text-center py-4">
            Los mejores proyectos de la semana aparecerán aquí
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <h3 className="font-semibold">Proyectos Destacados</h3>
        </div>
        <div className="space-y-4">
          {featuredProjects.map((project) => (
            <FeaturedProjectCard key={project.id} project={project} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedProjectCard({ project }: { project: BuildProject }) {
  const author = project.profiles;

  return (
    <Link 
      to={`/build-in-public/${project.id}`}
      className="block group"
    >
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
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
            <h4 className="font-medium truncate group-hover:text-primary transition-colors">
              {project.title}
            </h4>
            <Badge 
              variant="secondary" 
              className={`${statusColors[project.status]} text-white text-xs`}
            >
              {statusLabels[project.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <UserAvatar
              src={author?.avatar_url}
              fallback={author?.full_name?.[0] || '?'}
              size="sm"
            />
            <span className="text-sm text-muted-foreground truncate">
              {author?.full_name || 'Usuario'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="h-3 w-3" />
              {project.likes_count}
            </span>
            {project.tech_stack?.length > 0 && (
              <div className="flex gap-1">
                {project.tech_stack.slice(0, 3).map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProjectCard({ project }: { project: BuildProject }) {
  const author = project.profiles;

  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {project.thumbnail_url ? (
            <img 
              src={project.thumbnail_url} 
              alt={project.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
                {project.title[0]}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link 
                  to={`/build-in-public/${project.id}`}
                  className="font-semibold hover:text-primary transition-colors line-clamp-1"
                >
                  {project.title}
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.description || 'Sin descripción'}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={`${statusColors[project.status]} text-white flex-shrink-0`}
              >
                {statusLabels[project.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {project.tech_stack?.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Link to={`/user/${author?.id}`}>
                  <UserAvatar
                    src={author?.avatar_url}
                    fallback={author?.full_name?.[0] || '?'}
                    size="sm"
                  />
                </Link>
                <Link 
                  to={`/user/${author?.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {author?.full_name || 'Usuario'}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  {project.likes_count}
                </span>
                {project.repository_url && (
                  <a 
                    href={project.repository_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Github className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {project.live_url && (
                  <a 
                    href={project.live_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
