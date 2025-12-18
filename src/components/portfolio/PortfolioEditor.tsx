import { useState, useEffect } from "react";
import { usePortfolio, PortfolioSettings } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Save, Eye, Share2, Settings, Palette } from "lucide-react";
import { PortfolioShareDialog } from "./PortfolioShareDialog";

interface PortfolioEditorProps {
  onPreview?: () => void;
}

export function PortfolioEditor({ onPreview }: PortfolioEditorProps) {
  const { user } = useAuth();
  const { settings, profile, projects, saveSettings, generateSlug, checkSlugAvailability, loading } = usePortfolio();
  
  const [formData, setFormData] = useState({
    slug: "",
    headline: "",
    summary: "",
    contact_email: "",
    linkedin_url: "",
    github_url: "",
    website_url: "",
    show_projects: true,
    show_certificates: true,
    show_achievements: true,
    featured_projects: [] as string[],
    theme: "default",
    is_public: true,
  });
  
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        slug: settings.slug,
        headline: settings.headline || "",
        summary: settings.summary || "",
        contact_email: settings.contact_email || "",
        linkedin_url: settings.linkedin_url || "",
        github_url: settings.github_url || "",
        website_url: settings.website_url || "",
        show_projects: settings.show_projects,
        show_certificates: settings.show_certificates,
        show_achievements: settings.show_achievements,
        featured_projects: settings.featured_projects || [],
        theme: settings.theme,
        is_public: settings.is_public,
      });
    } else if (profile?.full_name) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(profile.full_name || ""),
        contact_email: user?.email || "",
      }));
    }
  }, [settings, profile]);

  const handleSlugChange = async (value: string) => {
    const slug = generateSlug(value);
    setFormData(prev => ({ ...prev, slug }));
    
    const available = await checkSlugAvailability(slug);
    setSlugError(available ? null : "Este URL ya está en uso");
  };

  const handleSave = async () => {
    if (slugError) {
      toast.error("Por favor corrige los errores antes de guardar");
      return;
    }

    setSaving(true);
    const { error } = await saveSettings(formData);
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Portfolio guardado correctamente");
    }
  };

  const toggleFeaturedProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      featured_projects: prev.featured_projects.includes(projectId)
        ? prev.featured_projects.filter(id => id !== projectId)
        : [...prev.featured_projects, projectId],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mi Portfolio</h1>
          <p className="text-muted-foreground">
            Personaliza tu portfolio profesional
          </p>
        </div>
        <div className="flex items-center gap-2">
          {settings && (
            <Button variant="outline" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          )}
          {onPreview && (
            <Button variant="outline" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !!slugError}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">URL del Portfolio</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/portfolio/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="tu-nombre"
                />
              </div>
              {slugError && (
                <p className="text-sm text-destructive">{slugError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Titular / Rol</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="ej: Full Stack Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumen Profesional</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Cuéntanos sobre ti..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Links */}
        <Card>
          <CardHeader>
            <CardTitle>Enlaces y Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de Contacto</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/tu-perfil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                placeholder="https://github.com/tu-usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Sitio Web</Label>
              <Input
                id="website_url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://tu-sitio.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visibility Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visibilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Portfolio Público</Label>
                <p className="text-sm text-muted-foreground">
                  Cualquiera puede ver tu portfolio
                </p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Proyectos</Label>
              <Switch
                checked={formData.show_projects}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_projects: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Certificados</Label>
              <Switch
                checked={formData.show_certificates}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_certificates: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Logros</Label>
              <Switch
                checked={formData.show_achievements}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_achievements: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Featured Projects */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Destacados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center gap-3">
                    <Checkbox
                      id={project.id}
                      checked={formData.featured_projects.includes(project.id)}
                      onCheckedChange={() => toggleFeaturedProject(project.id)}
                    />
                    <label
                      htmlFor={project.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {project.title}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {settings && (
        <PortfolioShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          slug={formData.slug}
          userName={profile?.full_name || "Usuario"}
        />
      )}
    </div>
  );
}
