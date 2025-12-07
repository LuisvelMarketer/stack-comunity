import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Users, Circle } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  member_count: number;
  is_owner: boolean;
}

export function ActiveCommunity() {
  const [community, setCommunity] = useState<Community | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadActiveCommunity();
    }
  }, [user]);

  const loadActiveCommunity = async () => {
    if (!user) return;

    try {
      // Get user's first community membership
      const { data: membership, error: memberError } = await supabase
        .from("community_members")
        .select("community_id, is_owner")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (memberError || !membership) {
        setLoading(false);
        return;
      }

      // Get community details
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("id, name, slug, description, image_url, member_count")
        .eq("id", membership.community_id)
        .single();

      if (communityError || !communityData) {
        setLoading(false);
        return;
      }

      setCommunity({
        ...communityData,
        is_owner: membership.is_owner || false,
      });

      // Simulate online count (in real app, use presence)
      setOnlineCount(Math.floor(Math.random() * 5) + 1);
    } catch (error) {
      console.error("Error loading active community:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!community) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Aún no perteneces a ninguna comunidad
          </p>
          <Button size="sm" onClick={() => navigate("/communities")}>
            Explorar Comunidades
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Community Banner/Image */}
      <div 
        className="h-24 bg-gradient-to-br from-primary/20 to-accent/20 relative cursor-pointer"
        onClick={() => navigate(`/communities/${community.slug}`)}
      >
        {community.image_url && (
          <img
            src={community.image_url}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <CardContent className="p-4">
        {/* Community Name */}
        <h3 
          className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate(`/communities/${community.slug}`)}
        >
          {community.name}
        </h3>
        
        {/* Description */}
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {community.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm border-t border-b py-3 mb-4">
          <div className="text-center">
            <div className="font-semibold">{community.member_count}</div>
            <div className="text-xs text-muted-foreground">Miembros</div>
          </div>
          <div className="text-center">
            <div className="font-semibold flex items-center justify-center gap-1">
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              {onlineCount}
            </div>
            <div className="text-xs text-muted-foreground">En línea</div>
          </div>
          {community.is_owner && (
            <div className="text-center">
              <div className="font-semibold">1</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
          )}
        </div>

        {/* Actions */}
        {community.is_owner ? (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/community/${community.id}/manage`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Ajustes
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/communities/${community.slug}`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Ver Comunidad
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
