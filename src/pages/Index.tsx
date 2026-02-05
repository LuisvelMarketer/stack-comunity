import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, Trophy, Zap, Star, ArrowRight, Check, MessageCircle, Video, Calendar, Award, ChevronRight, Play, Globe, Lock, TrendingUp, BarChart3, Shield, Heart, MessageSquare, Share2, Sparkles } from "lucide-react";
import stackLogo from "@/assets/stack-logo.png";
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

// Hook for advanced scroll animations with multiple animation types
const useScrollAnimation = (deps: any[] = []) => {
  useEffect(() => {
    const animationClasses = [
      'scroll-fade-up', 'scroll-fade-down', 'scroll-fade-left', 'scroll-fade-right',
      'scroll-scale', 'scroll-scale-bounce', 'scroll-blur', 'scroll-rotate',
      'scroll-flip', 'scroll-tilt', 'scroll-zoom-blur', 'scroll-spring',
      'scroll-clip', 'animate-on-scroll'
    ];
    
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -80px 0px"
    });
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      animationClasses.forEach(className => {
        document.querySelectorAll(`.${className}`).forEach(el => {
          observer.observe(el);
        });
      });
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, deps);
};

// Parallax hook for depth effect
const useParallax = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const speed = parseFloat((el as HTMLElement).dataset.parallax || '0.5');
        (el as HTMLElement).style.transform = `translateY(${scrollY * speed}px)`;
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
  useScrollAnimation([communities]);
  useParallax();

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
      {/* Background effects with parallax */}
      <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
      
      {/* Floating orbs with parallax and glow */}
      <div data-parallax="-0.15" className="fixed top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-glow-breathe" />
      <div data-parallax="-0.1" className="fixed top-1/2 -right-32 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-glow-breathe" style={{ animationDelay: '1s' }} />
      <div data-parallax="-0.2" className="fixed bottom-1/4 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-glow-breathe" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-lg rounded-xl" />
              <img src={stackLogo} alt="STACK" className="relative w-12 h-12 rounded-xl" />
            </div>
            <span className="text-2xl font-bold tracking-widest text-primary" style={{ textShadow: '0 0 30px hsl(171 52% 56% / 0.5)' }}>STACK</span>
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground">
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
      <section className="relative pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="scroll-scale-bounce stagger-1" style={{
            animationDelay: "0.1s"
          }}>
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 -z-10">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-glow-breathe" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-sm text-primary font-medium">Infrastructure for the Elite</span>
                </div>
              </div>
            </div>

            {/* Main headline with blur in effect */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 scroll-blur stagger-2">
              <span className="block text-primary" style={{
              textShadow: '0 0 40px hsl(171 52% 56% / 0.6), 0 0 80px hsl(171 52% 56% / 0.4)'
            }}>Build your</span>
              <span className="block text-gradient glow-text" style={{
              textShadow: '0 0 60px hsl(171 52% 56% / 0.7), 0 0 100px hsl(171 52% 56% / 0.5)'
            }}>elite network</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed scroll-fade-up stagger-3">
              The all-in-one platform to create, monetize and scale your learning community. 
              No limits. No complications.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 scroll-spring stagger-4">
              <div className="relative group hover-lift">
                <div className="absolute inset-0 -z-10">
                  <div className="absolute inset-0 bg-primary/50 blur-xl rounded-xl group-hover:bg-primary/70 transition-colors animate-pulse-glow" />
                </div>
                <Button size="lg" className="relative h-14 px-8 text-lg bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => navigate("/auth")}>
                  Get Started Free
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
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground scroll-fade-up stagger-5">
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
                <span className="font-medium text-foreground">+10,000 members</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />)}
                <span className="ml-1 font-medium text-foreground">4.9/5</span>
                <span className="text-muted-foreground">(500+ reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VSL Video Section */}
      <section className="relative py-12 px-4">
        <div className="container mx-auto">
          <div id="demo" className="relative scroll-zoom-blur">
            {/* Title and subtitle */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Discover the power of STACK
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                In less than 3 minutes you'll understand why thousands of creators choose our platform
              </p>
            </div>

            {/* Glow effect behind the video */}
            <div className="absolute inset-0 -z-10 top-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-primary/50 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-primary/30 blur-[100px] rounded-full" />
              <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-primary/25 blur-[80px] rounded-full" />
            </div>
            
            <div className="gradient-border rounded-2xl overflow-hidden shadow-glow-lg relative group cursor-pointer" style={{
            boxShadow: '0 0 100px hsl(171 52% 56% / 0.4), 0 0 50px hsl(171 52% 56% / 0.25)'
          }}>
              <div className="bg-card/90 backdrop-blur-sm p-1">
                {/* Browser mockup header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-t-xl">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-background/50 rounded-md text-xs text-muted-foreground">
                       stack.com/demo
                    </div>
                  </div>
                </div>
                
                {/* Video placeholder */}
                <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 via-background to-muted/30 rounded-b-xl relative overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
                  
                  {/* Decorative elements */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                  </div>
                  
                  {/* Play button container */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    {/* Play button with glow */}
                    <div className="relative group/play">
                      {/* Pulsing ring */}
                      <div className="absolute inset-0 -m-4 bg-primary/30 rounded-full animate-ping" style={{
                      animationDuration: '2s'
                    }} />
                      <div className="absolute inset-0 -m-2 bg-primary/20 rounded-full animate-pulse" />
                      
                      {/* Main play button */}
                      <div className="relative w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-glow transition-transform duration-300 group-hover/play:scale-110" style={{
                      boxShadow: '0 0 40px hsl(171 52% 56% / 0.6)'
                    }}>
                        <Play className="w-8 h-8 md:w-12 md:h-12 text-primary-foreground fill-primary-foreground ml-1" />
                      </div>
                    </div>
                    
                    {/* Duration badge */}
                    <div className="mt-6 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">3:24</span>
                    </div>
                  </div>
                  
                  {/* Hover text */}
                  <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm text-muted-foreground bg-background/60 backdrop-blur-sm px-4 py-2 rounded-full">
                      Haz clic para reproducir
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Social proof below video */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>+50,000 visualizaciones</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>Valoración 4.9/5</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Tutorial completo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => <div key={i} className={`text-center scroll-scale-bounce stagger-${i + 1}`}>
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
          <div className="text-center mb-16 scroll-blur">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              Características
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-foreground md:text-6xl">
              Todo lo que necesitas,<br />
              <span className="text-gradient">nada que te sobre</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa diseñada para crear la mejor experiencia de comunidad y aprendizaje
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => <div key={i} className={`group relative p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 hover-lift ${i < 3 ? 'scroll-flip' : 'scroll-tilt'} stagger-${(i % 6) + 1}`}>
                {/* Backlight glow effect - illuminated from behind */}
                <div className="absolute -inset-1 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-2xl animate-glow-breathe" />
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
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
            <div className="text-center mb-16 scroll-fade-up">
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Globe className="w-3 h-3 mr-1" />
                Comunidades
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Únete a comunidades<br />
                <span className="text-gradient">que te inspiran</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explora comunidades activas y comienza tu viaje de aprendizaje hoy
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {communities.map((community, i) => <div key={community.id} className={`relative group scroll-rotate hover-lift stagger-${i + 1}`}>
                  {/* Glow effect - subtle backlight */}
                  <div className="absolute -inset-1 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-2xl animate-glow-breathe" />
                  </div>
                  <Card className="cursor-pointer bg-card/50 border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300 overflow-hidden h-full" onClick={() => navigate(`/c/${community.slug}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16 rounded-xl ring-2 ring-primary/20 group-hover:ring-primary/50 group-hover:scale-105 transition-all">
                        {community.image_url && <AvatarImage src={community.image_url} />}
                        <AvatarFallback className="rounded-xl bg-gradient-primary text-primary-foreground text-xl font-bold">
                          {community.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
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

            <div className="text-center mt-12 scroll-scale stagger-4">
              <div className="relative inline-block group hover-lift">
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-xl" />
                </div>
                <Button variant="outline" size="lg" className="relative border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary" onClick={() => navigate("/communities")}>
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
          <div className="text-center mb-16 scroll-blur">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              Precios
            </Badge>
            <h2 className="text-4xl font-bold mb-6 md:text-6xl text-foreground">
              Empieza gratis,<br />
              <span className="text-gradient">crece sin límites</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explora comunidades gratis. Paga solo por las que elijas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="relative scroll-fade-left stagger-1 group hover-lift">
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
                    {["Acceso a comunidades gratuitas", "Cursos disponibles sin costo", "Chat y networking ilimitado", "Gamificación y logros", "Eventos y lives", "Paga solo por contenido premium"].map((item, i) => <li key={item} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>)}
                  </ul>

                  <Button className="w-full h-12 hover-glow" onClick={() => navigate("/auth")}>
                    Crear cuenta gratis
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Creator Plan */}
            <div className="relative scroll-fade-right stagger-2 group hover-lift">
              {/* Glow effect - siempre visible para este plan */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-2xl group-hover:bg-primary/40 transition-colors animate-glow-breathe" />
              </div>
              <div className="absolute -inset-px bg-gradient-primary rounded-2xl opacity-50 blur-sm" />
              <Card className="relative h-full bg-card border-primary/50">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground border-0 px-4 py-1 animate-pulse-scale">
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
                    {["Tu propia comunidad privada", "Cursos y contenido ilimitado", "Cobra a tus miembros", "Lives con YouTube/Zoom", "Sistema de afiliados", "Analytics y reportes", "Soporte prioritario 24/7"].map((item, i) => <li key={item} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>)}
                  </ul>

                  <Button variant="outline" className="w-full h-12 border-primary/50 hover:bg-primary/10 hover-glow" onClick={() => navigate("/auth")}>
                    Próximamente
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        {/* Animated background orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-glow-breathe pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[120px] animate-glow-breathe pointer-events-none" style={{ animationDelay: '1.5s' }} />
        
        <div className="container mx-auto text-center max-w-3xl relative scroll-spring">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-primary/50 blur-2xl rounded-full scale-150 animate-glow-breathe" />
            </div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center animate-float-rotate">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground lg:text-5xl">
            ¿Listo para construir<br />
            <span className="text-gradient">tu comunidad?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
             Únete a miles de creadores que ya están monetizando su conocimiento con STACK
          </p>
          <div className="relative inline-block group hover-lift">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-primary/50 blur-2xl rounded-xl group-hover:bg-primary/70 transition-colors animate-pulse-glow" />
            </div>
            <Button size="lg" className="relative h-14 px-10 text-lg bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => navigate("/auth")}>
              Empezar Gratis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
              <img src={stackLogo} alt="STACK" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-semibold tracking-widest bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">STACK</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 STACK. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;