import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Users, Trophy, Zap, Star, ArrowRight, Check, 
  MessageCircle, Video, Calendar, Award, ChevronRight, Play
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
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
    fetchCommunities();
  }, [user, navigate]);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from("communities")
      .select("*")
      .limit(6)
      .order("member_count", { ascending: false });
    if (data) setCommunities(data);
  };

  const features = [
    { icon: Users, title: "Comunidades", desc: "Crea y gestiona comunidades con miles de miembros" },
    { icon: BookOpen, title: "Cursos", desc: "Cursos estructurados con videos, quizzes y certificados" },
    { icon: MessageCircle, title: "Chat en tiempo real", desc: "Mensajería instantánea para tu comunidad" },
    { icon: Video, title: "Lives", desc: "Sesiones en vivo con YouTube y Zoom integrado" },
    { icon: Calendar, title: "Eventos", desc: "Calendario con eventos recurrentes y RSVP" },
    { icon: Trophy, title: "Gamificación", desc: "Puntos, niveles, logros y leaderboards" },
  ];

  const testimonials = [
    { name: "Carlos M.", role: "Creador de comunidad", text: "Skoolify transformó mi negocio. Ahora tengo 500+ miembros activos.", avatar: null },
    { name: "Ana L.", role: "Estudiante", text: "La mejor plataforma para aprender. Los cursos son increíbles.", avatar: null },
    { name: "Miguel R.", role: "Instructor", text: "Fácil de usar y mis alumnos adoran la gamificación.", avatar: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Skoolify
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/communities")}>
              Explorar
            </Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Empezar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            <Zap className="h-3 w-3 mr-1" />
            La plataforma #1 de comunidades
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Crea tu comunidad de{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              aprendizaje
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Todo lo que necesitas para crear, monetizar y hacer crecer tu comunidad. 
            Cursos, chat, eventos, gamificación y más en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-lg" onClick={() => navigate("/auth")}>
              Crear mi comunidad gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" onClick={() => navigate("/communities")}>
              <Play className="mr-2 h-5 w-5" />
              Explorar comunidades
            </Button>
          </div>
          
          {/* Social proof */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background" />
                ))}
              </div>
              <span>+10,000 miembros</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Communities */}
      {communities.length > 0 && (
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Comunidades destacadas</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Únete a comunidades activas y comienza a aprender hoy
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
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
                        <p className="text-sm text-muted-foreground">
                          {community.member_count} miembros
                        </p>
                      </div>
                      {community.is_paid && (
                        <Badge variant="secondary">${community.price_monthly}/mes</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {community.description || "Una comunidad increíble de aprendizaje"}
                    </p>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver comunidad
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" size="lg" onClick={() => navigate("/communities")}>
                Ver todas las comunidades
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa para crear la mejor experiencia de comunidad
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="border-0 shadow-none bg-muted/30 hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple y transparente</h2>
            <p className="text-muted-foreground">
              Crea tu comunidad gratis. Solo pagas cuando monetizas.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="relative">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Gratis</h3>
                <p className="text-muted-foreground mb-6">Para empezar tu comunidad</p>
                <div className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
                <ul className="space-y-3 mb-8">
                  {["Hasta 100 miembros", "1 curso", "Chat de comunidad", "Eventos básicos", "Gamificación"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Empezar gratis
                </Button>
              </CardContent>
            </Card>
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Más popular</Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-muted-foreground mb-6">Para creadores serios</p>
                <div className="text-4xl font-bold mb-6">$29<span className="text-lg font-normal text-muted-foreground">/mes</span></div>
                <ul className="space-y-3 mb-8">
                  {["Miembros ilimitados", "Cursos ilimitados", "Lives con YouTube/Zoom", "Suscripciones de pago", "Afiliados", "Soporte prioritario"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Empezar prueba gratis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <Award className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comienza a construir tu comunidad hoy
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Únete a miles de creadores que ya están monetizando su conocimiento
          </p>
          <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" onClick={() => navigate("/auth")}>
            Crear mi comunidad gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Skoolify
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Términos</a>
              <a href="#" className="hover:text-foreground">Privacidad</a>
              <a href="#" className="hover:text-foreground">Contacto</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Skoolify. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
