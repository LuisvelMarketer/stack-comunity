import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
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
import { UserStreakCard } from "@/components/gamification/UserStreakCard";
import { DailyMissionsCard } from "@/components/gamification/DailyMissionsCard";
import { LevelProgressCard } from "@/components/gamification/LevelProgressCard";
import { AIMentorChat, AIMentorChatButton } from "@/components/AIMentorChat";
import { LockedDashboard } from "@/components/LockedDashboard";
import { Home, Users, GraduationCap, Calendar, Rocket, Briefcase } from "lucide-react";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { toast } from "sonner";
import skoolifyLogo from "@/assets/skoolify-logo.png";

const Dashboard = () => {
  const { user } = useAuth();
  const { isEnrolled, loading: enrollmentLoading } = useCourseEnrollment();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle payment/subscription return
  useEffect(() => {
    const payment = searchParams.get('payment');
    const subscription = searchParams.get('subscription');
    
    if (payment === 'success' || subscription === 'success') {
      toast.success('¡Pago completado! Tu acceso será activado en unos momentos.');
      setSearchParams({});
      // Refresh page after a short delay to check enrollment
      setTimeout(() => window.location.reload(), 2000);
    } else if (payment === 'cancelled' || subscription === 'cancelled') {
      toast.info('Proceso de pago cancelado.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

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

  // Show locked dashboard for non-enrolled users
  if (!enrollmentLoading && !isEnrolled && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={skoolifyLogo} alt="Código Cero" className="w-8 h-8 rounded-lg" />
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Código Cero
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <UserMenu showAdminLink={false} />
              </div>
            </div>
          </div>
        </nav>
        <LockedDashboard />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <img src={skoolifyLogo} alt="Skoolify" className="w-8 h-8 rounded-lg" />
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
                <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Classroom
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendario
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/build-in-public")}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Build in Public
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Marketplace
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserMenu showAdminLink={isAdmin} />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <LevelProgressCard />
            <UserStreakCard compact />
            <DailyMissionsCard />
            <AIMentorWidget />
            <MyCommunities />
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

      {/* AI Mentor Chat */}
      {!isChatOpen && (
        <AIMentorChatButton onClick={() => setIsChatOpen(true)} />
      )}
      <AIMentorChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Push notification prompt */}
      <PushNotificationPrompt />
    </div>
  );
};

export default Dashboard;