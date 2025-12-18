import { PortfolioProject } from "@/hooks/usePortfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Heart, Eye, Code2 } from "lucide-react";

interface PortfolioProjectsProps {
  projects: PortfolioProject[];
  featuredIds?: string[];
}

export function PortfolioProjects({ projects, featuredIds = [] }: PortfolioProjectsProps) {
  const sortedProjects = [...projects].sort((a, b) => {
    const aFeatured = featuredIds.includes(a.id);
    const bFeatured = featuredIds.includes(b.id);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  });

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay proyectos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Code2 className="h-6 w-6" />
        Proyectos ({projects.length})
      </h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedProjects.map((project) => {
          const isFeatured = featuredIds.includes(project.id);
          
          return (
            <Card 
              key={project.id} 
              className={`overflow-hidden transition-all hover:shadow-lg ${
                isFeatured ? "ring-2 ring-primary" : ""
              }`}
            >
              {project.thumbnail_url && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold line-clamp-1">{project.title}</h3>
                  {isFeatured && (
                    <Badge variant="default" className="shrink-0">
                      Destacado
                    </Badge>
                  )}
                </div>
                
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}
                
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tech_stack.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.tech_stack.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.tech_stack.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {project.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {project.views_count || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {project.repository_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {project.live_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
