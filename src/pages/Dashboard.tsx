import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { SocialFeed } from "@/components/social/SocialFeed";
import { Leaderboard } from "@/components/social/Leaderboard";
import { UpcomingEvents } from "@/components/social/UpcomingEvents";
import { MyCommunities } from "@/components/social/MyCommunities";
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
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { MainLayout } from "@/components/layout/MainLayout";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const { isEnrolled, loading: enrollmentLoading } = useCourseEnrollment();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
      <MainLayout>
        <LockedDashboard />
      </MainLayout>
    );
  }

  return (
    <MainLayout showAdminLink={isAdmin} className="bg-gradient-hero">
      <div className="container mx-auto px-4 py-6">
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
      </div>

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
    </MainLayout>
  );
};

export default Dashboard;
