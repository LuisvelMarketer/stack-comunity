import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string;
  member_count: number;
  is_member?: boolean;
}

export default function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCommunities();
  }, [user]);

  const loadCommunities = async () => {
    try {
      const { data: communitiesData, error } = await supabase
        .from("communities")
        .select("*")
        .order("name");

      if (error) throw error;

      if (user) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id);

        const memberIds = new Set(memberships?.map(m => m.community_id) || []);
        const communitiesWithMembership = communitiesData.map(c => ({
          ...c,
          is_member: memberIds.has(c.id)
        }));
        setCommunities(communitiesWithMembership);
      } else {
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error("Error loading communities:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las comunidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: user.id });

      if (error) throw error;

      toast({
        title: "¡Unido!",
        description: "Te has unido a la comunidad exitosamente",
      });

      loadCommunities();
    } catch (error) {
      console.error("Error joining community:", error);
      toast({
        title: "Error",
        description: "No se pudo unir a la comunidad",
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Comunidades</h2>
          <p className="text-muted-foreground">
            Únete a comunidades y aprende junto a otros profesionales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card
              key={community.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/communities/${community.slug}`)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {community.is_member && (
                  <Badge className="absolute top-4 right-4 bg-primary">
                    Miembro
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {community.name}
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {community.member_count}
                  </Badge>
                </CardTitle>
                <CardDescription>{community.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {!community.is_member ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinCommunity(community.id);
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Unirse
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full">
                    Ver Comunidad
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
