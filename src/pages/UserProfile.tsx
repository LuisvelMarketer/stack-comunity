import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Award, MapPin, FileText, MessageSquare, Heart, Users, Sparkles, Calendar } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { MentionText } from "@/components/social/MentionText";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

type ActivityFilter = "all" | "posts" | "comments";

interface UserProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  interests: string | null;
  points: number;
  level: number;
  badges: any[];
  created_at: string;
}

interface RecentPost {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface RecentComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
}

interface UserCommunity {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  member_count: number;
  role: string;
  joined_at: string;
}

const ITEMS_PER_PAGE = 5;

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [communities, setCommunities] = useState<UserCommunity[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [postsPage, setPostsPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [communitySort, setCommunitySort] = useState<"joined" | "name">("joined");
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

  const sortedCommunities = [...communities].sort((a, b) => {
    if (communitySort === "name") {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
  });

  useEffect(() => {
    // If viewing own profile, redirect to /profile
    if (userId === user?.id) {
      navigate("/profile", { replace: true });
      return;
    }
    
    if (userId) {
      fetchProfile();
      fetchRecentPosts(0, false);
      fetchRecentComments(0, false);
      fetchUserCommunities();
      fetchTotalCounts();
    }
  }, [userId, user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, location, interests, points, level, badges, created_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile({
        ...data,
        badges: Array.isArray(data.badges) ? data.badges : [],
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPosts = async (page: number, append: boolean) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, created_at, likes_count, comments_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      const newPosts = data || [];
      setRecentPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setHasMorePosts(newPosts.length === ITEMS_PER_PAGE);
      setPostsPage(page);
    } catch (error) {
      console.error("Error fetching recent posts:", error);
    }
  };

  const fetchRecentComments = async (page: number, append: boolean) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, content, created_at, post_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      const newComments = data || [];
      setRecentComments(prev => append ? [...prev, ...newComments] : newComments);
      setHasMoreComments(newComments.length === ITEMS_PER_PAGE);
      setCommentsPage(page);
    } catch (error) {
      console.error("Error fetching recent comments:", error);
    }
  };

  const loadMoreActivity = async () => {
    setLoadingMore(true);
    try {
      if (activityFilter === "posts" || activityFilter === "all") {
        if (hasMorePosts) await fetchRecentPosts(postsPage + 1, true);
      }
      if (activityFilter === "comments" || activityFilter === "all") {
        if (hasMoreComments) await fetchRecentComments(commentsPage + 1, true);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const canLoadMore = () => {
    if (activityFilter === "posts") return hasMorePosts;
    if (activityFilter === "comments") return hasMoreComments;
    return hasMorePosts || hasMoreComments;
  };

  const fetchUserCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("community_members")
        .select(`
          role,
          joined_at,
          communities:community_id (
            id,
            name,
            slug,
            image_url,
            member_count
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      
      const userCommunities = data
        ?.map((item: any) => ({
          ...item.communities,
          role: item.role,
          joined_at: item.joined_at
        }))
        .filter((c: any) => c.id) || [];
      setCommunities(userCommunities);
    } catch (error) {
      console.error("Error fetching user communities:", error);
    }
  };

  const fetchTotalCounts = async () => {
    try {
      const [postsResult, commentsResult] = await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("post_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      setTotalPosts(postsResult.count || 0);
      setTotalComments(commentsResult.count || 0);
    } catch (error) {
      console.error("Error fetching total counts:", error);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Perfil de Usuario
            </h1>
            <UserMenu showAdminLink={false} />
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Usuario no encontrado</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Perfil de Usuario
          </h1>
          <UserMenu showAdminLink={false} />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  {profile.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-bold">
                    {profile.full_name || "Usuario"}
                  </h2>
                  {profile.location && (
                    <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </p>
                  )}
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <Calendar className="h-4 w-4" />
                    Miembro desde {format(new Date(profile.created_at), "MMMM yyyy", { locale: es })}
                  </p>
                  {profile.bio && (
                    <p className="text-muted-foreground mt-2 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{profile.bio}</span>
                    </p>
                  )}
                  {profile.interests && (
                    <div className="mt-3 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1.5">
                        {profile.interests.split(",").map((interest, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Trophy className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Puntos</p>
                    <p className="text-2xl font-bold">{profile.points}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Award className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nivel</p>
                    <p className="text-2xl font-bold">{profile.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Publicaciones</p>
                    <p className="text-2xl font-bold">{totalPosts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <MessageSquare className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Comentarios</p>
                    <p className="text-2xl font-bold">{totalComments}</p>
                  </div>
                </div>
              </div>
              
              {/* Badges */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Insignias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((badge: any, index: number) => (
                      <Badge key={index} variant="secondary" className="py-1.5 px-3">
                        {badge.icon && <span className="mr-1">{badge.icon}</span>}
                        {badge.name || badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Communities */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Comunidades
                </CardTitle>
                {communities.length > 1 && (
                  <Select value={communitySort} onValueChange={(v) => setCommunitySort(v as "joined" | "name")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joined">Fecha de ingreso</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {communities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pertenece a ninguna comunidad
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedCommunities.map((community) => (
                    <div
                      key={community.id}
                      onClick={() => navigate(`/communities/${community.slug}`)}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      {community.image_url ? (
                        <img
                          src={community.image_url}
                          alt={community.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{community.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {community.member_count} miembros · Desde {formatDistanceToNow(new Date(community.joined_at), { addSuffix: false, locale: es })}
                        </p>
                      </div>
                      <Badge variant={community.role === 'admin' ? 'default' : community.role === 'moderator' ? 'secondary' : 'outline'} className="capitalize shrink-0">
                        {community.role === 'member' ? 'Miembro' : community.role === 'admin' ? 'Admin' : 'Moderador'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Actividad Reciente</CardTitle>
                <Tabs value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityFilter)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="text-xs">Todo</TabsTrigger>
                    <TabsTrigger value="posts" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Posts
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Comentarios
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Posts */}
                {(activityFilter === "all" || activityFilter === "posts") && (
                  <>
                    {recentPosts.length === 0 && activityFilter === "posts" ? (
                      <p className="text-muted-foreground text-center py-4">
                        Sin publicaciones recientes
                      </p>
                    ) : (
                      recentPosts.map((post) => (
                        <div
                          key={`post-${post.id}`}
                          className="p-3 bg-muted/50 rounded-lg space-y-2"
                        >
                          <div className="flex items-center gap-2 text-xs text-primary">
                            <FileText className="h-3 w-3" />
                            <span>Publicación</span>
                          </div>
                          <p className="text-sm line-clamp-2">
                            <MentionText content={post.content} />
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.likes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {post.comments_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Comments */}
                {(activityFilter === "all" || activityFilter === "comments") && (
                  <>
                    {recentComments.length === 0 && activityFilter === "comments" ? (
                      <p className="text-muted-foreground text-center py-4">
                        Sin comentarios recientes
                      </p>
                    ) : (
                      recentComments.map((comment) => (
                        <div
                          key={`comment-${comment.id}`}
                          className="p-3 bg-muted/50 rounded-lg space-y-2"
                        >
                          <div className="flex items-center gap-2 text-xs text-secondary-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>Comentario</span>
                          </div>
                          <p className="text-sm line-clamp-2">
                            <MentionText content={comment.content} />
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Empty state for all */}
                {activityFilter === "all" && recentPosts.length === 0 && recentComments.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Sin actividad reciente
                  </p>
                )}

                {/* Load More Button */}
                {canLoadMore() && (recentPosts.length > 0 || recentComments.length > 0) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={loadMoreActivity}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Cargando..." : "Cargar más"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
