import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { SocialFeed } from "@/components/social/SocialFeed";
import { Leaderboard } from "@/components/social/Leaderboard";
import { UpcomingEvents } from "@/components/social/UpcomingEvents";
import { MyCommunities } from "@/components/social/MyCommunities";
import { UserProgress } from "@/components/social/UserProgress";
import { ContinueLearning } from "@/components/social/ContinueLearning";
import { ActiveCommunity } from "@/components/social/ActiveCommunity";
import { SuggestedCommunities } from "@/components/social/SuggestedCommunities";
import { UpcomingLives } from "@/components/social/UpcomingLives";
import { AIMentorWidget } from "@/components/AIMentorWidget";
import { Home, Users, BookOpen, Calendar, Search } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle subscription return
  useEffect(() => {
    const subscription = searchParams.get('subscription');
    if (subscription === 'success') {
      toast.success('¡Suscripción activada! Ya tienes acceso Premium.');
      setSearchParams({});
    } else if (subscription === 'cancelled') {
      toast.info('Proceso de suscripción cancelado.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Skoolify
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/communities")}>
                  <Users className="w-4 h-4 mr-2" />
                  Comunidades
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Cursos
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendario
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5" />
              </Button>
              <NotificationCenter />
              <UserMenu showAdminLink={isAdmin} />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <AIMentorWidget />
            <MyCommunities />
            <UserProgress />
          </div>

          {/* Main Feed - 6 columns */}
          <div className="lg:col-span-6">
            <SocialFeed />
          </div>

          {/* Right Sidebar - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <ActiveCommunity />
            <SuggestedCommunities />
            <Leaderboard />
            <UpcomingLives />
            <UpcomingEvents />
            <ContinueLearning />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;