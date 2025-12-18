import { PortfolioProfile, PortfolioSettings } from "@/hooks/usePortfolio";
import { UserAvatar, getInitials } from "@/components/UserAvatar";
import { MapPin, Mail, Linkedin, Github, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioHeaderProps {
  profile: PortfolioProfile;
  settings: PortfolioSettings | null;
}

export function PortfolioHeader({ profile, settings }: PortfolioHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="relative p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <UserAvatar
            src={profile.avatar_url}
            fallback={getInitials(profile.full_name)}
            level={profile.level}
            size="xl"
            className="h-24 w-24 md:h-32 md:w-32"
          />
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {profile.full_name || "Usuario"}
            </h1>
            
            {settings?.headline && (
              <p className="text-xl text-muted-foreground mb-4">
                {settings.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                Nivel {profile.level} • {profile.points} pts
              </span>
            </div>

            {settings?.summary && (
              <p className="text-muted-foreground max-w-2xl mb-6">
                {settings.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {settings?.contact_email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${settings.contact_email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contactar
                  </a>
                </Button>
              )}
              {settings?.linkedin_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {settings?.github_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {settings?.website_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
