import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Award, MapPin, FileText, MessageSquare, Heart, Users } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { MentionText } from "@/components/social/MentionText";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UserProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
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
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [communities, setCommunities] = useState<UserCommunity[]>([]);

  useEffect(() => {
    // If viewing own profile, redirect to /profile
    if (userId === user?.id) {
      navigate("/profile", { replace: true });
      return;
    }
    
    if (userId) {
      fetchProfile();
      fetchRecentPosts();
      fetchRecentComments();
      fetchUserCommunities();
    }
  }, [userId, user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, location, points, level, badges, created_at")
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

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, created_at, likes_count, comments_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPosts(data || []);
    } catch (error) {
      console.error("Error fetching recent posts:", error);
    }
  };

  const fetchRecentComments = async () => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, content, created_at, post_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentComments(data || []);
    } catch (error) {
      console.error("Error fetching recent comments:", error);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("community_members")
        .select(`
          role,
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
          role: item.role
        }))
        .filter((c: any) => c.id) || [];
      setCommunities(userCommunities);
    } catch (error) {
      console.error("Error fetching user communities:", error);
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
                  {profile.bio && (
                    <p className="text-muted-foreground mt-2 flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{profile.bio}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Communities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Comunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {communities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No pertenece a ninguna comunidad
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {communities.map((community) => (
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
                          {community.member_count} miembros
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

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Publicaciones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Sin publicaciones recientes
                </p>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-3 bg-muted/50 rounded-lg space-y-2"
                    >
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentarios Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentComments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Sin comentarios recientes
                </p>
              ) : (
                <div className="space-y-4">
                  {recentComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-muted/50 rounded-lg space-y-2"
                    >
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
