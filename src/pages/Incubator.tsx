import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";
import { IncubatorProjectCard } from "@/components/incubator/IncubatorProjectCard";
import { InvestorProfileDialog } from "@/components/incubator/InvestorProfileDialog";
import { MyIncubatorProjects } from "@/components/incubator/MyIncubatorProjects";
import { MyInvestments } from "@/components/incubator/MyInvestments";
import { 
  Lightbulb, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign,
  Rocket,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface IncubatorProject {
  id: string;
  project_id: string | null;
  user_id: string;
  pitch: string;
  funding_goal: number;
  funding_received: number;
  equity_offered: number | null;
  status: string;
  business_model: string | null;
  target_market: string | null;
  team_size: number;
  video_pitch_url: string | null;
  deck_url: string | null;
  created_at: string;
  build_project?: {
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    live_url: string | null;
    tech_stack: string[];
  } | null;
  founder?: {
    full_name: string | null;
    avatar_url: string | null;
    level: number;
  } | null;
  interests_count?: number;
}

interface InvestorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  investment_range_min: number;
  investment_range_max: number;
  interests: string[];
  is_verified: boolean;
  total_investments: number;
}

export default function Incubator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IncubatorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [investorDialogOpen, setInvestorDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalFunded: 0,
    totalInvestors: 0,
    totalRaised: 0,
  });

  useEffect(() => {
    loadProjects();
    loadInvestorProfile();
    loadStats();
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("incubator_projects")
      .select(`
        *,
        build_project:project_id (
          title,
          description,
          thumbnail_url,
          live_url,
          tech_stack
        )
      `)
      .in("status", ["approved", "funded"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch founder profiles separately
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, level")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch interest counts
      const projectIds = data.map(p => p.id);
      const { data: interests } = await supabase
        .from("investment_interests")
        .select("incubator_project_id")
        .in("incubator_project_id", projectIds);

      const interestCounts = new Map<string, number>();
      interests?.forEach(i => {
        const count = interestCounts.get(i.incubator_project_id) || 0;
        interestCounts.set(i.incubator_project_id, count + 1);
      });

      const projectsWithProfiles = data.map(project => ({
        ...project,
        founder: profilesMap.get(project.user_id) || null,
        interests_count: interestCounts.get(project.id) || 0,
      }));

      setProjects(projectsWithProfiles);
    }
    setLoading(false);
  };

  const loadInvestorProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("investor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setInvestorProfile(data as InvestorProfile | null);
  };

  const loadStats = async () => {
    const [projectsRes, investorsRes] = await Promise.all([
      supabase.from("incubator_projects").select("status, funding_received", { count: "exact" }).in("status", ["approved", "funded"]),
      supabase.from("investor_profiles").select("id", { count: "exact" }),
    ]);

    const totalRaised = projectsRes.data?.reduce((sum, p) => sum + (Number(p.funding_received) || 0), 0) || 0;
    const fundedCount = projectsRes.data?.filter(p => p.status === "funded").length || 0;

    setStats({
      totalProjects: projectsRes.count || 0,
      totalFunded: fundedCount,
      totalInvestors: investorsRes.count || 0,
      totalRaised,
    });
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.build_project?.title?.toLowerCase().includes(query) ||
      project.pitch.toLowerCase().includes(query) ||
      project.target_market?.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Incubadora de Ideas</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            La incubadora conecta proyectos prometedores de estudiantes con micro-inversores 
            interesados en apoyar el próximo gran emprendimiento.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
                <p className="text-xs text-muted-foreground">Proyectos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalFunded}</p>
                <p className="text-xs text-muted-foreground">Financiados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalInvestors}</p>
                <p className="text-xs text-muted-foreground">Inversores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalRaised.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Recaudado</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="explore" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="explore">Explorar</TabsTrigger>
              <TabsTrigger value="my-projects">Mis Proyectos</TabsTrigger>
              <TabsTrigger value="investments">Mis Inversiones</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {!investorProfile ? (
                <Button variant="outline" onClick={() => setInvestorDialogOpen(true)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ser Inversor
                </Button>
              ) : (
                <Badge variant="secondary" className="py-1.5">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Inversor {investorProfile.is_verified && "Verificado"}
                </Badge>
              )}
            </div>
          </div>

          <TabsContent value="explore" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay proyectos aún</h3>
                  <p className="text-muted-foreground mb-4">
                    Sé el primero en enviar tu proyecto a la incubadora
                  </p>
                  <Button onClick={() => navigate("/build-in-public")}>
                    Ver mis proyectos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <IncubatorProjectCard
                    key={project.id}
                    project={project}
                    investorProfile={investorProfile}
                    onRefresh={loadProjects}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-projects">
            <MyIncubatorProjects onRefresh={loadProjects} />
          </TabsContent>

          <TabsContent value="investments">
            <MyInvestments investorProfile={investorProfile} />
          </TabsContent>
        </Tabs>
      </div>

      <InvestorProfileDialog
        open={investorDialogOpen}
        onOpenChange={setInvestorDialogOpen}
        profile={investorProfile}
        onSuccess={() => {
          loadInvestorProfile();
          setInvestorDialogOpen(false);
        }}
      />
    </MainLayout>
  );
}