import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Users, ArrowLeft, ChevronRight, Star, 
  TrendingUp, Clock
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  member_count: number;
  is_paid: boolean | null;
  price_monthly: number | null;
  created_at: string;
  is_member?: boolean;
}

export default function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [sort, setSort] = useState<"popular" | "newest">("popular");

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  useEffect(() => {
    let result = [...communities];

    if (searchQuery) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter === "free") {
      result = result.filter(c => !c.is_paid);
    } else if (filter === "paid") {
      result = result.filter(c => c.is_paid);
    }

    if (sort === "popular") {
      result.sort((a, b) => b.member_count - a.member_count);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredCommunities(result);
  }, [communities, searchQuery, filter, sort]);

  const fetchCommunities = async () => {
    try {
      const { data: communitiesData, error } = await supabase
        .from("communities")
        .select("*")
        .order("member_count", { ascending: false });

      if (error) throw error;

      if (user) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id);

        const memberIds = new Set(memberships?.map(m => m.community_id) || []);
        const communitiesWithMembership = (communitiesData || []).map(c => ({
          ...c,
          is_member: memberIds.has(c.id)
        }));
        setCommunities(communitiesWithMembership);
      } else {
        setCommunities(communitiesData || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const featuredCommunity = communities[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Explorar Comunidades</h1>
                <p className="text-sm text-muted-foreground">
                  Encuentra tu comunidad perfecta
                </p>
              </div>
            </div>
            {user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Iniciar Sesión
                </Button>
                <Button onClick={() => navigate("/auth")}>
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar comunidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="flex gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="free">Gratis</TabsTrigger>
                <TabsTrigger value="paid">De pago</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant={sort === "popular" ? "default" : "outline"}
              size="icon"
              onClick={() => setSort("popular")}
              title="Más populares"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant={sort === "newest" ? "default" : "outline"}
              size="icon"
              onClick={() => setSort("newest")}
              title="Más recientes"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Featured Community */}
        {featuredCommunity && !searchQuery && filter === "all" && (
          <Card 
            className="mb-8 overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => navigate(`/communities/${featuredCommunity.slug}`)}
          >
            <div className="md:flex">
              <div className="md:w-1/3 h-48 md:h-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Avatar className="h-24 w-24 rounded-2xl">
                  {featuredCommunity.image_url && <AvatarImage src={featuredCommunity.image_url} />}
                  <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-3xl">
                    {featuredCommunity.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardContent className="md:w-2/3 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      Destacada
                    </Badge>
                    <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {featuredCommunity.name}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      {featuredCommunity.member_count} miembros
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {featuredCommunity.is_paid ? (
                      <Badge className="text-lg px-4 py-1">${featuredCommunity.price_monthly}/mes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-lg px-4 py-1">Gratis</Badge>
                    )}
                    {featuredCommunity.is_member && (
                      <Badge variant="outline" className="border-green-500 text-green-600">Miembro</Badge>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {featuredCommunity.description || "Una comunidad increíble de aprendizaje"}
                </p>
                <Button className="group-hover:bg-primary group-hover:text-primary-foreground">
                  Ver comunidad
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </div>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredCommunities.length} comunidad{filteredCommunities.length !== 1 ? "es" : ""} encontrada{filteredCommunities.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron comunidades</h3>
              <p className="text-muted-foreground">
                Intenta con otros términos de búsqueda o filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Card 
                key={community.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(`/communities/${community.slug}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14 rounded-xl">
                      {community.image_url && <AvatarImage src={community.image_url} />}
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl">
                        {community.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {community.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {community.member_count} miembros
                      </p>
                    </div>
                    {community.is_member && (
                      <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                        Miembro
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                    {community.description || "Una comunidad de aprendizaje increíble"}
                  </p>
                  <div className="flex items-center justify-between">
                    {community.is_paid ? (
                      <Badge>${community.price_monthly}/mes</Badge>
                    ) : (
                      <Badge variant="secondary">Gratis</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                      Ver más
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
