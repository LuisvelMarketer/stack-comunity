import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  member_count: number;
}

export const MyCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    // Only show STACK community
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", "stack")
      .order("name");

    if (!error && data) {
      setCommunities(data);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-4">Mis Comunidades</h3>
      <div className="space-y-3">
        {communities.map((community) => (
          <div
            key={community.id}
            onClick={() => navigate(`/communities/${community.slug}`)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              {community.image_url ? (
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{community.name}</p>
              <p className="text-xs text-muted-foreground">
                {community.member_count} miembros
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
