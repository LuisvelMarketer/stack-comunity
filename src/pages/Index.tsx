import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Trophy, Zap, Star, ArrowRight, Check, MessageCircle, Video, Calendar, Award, ChevronRight, Play, Sparkles, Globe, Lock, TrendingUp, BarChart3, Shield, Heart, MessageSquare, Share2 } from "lucide-react";
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

// Hook for scroll animation
const useScrollAnimation = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    });
    document.querySelectorAll(".animate-on-scroll").forEach(el => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
};

// Animated counter component
const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = ""
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
      }
    }, {
      threshold: 0.5
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};
const Index = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  useScrollAnimation();
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
    fetchCommunities();
  }, [user, navigate]);
  const fetchCommunities = async () => {
    const {
      data
    } = await supabase.from("communities").select("*").limit(3).order("member_count", {
      ascending: false
    });
    if (data) setCommunities(data);
  };
  const features = [{
    icon: Users,
    title: "Comunidades Ilimitadas",
    desc: "Crea y gestiona comunidades con miles de miembros activos"
  }, {
    icon: BookOpen,
    title: "Cursos Premium",
    desc: "Cursos estructurados con videos HD, quizzes y certificados"
  }, {
    icon: MessageCircle,
    title: "Chat en Tiempo Real",
    desc: "Mensajería instantánea con reacciones y threads"
  }, {
    icon: Video,
    title: "Lives Integrados",
    desc: "Sesiones en vivo con YouTube y Zoom sin salir de la plataforma"
  }, {
    icon: Trophy,
    title: "Gamificación Total",
    desc: "Puntos, niveles, logros, rachas y tablas de clasificación"
  }, {
    icon: Lock,
    title: "Contenido Protegido",
    desc: "Control total sobre quién accede a tu contenido premium"
  }];
  const stats = [{
    value: 10000,
    suffix: "+",
    label: "Estudiantes activos"
  }, {
    value: 500,
    suffix: "+",
    label: "Cursos creados"
  }, {
    value: 50,
    suffix: "+",
    label: "Comunidades"
  }, {
    value: 98,
    suffix: "%",
    label: "Satisfacción"
  }];
  return <div className="min-h-screen bg-background dark overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
      
      {/* Floating orbs */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/2 -right-32 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">Skoolify</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById("features")?.scrollIntoView({
            behavior: "smooth"
          })} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Características
            </button>
            <button onClick={() => document.getElementById("communities")?.scrollIntoView({
            behavior: "smooth"
          })} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comunidades
            </button>
            <button onClick={() => document.getElementById("pricing")?.scrollIntoView({
            behavior: "smooth"
          })} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-primary/30 blur-lg rounded-lg" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Iniciar Sesión
              </Button>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-primary/40 blur-lg rounded-lg group-hover:bg-primary/60 transition-colors" />
              </div>
              <Button size="sm" className="relative" onClick={() => navigate("/auth")}>
                Empezar Gratis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="relative inline-block mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm text-primary font-medium">La plataforma #1 de comunidades de aprendizaje</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-fade-in" style={{
            animationDelay: "0.2s"
          }}>
              <span className="block text-[#b58ff2]/[0.97]">Construye tu</span>
              <span className="block text-gradient glow-text">imperio educativo</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
              La plataforma todo-en-uno para crear, monetizar y escalar tu comunidad de aprendizaje. 
              Sin límites. Sin complicaciones.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{
            animationDelay: "0.4s"
          }}>
              <div className="relative group">
                <div className="absolute inset-0 -z-10">
                  <div className="absolute inset-0 bg-primary/50 blur-xl rounded-xl group-hover:bg-primary/70 transition-colors" />
                </div>
                <Button size="lg" className="relative h-14 px-8 text-lg bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => navigate("/auth")}>
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-xl" />
                </div>
                <Button size="lg" variant="outline" className="relative h-14 px-8 text-lg border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary" onClick={() => document.getElementById("demo")?.scrollIntoView({
                behavior: "smooth"
              })}>
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demo
                </Button>
              </div>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{
            animationDelay: "0.5s"
          }}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-background flex items-center justify-center" style={{
                  transform: `rotate(${i * 10}deg)`
                }}>
                      <span className="text-xs font-medium text-primary-foreground">
                        {["JD", "MA", "CR", "LP", "AS"][i - 1]}
                      </span>
                    </div>)}
                </div>
                <span className="font-medium text-foreground">+10,000 estudiantes</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />)}
                <span className="ml-1 font-medium text-foreground">4.9/5</span>
                <span className="text-muted-foreground">(500+ reviews)</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Demo Preview */}
          <div id="demo" className="mt-20 relative animate-fade-in-up" style={{
          animationDelay: "0.6s"
        }}>
            {/* Glow effect behind the card */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/30 blur-[100px] rounded-full animate-pulse" />
              <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-purple-500/20 blur-[80px] rounded-full" />
              <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-blue-500/15 blur-[60px] rounded-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="gradient-border rounded-2xl overflow-hidden shadow-glow-lg relative" style={{
            boxShadow: '0 0 80px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)'
          }}>
              <div className="bg-card p-1">
                {/* Browser mockup header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-t-xl">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-background/50 rounded-md text-xs text-muted-foreground">
                      app.skoolify.com/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard mockup */}
                <div className="aspect-[16/9] bg-gradient-to-br from-muted/30 to-background p-6 rounded-b-xl">
                  <div className="grid grid-cols-12 gap-4 h-full">
                    {/* Sidebar mockup */}
                    <div className="col-span-2 bg-card/80 rounded-lg p-3 space-y-3 border border-border/30">
                      <div className="h-8 rounded-md bg-primary/30 flex items-center gap-2 px-2">
                        <div className="w-4 h-4 rounded bg-primary/50" />
                        <div className="h-3 flex-1 bg-primary/20 rounded" />
                      </div>
                      {['Feed', 'Cursos', 'Eventos', 'Chat'].map((item, i) => <div key={i} className="h-8 rounded-md bg-muted/30 flex items-center gap-2 px-2 hover:bg-muted/50 transition-colors">
                          <div className="w-4 h-4 rounded bg-muted-foreground/20" />
                          <span className="text-[10px] text-muted-foreground/60">{item}</span>
                        </div>)}
                    </div>
                    {/* Main content mockup - Feed */}
                    <div className="col-span-7 space-y-3">
                      {/* Welcome banner */}
                      <div className="h-20 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 rounded-lg p-3 flex items-center gap-3 border border-primary/20">
                        <div className="w-10 h-10 rounded-full bg-primary/40 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary-foreground/80" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 w-32 bg-foreground/30 rounded mb-1.5" />
                          <div className="h-2 w-48 bg-muted-foreground/20 rounded" />
                        </div>
                      </div>
                      {/* Post cards - más contenido */}
                      {[1, 2, 3].map(i => <div key={i} className="bg-card/60 rounded-lg p-3 border border-border/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20" />
                            <div className="flex-1">
                              <div className="h-2.5 w-20 bg-foreground/30 rounded mb-1" />
                              <div className="h-2 w-12 bg-muted-foreground/20 rounded" />
                            </div>
                          </div>
                          <div className="space-y-1.5 mb-2">
                            <div className="h-2.5 w-full bg-muted-foreground/15 rounded" />
                            <div className="h-2.5 w-4/5 bg-muted-foreground/15 rounded" />
                          </div>
                          {/* Image placeholder en algunos posts */}
                          {i === 1 && <div className="h-24 w-full bg-gradient-to-br from-primary/10 to-muted/20 rounded-md mb-2 flex items-center justify-center">
                            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                              <Play className="w-4 h-4 text-primary/50" />
                            </div>
                          </div>}
                          <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-primary/40" />
                              <span className="text-[9px] text-muted-foreground/50">{12 + i * 8}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-muted-foreground/40" />
                              <span className="text-[9px] text-muted-foreground/50">{3 + i * 2}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="w-3 h-3 text-muted-foreground/30" />
                            </div>
                          </div>
                        </div>)}
                    </div>
                    {/* Right sidebar mockup */}
                    <div className="col-span-3 space-y-3">
                      {/* Leaderboard */}
                      <div className="bg-card/60 rounded-lg p-3 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Trophy className="w-4 h-4 text-yellow-500/70" />
                          <span className="text-xs text-foreground/70 font-medium">Leaderboard</span>
                        </div>
                        {[1, 2, 3].map(i => <div key={i} className="flex items-center gap-2 mb-2 py-1">
                            <span className="text-[10px] text-muted-foreground/50 w-4">{i}.</span>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/20" />
                            <div className="flex-1 h-3 bg-muted/30 rounded" />
                            <span className="text-[10px] text-primary/70">{500 - i * 80}pts</span>
                          </div>)}
                      </div>
                      {/* Upcoming events */}
                      <div className="bg-card/60 rounded-lg p-3 border border-border/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-primary/70" />
                          <span className="text-xs text-foreground/70 font-medium">Próximos</span>
                        </div>
                        {[1, 2].map(i => <div key={i} className="flex items-center gap-2 mb-2 py-1">
                            <div className="w-8 h-8 rounded bg-primary/10 flex flex-col items-center justify-center">
                              <span className="text-[8px] text-primary/70">DIC</span>
                              <span className="text-[10px] text-foreground/70 font-bold">{10 + i}</span>
                            </div>
                            <div className="flex-1">
                              <div className="h-2 w-16 bg-foreground/20 rounded mb-1" />
                              <div className="h-2 w-10 bg-muted-foreground/15 rounded" />
                            </div>
                          </div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => <div key={i} className="text-center animate-on-scroll" style={{
            transitionDelay: `${i * 100}ms`
          }}>
                <div className="text-4xl md:text-6xl font-bold text-gradient mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              Características
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-muted-foreground md:text-6xl">
              Todo lo que necesitas,<br />
              <span className="text-gradient">nada que te sobre</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa diseñada para crear la mejor experiencia de comunidad y aprendizaje
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => <div key={i} className="group relative p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 animate-on-scroll" style={{
            transitionDelay: `${i * 100}ms`
          }}>
                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl" />
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Featured Communities */}
      {communities.length > 0 && <section id="communities" className="py-24 px-4 relative">
          <div className="container mx-auto">
            <div className="text-center mb-16 animate-on-scroll">
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Globe className="w-3 h-3 mr-1" />
                Comunidades
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-muted-foreground">
                Únete a comunidades<br />
                <span className="text-gradient">que te inspiran</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explora comunidades activas y comienza tu viaje de aprendizaje hoy
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {communities.map((community, i) => <div key={community.id} className="relative group animate-on-scroll" style={{
            transitionDelay: `${i * 150}ms`
          }}>
                  {/* Glow effect */}
                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-primary/25 blur-xl rounded-2xl" />
                  </div>
                  <Card className="cursor-pointer bg-card/50 border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 overflow-hidden h-full" onClick={() => navigate(`/c/${community.slug}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16 rounded-xl ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                        {community.image_url && <AvatarImage src={community.image_url} />}
                        <AvatarFallback className="rounded-xl bg-gradient-primary text-primary-foreground text-xl font-bold">
                          {community.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                          {community.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {community.member_count} miembros
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {community.description || "Una comunidad increíble de aprendizaje"}
                    </p>
                    <div className="flex items-center justify-between">
                      {community.is_paid ? <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          ${community.price_monthly}/mes
                        </Badge> : <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Gratis
                        </Badge>}
                      <Button variant="ghost" size="sm" className="group-hover:text-primary">
                        Explorar
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>)}
            </div>

            <div className="text-center mt-12 animate-on-scroll">
              <div className="relative inline-block group">
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-xl" />
                </div>
                <Button variant="outline" size="lg" className="relative border-border/50 hover:bg-muted/50 hover:border-primary/50" onClick={() => navigate("/communities")}>
                  Ver todas las comunidades
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>}

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              Precios
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Empieza gratis,<br />
              <span className="text-gradient">crece sin límites</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explora comunidades gratis. Paga solo por las que elijas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="relative animate-on-scroll group" style={{
            transitionDelay: "100ms"
          }}>
              {/* Glow effect */}
              <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl" />
              </div>
              <Card className="h-full bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Para Estudiantes</h3>
                      <p className="text-sm text-muted-foreground">Explora y aprende sin límites</p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <span className="text-5xl font-bold">$0</span>
                    <span className="text-muted-foreground">/siempre</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {["Acceso a comunidades gratuitas", "Cursos disponibles sin costo", "Chat y networking ilimitado", "Gamificación y logros", "Eventos y lives", "Paga solo por contenido premium"].map(item => <li key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>)}
                  </ul>

                  <Button className="w-full h-12" onClick={() => navigate("/auth")}>
                    Crear cuenta gratis
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Creator Plan */}
            <div className="relative animate-on-scroll group" style={{
            transitionDelay: "200ms"
          }}>
              {/* Glow effect - siempre visible para este plan */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-2xl group-hover:bg-primary/40 transition-colors" />
              </div>
              <div className="absolute -inset-px bg-gradient-primary rounded-2xl opacity-50 blur-sm" />
              <Card className="relative h-full bg-card border-primary/50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground border-0 px-4 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Para Creadores</h3>
                      <p className="text-sm text-muted-foreground">Monetiza tu conocimiento</p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <span className="text-5xl font-bold">$49</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {["Tu propia comunidad privada", "Cursos y contenido ilimitado", "Cobra a tus miembros", "Lives con YouTube/Zoom", "Sistema de afiliados", "Analytics y reportes", "Soporte prioritario 24/7"].map(item => <li key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span>{item}</span>
                      </li>)}
                  </ul>

                  <Button variant="outline" className="w-full h-12 border-primary/50 hover:bg-primary/10" onClick={() => navigate("/auth")}>
                    Próximamente
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto text-center max-w-3xl relative animate-on-scroll">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-primary/50 blur-2xl rounded-full scale-150" />
            </div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center animate-float">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            ¿Listo para construir<br />
            <span className="text-gradient">tu comunidad?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Únete a miles de creadores que ya están monetizando su conocimiento con Skoolify
          </p>
          <div className="relative inline-block group">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-primary/50 blur-2xl rounded-xl group-hover:bg-primary/70 transition-colors" />
            </div>
            <Button size="lg" className="relative h-14 px-10 text-lg bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => navigate("/auth")}>
              Empezar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No requiere tarjeta de crédito • Setup en 2 minutos
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Skoolify</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Términos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Skoolify. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;