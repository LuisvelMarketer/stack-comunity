import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "./MobileNav";
import { Home, Users, GraduationCap, Calendar, Rocket, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import skoolifyLogo from "@/assets/skoolify-logo.png";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: Home },
  { label: "Comunidades", href: "/communities", icon: Users },
  { label: "Classroom", href: "/courses", icon: GraduationCap },
  { label: "Calendario", href: "/calendar", icon: Calendar },
  { label: "Build in Public", href: "/build-in-public", icon: Rocket },
  { label: "Marketplace", href: "/marketplace", icon: Briefcase },
];

interface MainNavbarProps {
  showAdminLink?: boolean;
}

export function MainNavbar({ showAdminLink = false }: MainNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img src={skoolifyLogo} alt="Skoolify" className="w-8 h-8 rounded-lg" />
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:block">
                Skoolify
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "gap-2",
                      isActive(item.href) && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Navigation */}
            <MobileNav items={navItems} />
            
            {/* User Menu */}
            <UserMenu showAdminLink={showAdminLink} />
          </div>
        </div>
      </div>
    </nav>
  );
}
