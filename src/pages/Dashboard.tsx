import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { SocialFeed } from "@/components/social/SocialFeed";
import { Leaderboard } from "@/components/social/Leaderboard";
import { UpcomingEvents } from "@/components/social/UpcomingEvents";

const Dashboard = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DevAcademy
            </h1>
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Mis Cursos
              </Button>
              <Button variant="ghost" onClick={() => navigate("/communities")}>
                Comunidades
              </Button>
            </div>
          </div>
          <UserMenu showAdminLink={isAdmin} />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Feed</h2>
          <p className="text-muted-foreground">
            Mantente al día con tu comunidad de aprendizaje
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed - 8 columns */}
          <div className="lg:col-span-8">
            <SocialFeed />
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            <Leaderboard />
            <UpcomingEvents />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;