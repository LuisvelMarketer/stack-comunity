import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OwnedCommunity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  member_count: number;
}

export const useCommunityOwner = () => {
  const { user } = useAuth();
  const [ownedCommunities, setOwnedCommunities] = useState<OwnedCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOwnedCommunities();
    }
  }, [user]);

  const loadOwnedCommunities = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("community_members")
      .select(`
        community_id,
        communities (
          id,
          name,
          slug,
          description,
          image_url,
          member_count
        )
      `)
      .eq("user_id", user.id)
      .eq("is_owner", true);

    if (!error && data) {
      const communities = data
        .map((item: any) => item.communities)
        .filter(Boolean) as OwnedCommunity[];
      setOwnedCommunities(communities);
    }
    setLoading(false);
  };

  const isOwnerOf = (communityId: string) => {
    return ownedCommunities.some((c) => c.id === communityId);
  };

  return {
    ownedCommunities,
    loading,
    isOwnerOf,
    refetch: loadOwnedCommunities,
  };
};
