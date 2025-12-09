import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Clock, 
  ShoppingCart,
  Plus,
  Briefcase,
  TrendingUp
} from "lucide-react";
import { CreateServiceDialog } from "@/components/marketplace/CreateServiceDialog";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { MyServicesTab } from "@/components/marketplace/MyServicesTab";
import { MyOrdersTab } from "@/components/marketplace/MyOrdersTab";

interface StudentService {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_days: number;
  skills: string[];
  portfolio_urls: string[];
  is_active: boolean;
  orders_completed: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    level: number;
    points: number;
  };
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<StudentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const categories = [
    { id: "all", label: "Todos" },
    { id: "mvp", label: "MVP / App" },
    { id: "landing", label: "Landing Page" },
    { id: "automation", label: "Automatización" },
    { id: "design", label: "Diseño UI/UX" },
    { id: "other", label: "Otros" },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from("student_services")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            level,
            points
          )
        `)
        .eq("is_active", true)
        .order("rating_average", { ascending: false });

      if (error) throw error;
      setServices((data as any) || []);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const topSellers = services
    .filter((s) => s.orders_completed > 0)
    .sort((a, b) => b.orders_completed - a.orders_completed)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Marketplace de Estudiantes</h1>
          </div>
          <div className="ml-auto">
            {user && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ofrecer Servicio
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList>
            <TabsTrigger value="explore">Explorar</TabsTrigger>
            {user && <TabsTrigger value="my-services">Mis Servicios</TabsTrigger>}
            {user && <TabsTrigger value="my-orders">Mis Pedidos</TabsTrigger>}
          </TabsList>

          <TabsContent value="explore" className="space-y-6">
            {/* Hero Section */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Encuentra estudiantes que construyan tu MVP
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Conecta con estudiantes avanzados que pueden convertir tu idea en realidad.
                Sin código, sin complicaciones.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar servicios..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              {/* Main Content */}
              <div className="space-y-6">
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>

                {/* Services Grid */}
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                          <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredServices.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay servicios disponibles
                      </p>
                      {user && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setIsCreateOpen(true)}
                        >
                          Sé el primero en ofrecer
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onRefresh={loadServices}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Top Sellers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Top Vendedores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topSellers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aún no hay vendedores
                      </p>
                    ) : (
                      topSellers.map((service, index) => (
                        <div
                          key={service.id}
                          className="flex items-center gap-3"
                        >
                        <span className="text-sm font-bold text-muted-foreground w-4">
                            #{index + 1}
                          </span>
                          <UserAvatar
                            src={service.profiles?.avatar_url}
                            fallback={service.profiles?.full_name?.charAt(0) || "U"}
                            level={service.profiles?.level || 1}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {service.profiles?.full_name || "Usuario"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {service.orders_completed} pedidos completados
                            </p>
                          </div>
                          {service.rating_average > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{service.rating_average}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Servicios activos
                      </span>
                      <span className="font-medium">{services.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Vendedores
                      </span>
                      <span className="font-medium">
                        {new Set(services.map((s) => s.user_id)).size}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {user && (
            <TabsContent value="my-services">
              <MyServicesTab onRefresh={loadServices} />
            </TabsContent>
          )}

          {user && (
            <TabsContent value="my-orders">
              <MyOrdersTab />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <CreateServiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadServices}
      />
    </div>
  );
}
