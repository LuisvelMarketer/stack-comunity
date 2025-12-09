import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, MessageCircle, Linkedin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Interest {
  id: string;
  amount: number | null;
  message: string | null;
  status: string;
  created_at: string;
  investor: {
    id: string;
    user_id: string;
    bio: string | null;
    linkedin_url: string | null;
    is_verified: boolean;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
      level: number;
    } | null;
  };
}

interface ProjectInterestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function ProjectInterestsDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
}: ProjectInterestsDialogProps) {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && projectId) {
      loadInterests();
    }
  }, [open, projectId]);

  const loadInterests = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("investment_interests")
      .select(`
        *,
        investor:investor_id (
          id,
          user_id,
          bio,
          linkedin_url,
          is_verified
        )
      `)
      .eq("incubator_project_id", projectId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch investor profiles
      const userIds = data.map((d: any) => d.investor?.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, level")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const interestsWithProfiles = data.map((interest: any) => ({
        ...interest,
        investor: {
          ...interest.investor,
          profile: profilesMap.get(interest.investor?.user_id) || null,
        },
      }));

      setInterests(interestsWithProfiles);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      interested: { label: "Interesado", variant: "secondary" },
      in_talks: { label: "En conversación", variant: "default" },
      committed: { label: "Comprometido", variant: "default" },
      invested: { label: "Invertido", variant: "default" },
      declined: { label: "Declinado", variant: "outline" },
    };
    const { label, variant } = config[status] || config.interested;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const totalPotential = interests.reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inversores interesados en {projectTitle}</DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Inversión potencial</p>
            <p className="text-2xl font-bold">${totalPotential.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Interesados</p>
            <p className="text-2xl font-bold">{interests.length}</p>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : interests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay inversores interesados aún
            </div>
          ) : (
            <div className="space-y-4">
              {interests.map((interest) => (
                <div
                  key={interest.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  {/* Investor Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={interest.investor.profile?.avatar_url}
                        fallback={interest.investor.profile?.full_name?.charAt(0) || "I"}
                        level={interest.investor.profile?.level || 1}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {interest.investor.profile?.full_name || "Inversor"}
                          </span>
                          {interest.investor.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(interest.created_at), "d MMM yyyy", { locale: es })}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(interest.status)}
                  </div>

                  {/* Amount */}
                  {interest.amount && (
                    <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                      <DollarSign className="h-5 w-5" />
                      ${interest.amount.toLocaleString()}
                    </div>
                  )}

                  {/* Message */}
                  {interest.message && (
                    <p className="text-sm text-muted-foreground">
                      "{interest.message}"
                    </p>
                  )}

                  {/* Bio */}
                  {interest.investor.bio && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {interest.investor.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/messages`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Contactar
                    </Button>
                    {interest.investor.linkedin_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(interest.investor.linkedin_url!, "_blank")}
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}