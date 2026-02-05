import { useParams, useNavigate } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { PortfolioProjects } from "@/components/portfolio/PortfolioProjects";
import { PortfolioCertificates } from "@/components/portfolio/PortfolioCertificates";
import { PortfolioAchievements } from "@/components/portfolio/PortfolioAchievements";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";

const PublicPortfolio = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { 
    settings, 
    profile, 
    projects, 
    certificates, 
    achievements, 
    loading, 
    error 
  } = usePortfolio(slug, true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Portfolio no encontrado</h1>
        <p className="text-muted-foreground">
          El portfolio que buscas no existe o no es público
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>
    );
  }

  const pageTitle = `${profile.full_name || "Portfolio"} - Portfolio Profesional`;
  const pageDescription = settings?.summary || settings?.headline || `Portfolio profesional de ${profile.full_name}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={window.location.href} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-12">
          <PortfolioHeader profile={profile} settings={settings} />

          {settings?.show_projects !== false && projects.length > 0 && (
            <PortfolioProjects 
              projects={projects} 
              featuredIds={settings?.featured_projects || []} 
            />
          )}

          {settings?.show_certificates !== false && certificates.length > 0 && (
            <PortfolioCertificates certificates={certificates} />
          )}

          {settings?.show_achievements !== false && achievements.length > 0 && (
            <PortfolioAchievements achievements={achievements} />
          )}

          <footer className="text-center text-sm text-muted-foreground py-8 border-t">
            <p>
              Creado con{" "}
              <a href="/" className="text-primary hover:underline">
                 STACK
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default PublicPortfolio;
