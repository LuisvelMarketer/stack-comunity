import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Settings, BookOpen, Trash2, Save } from "lucide-react";
import { CommunityCoursesManager } from "@/components/community/CommunityCoursesManager";
import { UserMenu } from "@/components/UserMenu";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  member_count: number;
}

interface Member {
  id: string;
  user_id: string;
  joined_at: string;
  is_owner: boolean;
  role: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    level: number;
    points: number;
  } | null;
}

export default function CommunityManage() {
  const { communityId } = useParams<{ communityId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    slug: "",
  });

  useEffect(() => {
    if (communityId && user) {
      loadCommunityData();
    }
  }, [communityId, user]);

  const loadCommunityData = async () => {
    if (!communityId || !user) return;

    setLoading(true);

    // Check if user is owner
    const { data: memberData } = await supabase
      .from("community_members")
      .select("is_owner")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!memberData?.is_owner) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para gestionar esta comunidad.",
        variant: "destructive",
      });
      navigate("/my-communities");
      return;
    }

    setIsOwner(true);

    // Load community details
    const { data: communityData, error: communityError } = await supabase
      .from("communities")
      .select("*")
      .eq("id", communityId)
      .single();

    if (communityError || !communityData) {
      toast({
        title: "Error",
        description: "No se pudo cargar la comunidad.",
        variant: "destructive",
      });
      navigate("/my-communities");
      return;
    }

    setCommunity(communityData);
    setEditForm({
      name: communityData.name,
      description: communityData.description || "",
      slug: communityData.slug,
    });

    // Load members with their profiles
    const { data: membersData } = await supabase
      .from("community_members")
      .select("id, user_id, joined_at, is_owner, role")
      .eq("community_id", communityId)
      .order("joined_at", { ascending: true });

    if (membersData) {
      // Fetch profiles separately
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, level, points")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profiles: profilesMap.get(member.user_id) || null,
      }));
      
      setMembers(membersWithProfiles as Member[]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!communityId) return;

    setSaving(true);
    const { error } = await supabase
      .from("communities")
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        slug: editForm.slug.trim(),
      })
      .eq("id", communityId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Guardado",
        description: "Los cambios han sido guardados.",
      });
      loadCommunityData();
    }
    setSaving(false);
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) {
      toast({
        title: "Error",
        description: "No puedes eliminarte a ti mismo.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar al miembro.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado de la comunidad.",
      });
      loadCommunityData();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!community || !isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/my-communities")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Gestionar: {community.name}</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Miembros ({members.length})
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Miembros de la Comunidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Puntos</TableHead>
                      <TableHead>Fecha de ingreso</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profiles?.avatar_url || undefined} />
                              <AvatarFallback>
                                {getInitials(member.profiles?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {member.profiles?.full_name || "Usuario"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            Nivel {member.profiles?.level || 1}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.profiles?.points || 0}</TableCell>
                        <TableCell>
                          {format(new Date(member.joined_at), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {member.is_owner ? (
                            <Badge>Dueño</Badge>
                          ) : (
                            <Badge variant="outline">Miembro</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!member.is_owner && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará a {member.profiles?.full_name || "este usuario"} de la comunidad.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <CommunityCoursesManager communityId={communityId!} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de la Comunidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">URL (slug)</Label>
                  <Input
                    id="edit-slug"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tu comunidad será accesible en: /communities/{editForm.slug}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
