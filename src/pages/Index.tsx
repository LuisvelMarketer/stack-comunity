import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Code2, Rocket, Users } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          className="text-center space-y-6 mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight"
            variants={itemVariants}
          >
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              DevAcademy
            </span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Aprende Tecnología y Desarrollo Web desde cero
          </motion.p>
          <motion.div
            className="flex gap-4 justify-center"
            variants={itemVariants}
          >
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-glow">
              Comenzar Ahora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Cursos Estructurados</h3>
                <p className="text-sm text-muted-foreground">
                  Contenido organizado paso a paso
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
                  <Code2 className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold">Proyectos Prácticos</h3>
                <p className="text-sm text-muted-foreground">
                  Aprende haciendo proyectos reales
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Comunidad Activa</h3>
                <p className="text-sm text-muted-foreground">
                  Conecta con otros estudiantes
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Progreso Rápido</h3>
                <p className="text-sm text-muted-foreground">
                  De principiante a desarrollador
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
