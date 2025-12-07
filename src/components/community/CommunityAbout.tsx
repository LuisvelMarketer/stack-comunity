import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Calendar, BookOpen, MessageCircle, 
  Video, Star, Shield, Info, FileText
} from "lucide-react";
import { CreatorBadge } from "@/components/CreatorBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CommunityAboutProps {
  community: {
    id: string;
    name: string;
    description?: string | null;
    image_url?: string | null;
    member_count: number;
    created_at?: string;
    created_by?: string | null;
    is_paid?: boolean | null;
    price_monthly?: number | null;
  };
}

interface OwnerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Stats {
  courses: number;
  events: number;
  lives: number;
  posts: number;
}

export function CommunityAbout({ community }: CommunityAboutProps) {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ courses: 0, events: 0, lives: 0, posts: 0 });

  useEffect(() => {
    fetchOwner();
    fetchStats();
  }, [community.id]);

  const fetchOwner = async () => {
    if (!community.created_by) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio")
      .eq("id", community.created_by)
      .single();
    
    if (data) setOwner(data);
  };

  const fetchStats = async () => {
    const [coursesRes, eventsRes, livesRes, postsRes] = await Promise.all([
      supabase.from("courses").select("id", { count: "exact", head: true }).eq("community_id", community.id),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("community_id", community.id),
      supabase.from("live_sessions").select("id", { count: "exact", head: true }).eq("community_id", community.id),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("community_id", community.id),
    ]);

    setStats({
      courses: coursesRes.count || 0,
      events: eventsRes.count || 0,
      lives: livesRes.count || 0,
      posts: postsRes.count || 0,
    });
  };

  const features = [
    { icon: BookOpen, label: "Cursos", value: stats.courses },
    { icon: Calendar, label: "Eventos", value: stats.events },
    { icon: Video, label: "Lives", value: stats.lives },
    { icon: MessageCircle, label: "Posts", value: stats.posts },
  ];

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Acerca de esta comunidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {community.description || "Esta comunidad aún no tiene una descripción."}
          </p>
          
          <Separator className="my-6" />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.label} className="text-center p-4 rounded-lg bg-muted/50">
                <feature.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{feature.value}</p>
                <p className="text-sm text-muted-foreground">{feature.label}</p>
              </div>
            ))}
          </div>

          <Separator className="my-6" />
          
          {/* Community Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Miembros
              </span>
              <span className="font-medium">{community.member_count}</span>
            </div>
            {community.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Creada
                </span>
                <span className="font-medium">
                  {format(new Date(community.created_at), "MMMM yyyy", { locale: es })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Tipo
              </span>
              {community.is_paid ? (
                <Badge>${community.price_monthly}/mes</Badge>
              ) : (
                <Badge variant="secondary">Gratis</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner/Creator */}
      {owner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Creador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {owner.avatar_url && <AvatarImage src={owner.avatar_url} />}
                <AvatarFallback className="text-xl">
                  {owner.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{owner.full_name || "Usuario"}</h3>
                  <CreatorBadge />
                </div>
                {owner.bio && (
                  <p className="text-muted-foreground text-sm line-clamp-3">{owner.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reglas de la comunidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0">1</span>
              <span className="text-muted-foreground">Sé respetuoso con todos los miembros</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0">2</span>
              <span className="text-muted-foreground">No spam ni autopromoción excesiva</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0">3</span>
              <span className="text-muted-foreground">Mantén las discusiones relevantes al tema</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0">4</span>
              <span className="text-muted-foreground">Comparte conocimiento y ayuda a otros</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
