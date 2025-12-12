import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Course from "./pages/Course";
import Classroom from "./pages/Classroom";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import CommunityLanding from "./pages/CommunityLanding";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Messages from "./pages/Messages";
import Affiliate from "./pages/Affiliate";
import CalendarPage from "./pages/CalendarPage";
import MyCommunities from "./pages/MyCommunities";
import CommunityManage from "./pages/CommunityManage";
import Subscriptions from "./pages/Subscriptions";
import BuildInPublic from "./pages/BuildInPublic";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectEdit from "./pages/ProjectEdit";
import Marketplace from "./pages/Marketplace";
import Incubator from "./pages/Incubator";
import Courses from "./pages/Courses";
import CodigoQuantumLanding from "./pages/CodigoQuantumLanding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PushNotificationPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Public community landing pages - SEO optimized */}
            <Route path="/c/:slug" element={<CommunityLanding />} />
            <Route path="/codigo-quantum" element={<CodigoQuantumLanding />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:courseId"
              element={
                <ProtectedRoute>
                  <Classroom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId"
              element={
                <ProtectedRoute>
                  <Classroom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:courseId/legacy"
              element={
                <ProtectedRoute>
                  <Course />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities"
              element={
                <ProtectedRoute>
                  <Communities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities/:slug"
              element={
                <ProtectedRoute>
                  <CommunityDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/affiliate"
              element={
                <ProtectedRoute>
                  <Affiliate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-communities"
              element={
                <ProtectedRoute>
                  <MyCommunities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community/:communityId/manage"
              element={
                <ProtectedRoute>
                  <CommunityManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/build-in-public"
              element={
                <ProtectedRoute>
                  <BuildInPublic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/build-in-public/:projectId/edit"
              element={
                <ProtectedRoute>
                  <ProjectEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/build-in-public/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute>
                  <Marketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/incubator"
              element={
                <ProtectedRoute>
                  <Incubator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
