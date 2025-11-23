import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  FileText, 
  MessageCircle, 
  Users, 
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CoursesManager } from "@/components/admin/CoursesManager";
import { ModulesManager } from "@/components/admin/ModulesManager";
import { QuizzesManager } from "@/components/admin/QuizzesManager";
import { CommentsManager } from "@/components/admin/CommentsManager";

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");

  return (
    <div className="min-h-screen bg-gradient-hero">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Ir al Dashboard
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2">
              <FileText className="h-4 w-4" />
              Módulos
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2">
              <FileText className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Comentarios
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
        </Tabs>
      </main>
    </div>
  );
}
