import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { InvestorProfileDialog } from "./InvestorProfileDialog";
import { 
  DollarSign, 
  TrendingUp, 
  MessageCircle,
  Calendar,
  ExternalLink,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Investment {
  id: string;
  amount: number | null;
  message: string | null;
  status: string;
  created_at: string;
  project: {
    id: string;
    pitch: string;
    funding_goal: number;
    funding_received: number;
    status: string;
    user_id: string;
    build_project?: {
      title: string;
      thumbnail_url: string | null;
      live_url: string | null;
    } | null;
    founder?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

interface MyInvestmentsProps {
  investorProfile: {
    id: string;
    user_id: string;
    bio: string | null;
    investment_range_min: number;
    investment_range_max: number;
    interests: string[];
    linkedin_url?: string | null;
  } | null;
}

export function MyInvestments({ investorProfile }: MyInvestmentsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    if (investorProfile) {
      loadInvestments();
    } else {
      setLoading(false);
    }
  }, [investorProfile]);

  const loadInvestments = async () => {
    if (!investorProfile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("investment_interests")
      .select(`
        *,
        project:incubator_project_id (
          id,
          pitch,
          funding_goal,
          funding_received,
          status,
          user_id,
          build_project:project_id (
            title,
            thumbnail_url,
            live_url
          )
        )
      `)
      .eq("investor_id", investorProfile.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch founder profiles
      const userIds = [...new Set(data.map((d: any) => d.project?.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const investmentsWithProfiles = data.map((investment: any) => ({
        ...investment,
        project: {
          ...investment.project,
          founder: profilesMap.get(investment.project?.user_id) || null,
        },
      }));

      setInvestments(investmentsWithProfiles);
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

  const totalInvested = investments
    .filter(i => i.status === "invested")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalPotential = investments
    .filter(i => ["interested", "in_talks", "committed"].includes(i.status))
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  if (!investorProfile) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Conviértete en inversor</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu perfil de inversor para empezar a explorar oportunidades de inversión
          </p>
          <Button onClick={() => setEditProfileOpen(true)}>
            Crear perfil de inversor
          </Button>
          <InvestorProfileDialog
            open={editProfileOpen}
            onOpenChange={setEditProfileOpen}
            profile={null}
            onSuccess={() => {
              setEditProfileOpen(false);
              window.location.reload();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total invertido</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalInvested.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En negociación</p>
            <p className="text-2xl font-bold">
              ${totalPotential.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Proyectos</p>
            <p className="text-2xl font-bold">{investments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Actions */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Editar perfil inversor
        </Button>
      </div>

      {/* Investments List */}
      {investments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes inversiones aún</h3>
            <p className="text-muted-foreground">
              Explora la incubadora para encontrar proyectos interesantes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => (
            <Card key={investment.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {investment.project.build_project?.thumbnail_url ? (
                    <img
                      src={investment.project.build_project.thumbnail_url}
                      alt={investment.project.build_project.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {investment.project.build_project?.title || "Proyecto"}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <UserAvatar
                            src={investment.project.founder?.avatar_url}
                            fallback={investment.project.founder?.full_name?.charAt(0) || "F"}
                            size="sm"
                            showLevel={false}
                          />
                          <span>{investment.project.founder?.full_name || "Fundador"}</span>
                        </div>
                      </div>
                      {getStatusBadge(investment.status)}
                    </div>

                    {/* Amount */}
                    {investment.amount && (
                      <div className="flex items-center gap-1 text-lg font-semibold text-green-600 mb-2">
                        <DollarSign className="h-4 w-4" />
                        {investment.amount.toLocaleString()}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(investment.created_at), "d MMM yyyy", { locale: es })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/messages")}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Contactar
                      </Button>
                      {investment.project.build_project?.live_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(investment.project.build_project!.live_url!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver app
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InvestorProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={investorProfile}
        onSuccess={() => {
          setEditProfileOpen(false);
          loadInvestments();
        }}
      />
    </div>
  );
}