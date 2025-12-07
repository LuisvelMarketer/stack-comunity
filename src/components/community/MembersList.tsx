import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar, getInitials } from "@/components/UserAvatar";

interface Member {
  user_id: string;
  joined_at: string;
  profile: {
    full_name: string;
    avatar_url: string;
    points: number;
    level: number;
  };
}

interface MembersListProps {
  communityId: string;
}

export function MembersList({ communityId }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, [communityId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("community_members")
        .select(`
          user_id,
          joined_at,
          profile:profiles!user_id(
            full_name,
            avatar_url,
            points,
            level
          )
        `)
        .eq("community_id", communityId)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      setMembers(data as any);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay miembros en esta comunidad
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((member) => (
        <Card key={member.user_id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={member.profile?.avatar_url}
                fallback={getInitials(member.profile?.full_name)}
                level={member.profile?.level || 1}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {member.profile?.full_name || "Usuario"}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Trophy className="h-3 w-3" />
                  {member.profile?.points || 0} pts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
