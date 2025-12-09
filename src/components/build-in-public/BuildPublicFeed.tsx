import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { CreateProjectDialog } from './CreateProjectDialog';
import { 
  Rocket, 
  Lightbulb, 
  Trophy, 
  BookOpen, 
  Zap,
  Heart,
  MessageCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { ProjectUpdate, BuildProject } from '@/hooks/useBuildProjects';

const updateTypeConfig = {
  progress: { icon: Zap, color: 'bg-blue-500', label: 'Progreso' },
  milestone: { icon: Trophy, color: 'bg-yellow-500', label: 'Hito' },
  challenge: { icon: Lightbulb, color: 'bg-orange-500', label: 'Desafío' },
  learning: { icon: BookOpen, color: 'bg-purple-500', label: 'Aprendizaje' },
  launch: { icon: Rocket, color: 'bg-green-500', label: 'Lanzamiento' },
};

const moodEmojis = {
  excited: '🔥',
  productive: '💪',
  stuck: '🤔',
  learning: '📚',
  celebrating: '🎉',
};

interface FeedUpdate extends ProjectUpdate {
  build_projects: BuildProject & {
    profiles: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  comments_count: number;
}

export function BuildPublicFeed() {
  const [updates, setUpdates] = useState<FeedUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        // First fetch updates with projects
        const { data: updatesData, error: updatesError } = await supabase
          .from('project_updates')
          .select(`
            *,
            build_projects!inner (
              id,
              title,
              status,
              likes_count,
              visibility,
              user_id
            ),
            project_update_comments (id)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (updatesError) throw updatesError;
        
        // Filter only public projects
        const publicUpdates = (updatesData || []).filter(
          (update: any) => update.build_projects?.visibility === 'public'
        );
        
        // Fetch profiles for all unique user_ids
        const userIds = [...new Set(publicUpdates.map((u: any) => u.build_projects?.user_id).filter(Boolean))];
        
        let profilesMap = new Map();
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
          profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
        }
        
        // Merge profiles into updates
        const updatesWithProfiles = publicUpdates.map((update: any) => ({
          ...update,
          comments_count: update.project_update_comments?.length || 0,
          build_projects: {
            ...update.build_projects,
            profiles: profilesMap.get(update.build_projects?.user_id) || null,
          },
        }));
        
        setUpdates(updatesWithProfiles as unknown as FeedUpdate[]);
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();

    // Real-time subscription
    const channel = supabase
      .channel('build-public-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_updates',
        },
        () => {
          fetchFeed();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay actualizaciones aún</h3>
          <p className="text-muted-foreground mb-4">
            ¡Sé el primero en compartir tu progreso!
          </p>
          <CreateProjectDialog />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => {
        const project = update.build_projects;
        const author = project?.profiles;
        const config = updateTypeConfig[update.update_type];
        const Icon = config.icon;

        return (
          <Card key={update.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${author?.id}`}>
                    <UserAvatar
                      src={author?.avatar_url}
                      fallback={author?.full_name?.[0] || '?'}
                      size="md"
                    />
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/user/${author?.id}`}
                        className="font-semibold hover:underline"
                      >
                        {author?.full_name || 'Usuario'}
                      </Link>
                      <span className="text-muted-foreground">en</span>
                      <Link 
                        to={`/build-in-public/${project?.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {project?.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(update.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                      {update.hours_spent && (
                        <>
                          <span>•</span>
                          <span>{update.hours_spent}h invertidas</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {update.mood && (
                    <span className="text-xl" title={update.mood}>
                      {moodEmojis[update.mood]}
                    </span>
                  )}
                  <Badge variant="secondary" className={`${config.color} text-white`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">{update.title}</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {update.content}
              </p>
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Heart className="h-4 w-4 mr-1" />
                  {project?.likes_count || 0}
                </Button>
                <Link to={`/build-in-public/${project?.id}`}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {update.comments_count || 0}
                  </Button>
                </Link>
                <Link to={`/build-in-public/${project?.id}`} className="ml-auto">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
