import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useCommunitySubscription } from "@/hooks/useCommunitySubscription";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen, MessageSquare, ArrowLeft, Circle, Video, Trophy, Crown, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventsList } from "@/components/community/EventsList";
import { MembersList } from "@/components/community/MembersList";
import { OnlineUsers } from "@/components/community/OnlineUsers";
import { CommunityChat } from "@/components/community/CommunityChat";
import { LiveSessions } from "@/components/community/LiveSessions";
import { CommunityCourses } from "@/components/community/CommunityCourses";
import { CommunityAchievementsLeaderboard } from "@/components/community/CommunityAchievementsLeaderboard";
import { CommunityAbout } from "@/components/community/CommunityAbout";
import { toast as sonnerToast } from "sonner";

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string;
  member_count: number;
  is_member?: boolean;
  price_monthly?: number;
  is_paid?: boolean;
}

export default function CommunityDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { onlineUsers, onlineCount } = useOnlinePresence(community?.id);
  const { isSubscribed, isFree, loading: subLoading, subscribe, checkSubscription } = useCommunitySubscription(community?.id);

  // Handle subscription return
  useEffect(() => {
    const subscription = searchParams.get('subscription');
    if (subscription === 'success') {
      sonnerToast.success('¡Suscripción activada! Ya tienes acceso completo a la comunidad.');
      checkSubscription();
      setSearchParams({});
    } else if (subscription === 'cancelled') {
      sonnerToast.info('Proceso de suscripción cancelado.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  useEffect(() => {
    loadCommunity();
    checkAdminRole();
  }, [slug, user]);

  const checkAdminRole = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  useEffect(() => {
    loadCommunity();
  }, [slug, user]);

  const loadCommunity = async () => {
    try {
      const { data: communityData, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;

      if (user) {
        const { data: membership } = await supabase
          .from("community_members")
          .select("id")
          .eq("community_id", communityData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        setCommunity({ ...communityData, is_member: !!membership });
      } else {
        setCommunity(communityData);
      }
    } catch (error) {
      console.error("Error loading community:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la comunidad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!community) return;

    try {
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: community.id, user_id: user.id });

      if (error) throw error;

      toast({
        title: "¡Unido!",
        description: "Te has unido a la comunidad exitosamente",
      });

      loadCommunity();
    } catch (error) {
      console.error("Error joining community:", error);
      toast({
        title: "Error",
        description: "No se pudo unir a la comunidad",
        variant: "destructive",
      });
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !community) return;

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Has salido",
        description: "Has salido de la comunidad",
      });

      loadCommunity();
    } catch (error) {
      console.error("Error leaving community:", error);
      toast({
        title: "Error",
        description: "No se pudo salir de la comunidad",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Comunidad no encontrada</h2>
          <Button onClick={() => navigate("/communities")}>
            Volver a Comunidades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DevAcademy
          </h1>
          <UserMenu showAdminLink={false} />
        </div>
      </nav>

      <div className="relative h-64 overflow-hidden">
        <img
          src={community.image_url}
          alt={community.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-card rounded-lg p-6 shadow-lg mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/communities")}
            >
              Comunidades
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{community.name}</h1>
              <p className="text-muted-foreground mb-4">{community.description}</p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {community.member_count} miembros
                </Badge>
                {community.is_paid && community.price_monthly && community.price_monthly > 0 && (
                  <Badge className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500">
                    <Crown className="h-3 w-3" />
                    ${community.price_monthly}/mes
                  </Badge>
                )}
                {onlineCount > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600/30">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    {onlineCount} en línea
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {community.is_member ? (
                <Button variant="outline" onClick={handleLeaveCommunity}>
                  Salir de la Comunidad
                </Button>
              ) : community.is_paid && !isSubscribed ? (
                <div className="text-center">
                  <Button 
                    onClick={async () => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      setSubscribing(true);
                      try {
                        await subscribe();
                      } catch (error) {
                        console.error(error);
                      } finally {
                        setSubscribing(false);
                      }
                    }}
                    disabled={subscribing || subLoading}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {subscribing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Crown className="mr-2 h-4 w-4" />
                    )}
                    Suscribirse por ${community.price_monthly}/mes
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acceso completo a todo el contenido
                  </p>
                </div>
              ) : (
                <Button onClick={handleJoinCommunity}>
                  Unirse a la Comunidad
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="about" className="mb-8">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Acerca de
            </TabsTrigger>
            <TabsTrigger value="lives" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Lives
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Logros
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Miembros
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <CommunityAbout community={community} />
          </TabsContent>

          <TabsContent value="lives" className="mt-6">
            <LiveSessions communityId={community.id} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {community.is_member ? (
              <EventsList communityId={community.id} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Únete a la comunidad para ver los eventos
              </div>
            )}
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <CommunityCourses 
              communityId={community.id} 
              isMember={!!community.is_member} 
            />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <CommunityAchievementsLeaderboard communityId={community.id} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MembersList communityId={community.id} />
              </div>
              <div>
                <OnlineUsers users={onlineUsers} count={onlineCount} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            {community.is_member ? (
              <CommunityChat communityId={community.id} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Únete a la comunidad para acceder al chat
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
