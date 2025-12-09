import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  ExternalLink, 
  Github, 
  Bug, 
  Lightbulb, 
  Palette,
  Clock,
  Eye,
  Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BuildProject } from '@/hooks/useBuildProjects';

const statusLabels: Record<string, string> = {
  idea: 'Idea',
  in_progress: 'En desarrollo',
  paused: 'Pausado',
  completed: 'Completado',
  abandoned: 'Abandonado',
};

const statusColors: Record<string, string> = {
  idea: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  abandoned: 'bg-muted text-muted-foreground border-muted',
};

interface ProjectCardProps {
  project: BuildProject & {
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
  };
  showFeedbackCounts?: boolean;
}

export function ProjectCard({ project, showFeedbackCounts = true }: ProjectCardProps) {
  const author = project.profiles;
  const feedbackCounts = project.feedback_counts || { bugs: 0, improvements: 0, design: 0, open: 0 };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Screenshot/Thumbnail Section */}
        <div className="relative h-48 bg-gradient-to-br from-primary/5 to-primary/20 overflow-hidden">
          {project.screenshot_url || project.thumbnail_url ? (
            <img 
              src={project.screenshot_url || project.thumbnail_url!} 
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/30">
                {project.title[0]}
              </span>
            </div>
          )}
          
          {/* Status Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${statusColors[project.status]} border`}
          >
            {statusLabels[project.status]}
          </Badge>

          {/* Live URL Overlay */}
          {project.live_url && (
            <a 
              href={project.live_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="secondary" size="lg" className="gap-2">
                <ExternalLink className="h-5 w-5" />
                Probar App
              </Button>
            </a>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          {/* Title & Author */}
          <div>
            <Link 
              to={`/build-in-public/${project.id}`}
              className="text-xl font-bold hover:text-primary transition-colors line-clamp-1"
            >
              {project.title}
            </Link>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {project.description || 'Sin descripción'}
            </p>
          </div>

          {/* Author */}
          <Link 
            to={`/user/${author?.id}`}
            className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-lg -mx-2"
          >
            <UserAvatar
              src={author?.avatar_url || undefined}
              fallback={author?.full_name?.[0] || '?'}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {author?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-muted-foreground">
                Nivel {author?.level || 1}
              </p>
            </div>
          </Link>

          {/* Tech Stack */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tech_stack.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {project.tech_stack.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tech_stack.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Feedback Counters */}
          {showFeedbackCounts && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-red-500">
                <Bug className="h-4 w-4" />
                <span>{feedbackCounts.bugs}</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-500">
                <Lightbulb className="h-4 w-4" />
                <span>{feedbackCounts.improvements}</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-500">
                <Palette className="h-4 w-4" />
                <span>{feedbackCounts.design}</span>
              </div>
              {feedbackCounts.open > 0 && (
                <Badge variant="destructive" className="text-xs ml-auto">
                  {feedbackCounts.open} pendientes
                </Badge>
              )}
            </div>
          )}

          {/* Stats & Links Row */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {project.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {project.views_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: es })}
              </span>
            </div>

            <div className="flex items-center gap-1">
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
      </CardContent>
    </Card>
  );
}