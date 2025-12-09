import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, BookOpen, Calendar, Trophy, Star, ArrowRight, 
  Check, Play, MessageCircle, Zap, Crown
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  image_url: string | null;
  banner_url: string | null;
  member_count: number;
  price_monthly: number | null;
  is_paid: boolean | null;
  category: string | null;
  tags: string[] | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  module_count: number;
}

interface Testimonial {
  id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  rating: number;
}

export default function CommunityLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadCommunityData();
    }
  }, [slug]);

  // Update page meta tags for SEO
  useEffect(() => {
    if (community) {
      document.title = `${community.name} - Comunidad de Aprendizaje | Código Cero`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          community.description?.slice(0, 155) || 
          `Únete a ${community.name} y aprende con ${community.member_count} miembros.`
        );
      }

      // Update OG tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', community.name);
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute('content', community.description || '');
      
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && community.banner_url) {
        ogImage.setAttribute('content', community.banner_url);
      }
    }
  }, [community]);

  const loadCommunityData = async () => {
    try {
      // Load community
      const { data: communityData, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setCommunity(communityData);

      // Load courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          id, title, description, thumbnail_url,
          course_modules (id)
        `)
        .eq("community_id", communityData.id)
        .eq("is_published", true)
        .limit(6);

      setCourses(
        coursesData?.map((c: any) => ({
          ...c,
          module_count: c.course_modules?.length || 0,
        })) || []
      );

      // Load sample members (for social proof)
      const { data: membersData } = await supabase
        .from("community_members")
        .select(`
          user_id,
          profiles:user_id (
            full_name,
            avatar_url,
            level,
            points
          )
        `)
        .eq("community_id", communityData.id)
        .limit(8);

      setMembers(membersData?.map((m: any) => m.profiles).filter(Boolean) || []);
    } catch (error) {
      console.error("Error loading community:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    navigate(`/auth?redirect=/communities/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full h-80" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-1/2 mb-4" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Comunidad no encontrada</h1>
          <Button onClick={() => navigate("/communities")}>
            Explorar comunidades
          </Button>
        </div>
      </div>
    );
  }

  // Generate fake testimonials based on members
  const testimonials: Testimonial[] = members.slice(0, 3).map((m, i) => ({
    id: `t-${i}`,
    user_name: m?.full_name || "Miembro",
    avatar_url: m?.avatar_url,
    content: [
      "Excelente comunidad con contenido de alta calidad. Los cursos son muy prácticos.",
      "Me encanta el ambiente y la interacción con otros miembros. Muy recomendado.",
      "Los instructores son expertos y siempre están disponibles para ayudar."
    ][i % 3],
    rating: 5,
  }));

  const features = [
    { icon: BookOpen, title: `${courses.length}+ Cursos`, desc: "Contenido exclusivo" },
    { icon: Users, title: `${community.member_count} Miembros`, desc: "Comunidad activa" },
    { icon: MessageCircle, title: "Chat en vivo", desc: "Interacción real" },
    { icon: Calendar, title: "Eventos", desc: "Sesiones regulares" },
    { icon: Trophy, title: "Gamificación", desc: "Puntos y logros" },
    { icon: Zap, title: "Lives", desc: "Sesiones en directo" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent"
          >
            Código Cero
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
            <Button onClick={handleJoin}>
              Unirme Ahora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20">
        <div 
          className="relative h-80 bg-cover bg-center"
          style={{ 
            backgroundImage: community.banner_url 
              ? `url(${community.banner_url})` 
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
            <div className="flex items-end gap-6">
              {community.image_url ? (
                <img 
                  src={community.image_url} 
                  alt={community.name}
                  className="w-32 h-32 rounded-2xl border-4 border-background shadow-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-background shadow-xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-12 w-12 text-primary" />
                </div>
              )}
              <div className="pb-2">
                {community.category && (
                  <Badge variant="secondary" className="mb-2">
                    {community.category}
                  </Badge>
                )}
                <h1 className="text-4xl font-bold mb-2">{community.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {community.member_count} miembros
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    4.9/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Sobre esta comunidad</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {community.description || 
                  `Únete a ${community.name} y forma parte de una comunidad de aprendizaje activa con acceso a cursos exclusivos, eventos en vivo, y una red de profesionales que comparten tu pasión.`
                }
              </p>
              {community.tags && community.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {community.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Features Grid */}
            <section>
              <h2 className="text-2xl font-bold mb-6">¿Qué incluye?</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Courses Preview */}
            {courses.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Cursos disponibles</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                      <div className="aspect-video relative bg-muted">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {course.description || "Curso exclusivo para miembros"}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          {course.module_count} módulos
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Lo que dicen nuestros miembros</h2>
                <div className="grid gap-4">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={testimonial.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {testimonial.user_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{testimonial.user_name}</span>
                              <div className="flex">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground">{testimonial.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Members Preview */}
            {members.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Únete a estos miembros</h2>
                <div className="flex flex-wrap gap-3">
                  {members.map((member, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {member?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member?.full_name || "Miembro"}</p>
                        <p className="text-xs text-muted-foreground">Nivel {member?.level || 1}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        +{Math.max(0, community.member_count - members.length)}
                      </span>
                    </div>
                    <p className="text-sm text-primary font-medium">más miembros</p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sticky CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border-primary/20 shadow-lg">
                <CardContent className="p-6 space-y-6">
                  {/* Pricing */}
                  <div className="text-center">
                    {community.is_paid && community.price_monthly ? (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold">${community.price_monthly}</span>
                          <span className="text-muted-foreground">/mes</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Acceso completo a todo el contenido
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-primary">Gratis</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Únete sin costo
                        </p>
                      </>
                    )}
                  </div>

                  {/* Benefits list */}
                  <div className="space-y-3">
                    {[
                      "Acceso a todos los cursos",
                      "Chat con la comunidad",
                      "Eventos exclusivos",
                      "Certificados de finalización",
                      "Soporte prioritario",
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    onClick={handleJoin} 
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Unirme ahora
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    ✓ Cancela cuando quieras • ✓ Garantía de 7 días
                  </p>
                </CardContent>
              </Card>

              {/* Social proof */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
                <div className="flex -space-x-2 justify-center mb-2">
                  {members.slice(0, 5).map((member, i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {member?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{community.member_count} personas</strong> ya son parte
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Únete a {community.name} y comienza tu viaje de aprendizaje hoy mismo.
          </p>
          <Button onClick={handleJoin} size="lg" className="h-14 px-8 text-lg">
            Comenzar ahora
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Código Cero. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
