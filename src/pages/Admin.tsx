import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, MessageCircle, Calendar, Video, Rocket, Users } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { CoursesManager } from "@/components/admin/CoursesManager";
import { ModulesManager } from "@/components/admin/ModulesManager";
import { QuizzesManager } from "@/components/admin/QuizzesManager";
import { CommentsManager } from "@/components/admin/CommentsManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { LivesManager } from "@/components/admin/LivesManager";
import { IncubatorManager } from "@/components/admin/IncubatorManager";
import { SalesLeadsManager } from "@/components/admin/SalesLeadsManager";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("courses");

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <UserMenu showAdminLink={false} />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-grid">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Cursos</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Quizzes</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Comentarios</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="lives" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Lives</span>
            </TabsTrigger>
            <TabsTrigger value="incubator" className="gap-2">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Incubadora</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Ventas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <CoursesManager />
          </TabsContent>

          <TabsContent value="modules">
            <ModulesManager />
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizzesManager />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsManager />
          </TabsContent>

          <TabsContent value="events">
            <EventsManager />
          </TabsContent>

          <TabsContent value="lives">
            <LivesManager />
          </TabsContent>

          <TabsContent value="incubator">
            <IncubatorManager />
          </TabsContent>

          <TabsContent value="sales">
            <SalesLeadsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
