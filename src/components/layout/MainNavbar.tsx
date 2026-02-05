import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { MobileNav } from "./MobileNav";
import { Home, Users, GraduationCap, Calendar, Rocket, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import stackLogo from "@/assets/stack-logo.png";

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
  { label: "Build", href: "/build-in-public", icon: Rocket },
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
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img src={stackLogo} alt="STACK" className="w-10 h-10 rounded-xl shadow-md group-hover:shadow-lg transition-shadow" />
            </div>
            <h1 className="text-xl font-bold tracking-wider text-foreground hidden sm:block">
              STACK
            </h1>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-2 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    active 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
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
