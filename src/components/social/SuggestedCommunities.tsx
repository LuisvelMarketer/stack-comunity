import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SuggestedCommunity {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  member_count: number;
}

export function SuggestedCommunities() {
  const [communities, setCommunities] = useState<SuggestedCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSuggestedCommunities();
  }, [user]);

  const loadSuggestedCommunities = async () => {
    try {
      // Get user's current community IDs
      let userCommunityIds: string[] = [];
      
      if (user) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id);
        
        userCommunityIds = memberships?.map(m => m.community_id) || [];
      }

      // Get communities the user is NOT a member of
      let query = supabase
        .from("communities")
        .select("id, name, slug, image_url, member_count")
        .order("member_count", { ascending: false })
        .limit(5);

      if (userCommunityIds.length > 0) {
        query = query.not("id", "in", `(${userCommunityIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error("Error loading suggested communities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || loading || communities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Comunidades sugeridas</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {communities.map((community) => (
          <div
            key={community.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
            onClick={() => navigate(`/communities/${community.slug}`)}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={community.image_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {community.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{community.name}</p>
              <p className="text-xs text-muted-foreground">
                {community.member_count} miembros
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
