import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, MessageCircle } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { CoursesManager } from "@/components/admin/CoursesManager";
import { ModulesManager } from "@/components/admin/ModulesManager";
import { QuizzesManager } from "@/components/admin/QuizzesManager";
import { CommentsManager } from "@/components/admin/CommentsManager";
import { motion } from "framer-motion";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");

  return (
    <div className="min-h-screen bg-gradient-hero">
      <motion.nav
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <UserMenu showAdminLink={false} />
        </div>
      </motion.nav>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
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
        </motion.div>
      </main>
    </div>
  );
}
