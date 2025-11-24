import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  preferences: {
    email_notifications: boolean;
    course_updates: boolean;
    comment_replies: boolean;
    theme: string;
  };
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    avatar_url: null,
    preferences: {
      email_notifications: true,
      course_updates: true,
      comment_replies: true,
      theme: "system",
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, preferences")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          preferences: (data.preferences as any) || profile.preferences,
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          preferences: profile.preferences,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "¡Perfil actualizado!",
        description: "Tus cambios se han guardado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      setUploading(true);

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: avatarUrl });

      toast({
        title: "¡Avatar actualizado!",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <UserMenu showAdminLink={false} />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>
                Personaliza tu imagen de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  {profile.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Label htmlFor="avatar-upload">
                    <Button
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Avatar
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG o WEBP. Máximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información básica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede modificar
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={profile.full_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  placeholder="Tu nombre completo"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>
                Configura tus notificaciones y preferencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones importantes por email
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        email_notifications: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Actualizaciones de Cursos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones sobre nuevos cursos y módulos
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.course_updates}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        course_updates: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respuestas a Comentarios</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones cuando respondan a tus comentarios
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.comment_replies}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        comment_replies: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
