import { useState, useEffect } from "react";
 import stackLogo from "@/assets/stack-logo.png";
import { useNavigate } from "react-router-dom";
import { useCommunityOwner } from "@/hooks/useCommunityOwner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { Users, Plus, Settings, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function MyCommunities() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { ownedCommunities, loading, refetch } = useCommunityOwner();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    slug: "",
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden acceder a esta página.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setNewCommunity({
      ...newCommunity,
      name,
      slug: generateSlug(name),
    });
  };

  const handleCreateCommunity = async () => {
    if (!user || !newCommunity.name.trim()) return;

    setIsCreating(true);
    try {
      // Create the community
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .insert({
          name: newCommunity.name.trim(),
          description: newCommunity.description.trim() || null,
          slug: newCommunity.slug || generateSlug(newCommunity.name),
          created_by: user.id,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Add the creator as owner member
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: "owner",
          is_owner: true,
        });

      if (memberError) throw memberError;

      toast({
        title: "Comunidad creada",
        description: "Tu comunidad ha sido creada exitosamente.",
      });

      setDialogOpen(false);
      setNewCommunity({ name: "", description: "", slug: "" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la comunidad.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout showAdminLink>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Comunidades</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las comunidades que has creado
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Comunidad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Comunidad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la comunidad</Label>
                  <Input
                    id="name"
                    value={newCommunity.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Mi Comunidad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL (slug)</Label>
                  <Input
                    id="slug"
                    value={newCommunity.slug}
                    onChange={(e) => setNewCommunity({ ...newCommunity, slug: e.target.value })}
                    placeholder="mi-comunidad"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tu comunidad será accesible en: /communities/{newCommunity.slug || "mi-comunidad"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                    placeholder="Describe tu comunidad..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreateCommunity} 
                  className="w-full"
                  disabled={isCreating || !newCommunity.name.trim()}
                >
                  {isCreating ? "Creando..." : "Crear Comunidad"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {ownedCommunities.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes comunidades</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera comunidad para empezar a conectar con tus alumnos.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear mi primera comunidad
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedCommunities.map((community) => (
              <Card key={community.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        {community.image_url ? (
                          <img
                            src={community.image_url}
                            alt={community.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {community.member_count} miembros
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {community.description || "Sin descripción"}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => navigate(`/communities/${community.slug}`)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => navigate(`/community/${community.id}/manage`)}
                    >
                      <Settings className="h-4 w-4" />
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}