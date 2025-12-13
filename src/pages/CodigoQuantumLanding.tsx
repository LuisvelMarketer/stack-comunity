import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, Zap, Users, BookOpen, Calendar, Trophy, 
  ArrowRight, Check, Star, Play, Sparkles, Target,
  TrendingUp, Shield, Clock, Award, ChevronRight, Phone
} from "lucide-react";
import { motion } from "framer-motion";
import codigoQuantumLogo from "@/assets/codigo-quantum-logo.png";
import codigoQuantumBanner from "@/assets/codigo-quantum-banner.png";

// Lazy load quantum background for performance
const QuantumBackground = lazy(() => import("@/components/quantum/QuantumBackground"));
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const glowPulse = {
  boxShadow: [
    "0 0 20px rgba(212, 175, 55, 0.3)",
    "0 0 60px rgba(212, 175, 55, 0.5)",
    "0 0 20px rgba(212, 175, 55, 0.3)"
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

export default function CodigoQuantumLanding() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // SEO Meta tags
    document.title = "Código Quantum - El Salto Cuántico en tu Carrera de Desarrollador";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Accede al programa de aceleración más exclusivo para desarrolladores. Tecnología avanzada, mentoría 1:1 y acceso a oportunidades únicas.'
      );
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScheduleCall = () => {
    // Open Calendly link - to be configured
    window.open('https://calendly.com/codigoquantum', '_blank');
  };

  const features = [
    {
      icon: Target,
      title: "Mentoría 1:1 Personalizada",
      description: "Sesiones semanales con mentores senior de empresas top tech"
    },
    {
      icon: Rocket,
      title: "Proyectos Reales",
      description: "Trabaja en proyectos de clientes reales desde el día uno"
    },
    {
      icon: TrendingUp,
      title: "Aceleración de Carrera",
      description: "Conexiones directas con empresas y oportunidades laborales"
    },
    {
      icon: Shield,
      title: "Garantía de Resultados",
      description: "O cumples tus objetivos o extendemos tu acceso sin costo"
    },
    {
      icon: Users,
      title: "Red Exclusiva",
      description: "Acceso a una comunidad privada de desarrolladores de élite"
    },
    {
      icon: Award,
      title: "Certificación Premium",
      description: "Certificado reconocido por empresas partner del programa"
    }
  ];

  const benefits = [
    "Acceso ilimitado a todos los cursos avanzados",
    "Mentoría 1:1 semanal con expertos",
    "Proyectos reales con clientes",
    "Conexión directa con empresas tech",
    "Comunidad privada de élite",
    "Garantía de resultados o extensión gratuita",
    "Soporte prioritario 24/7",
    "Certificación premium reconocida"
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      role: "Senior Developer @ Google",
      content: "Código Quantum transformó mi carrera. En 6 meses pasé de junior a senior en una empresa Fortune 500.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "María González",
      role: "Tech Lead @ Stripe",
      content: "La mentoría 1:1 y las conexiones del programa fueron clave para dar el salto a una empresa top.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Andrés Ruiz",
      role: "Founder @ TechStartup",
      content: "El programa me dio las herramientas y la red para lanzar mi propia startup exitosa.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const stats = [
    { value: "95%", label: "Tasa de empleabilidad" },
    { value: "3x", label: "Aumento de salario promedio" },
    { value: "500+", label: "Graduados exitosos" },
    { value: "50+", label: "Empresas partner" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Quantum Animated Particles Background */}
      <Suspense fallback={null}>
        <div className="fixed inset-0 pointer-events-none z-0">
          <QuantumBackground />
        </div>
      </Suspense>

      {/* Animated Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {/* Gold grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.4) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(212, 175, 55, 0.4) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        {/* Radial glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[#d4af37]/10 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#d4af37]/5 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#ffd700]/5 rounded-full blur-[150px]" />
        
        {/* Quantum energy lines */}
        <motion.div 
          className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#d4af37]/20 to-transparent"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#d4af37]/20 to-transparent"
          animate={{ opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-[#d4af37]/20' : ''
      }`}>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-3"
          >
            <img src={codigoQuantumLogo} alt="Código Quantum" className="h-8 sm:h-10 w-auto" />
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent hidden xs:inline">
              Código Quantum
            </span>
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white hover:bg-white/5 text-sm sm:text-base px-2 sm:px-4 hidden sm:flex"
              onClick={() => navigate("/auth")}
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={handleScheduleCall}
              className="bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-semibold text-xs sm:text-sm px-3 sm:px-4"
            >
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Agendar Llamada</span>
              <span className="sm:hidden">Agendar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 sm:pt-20 z-10">
        <div className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div 
              className="space-y-5 sm:space-y-8 text-center lg:text-left"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="flex justify-center lg:justify-start">
                <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm mb-4 sm:mb-6">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Programa de Aceleración Exclusivo
                </Badge>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                El{" "}
                <span className="bg-gradient-to-r from-[#d4af37] via-[#f4e5b2] to-[#d4af37] bg-clip-text text-transparent">
                  Salto Cuántico
                </span>
                <br />
                en tu Carrera
              </motion.h1>

              <motion.p 
                variants={fadeInUp}
                className="text-base sm:text-xl text-white/60 max-w-xl mx-auto lg:mx-0"
              >
                Accede al programa de aceleración más exclusivo para desarrolladores. 
                Tecnología avanzada, mentoría personalizada y conexiones que transformarán tu carrera.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg"
                    onClick={handleScheduleCall}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-bold text-sm sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                  >
                    Agendar Llamada de Admisión
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </motion.div>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-6 sm:px-8 py-5 sm:py-6 rounded-xl"
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Ver Presentación
                </Button>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-4 sm:gap-6 pt-4 justify-center lg:justify-start"
              >
                <div className="flex -space-x-2 sm:-space-x-3">
                  {[1,2,3,4,5].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#0a0a0f] bg-gradient-to-br from-[#d4af37]/40 to-[#d4af37]/20 flex items-center justify-center"
                    >
                      <span className="text-[10px] sm:text-xs font-bold text-[#d4af37]">{i}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-white/60">
                    <span className="text-[#d4af37] font-semibold">+500</span> desarrolladores transformados
                  </p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#d4af37] text-[#d4af37]" />
                    ))}
                    <span className="text-xs sm:text-sm text-white/60 ml-2">4.9/5</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              className="relative mt-8 lg:mt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div 
                className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-[#d4af37]/30"
                animate={glowPulse}
              >
                <img 
                  src={codigoQuantumBanner}
                  alt="Código Quantum"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
              </motion.div>
              
              {/* Floating badges */}
              <motion.div 
                className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-[#0a0a0f] border border-[#d4af37]/30 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                    <Rocket className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/60">Aceleración</p>
                    <p className="text-sm sm:text-lg font-bold text-[#d4af37]">10x</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-[#0a0a0f] border border-[#d4af37]/30 rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-xl"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-white/60">Salario promedio</p>
                    <p className="text-sm sm:text-lg font-bold text-[#d4af37]">+200%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 sm:py-20 border-y border-[#d4af37]/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <p className="text-white/60 text-xs sm:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 mb-3 sm:mb-4 text-xs sm:text-sm">
              ¿Qué incluye?
            </Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-2">
              Todo lo que necesitas para{" "}
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                acelerar
              </span>
            </h2>
            <p className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto px-2">
              Un programa diseñado para llevarte al siguiente nivel en tiempo récord
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-[#0a0a0f] border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 h-full group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-5 h-5 sm:w-7 sm:h-7 text-[#d4af37]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 text-white">{feature.title}</h3>
                    <p className="text-white/60 text-sm sm:text-base">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-transparent via-[#d4af37]/5 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-10 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 mb-3 sm:mb-4 text-xs sm:text-sm">
              Historias de éxito
            </Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-2">
              Ellos ya dieron el{" "}
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                salto cuántico
              </span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="bg-[#0a0a0f] border-[#d4af37]/20 h-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-[#d4af37]/30"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm sm:text-base">{testimonial.name}</h4>
                        <p className="text-xs sm:text-sm text-[#d4af37]">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex mb-3 sm:mb-4">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-[#d4af37] text-[#d4af37]" />
                      ))}
                    </div>
                    <p className="text-white/70 italic text-sm sm:text-base">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 mb-3 sm:mb-4 text-xs sm:text-sm">
                Acceso completo
              </Badge>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                Todo incluido en tu{" "}
                <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                  membresía
                </span>
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-[#d4af37]" />
                    </div>
                    <span className="text-white/80 text-sm sm:text-base">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-[#d4af37]/10 to-[#0a0a0f] border-[#d4af37]/30 overflow-hidden">
                <CardContent className="p-5 sm:p-8 text-center">
                  <div className="mb-4 sm:mb-6">
                    <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-[#d4af37] mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2">Programa Exclusivo</h3>
                    <p className="text-white/60 text-sm sm:text-base">Plazas limitadas - Proceso de admisión</p>
                  </div>
                  
                  <div className="py-5 sm:py-8 border-y border-[#d4af37]/20 my-4 sm:my-6">
                    <p className="text-white/60 mb-1.5 sm:mb-2 text-sm sm:text-base">Inversión personalizada según tu perfil</p>
                    <p className="text-2xl sm:text-4xl font-bold text-[#d4af37]">Agenda tu llamada</p>
                    <p className="text-white/60 text-xs sm:text-sm mt-1.5 sm:mt-2">para conocer las opciones disponibles</p>
                  </div>

                  <Button 
                    size="lg"
                    onClick={handleScheduleCall}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-bold text-sm sm:text-lg py-5 sm:py-6 rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                  >
                    <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Agendar Llamada de Admisión
                  </Button>

                  <p className="text-[10px] sm:text-xs text-white/40 mt-3 sm:mt-4">
                    Sin compromiso • Llamada informativa de 30 min
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
            
            <div className="relative p-6 sm:p-12 md:p-20 text-center">
              <Badge className="bg-white/10 text-white border-white/20 mb-4 sm:mb-6 text-xs sm:text-sm">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Plazas limitadas
              </Badge>
              
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 px-2">
                ¿Listo para dar el{" "}
                <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                  salto cuántico
                </span>
                ?
              </h2>
              
              <p className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
                Agenda una llamada con nuestro equipo de admisiones y descubre si el programa es para ti.
              </p>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg"
                  onClick={handleScheduleCall}
                  className="bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-bold text-base sm:text-xl px-8 sm:px-12 py-5 sm:py-8 rounded-xl shadow-[0_0_60px_rgba(212,175,55,0.4)]"
                >
                  Agendar Mi Llamada
                  <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#d4af37]/10 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={codigoQuantumLogo} alt="Código Quantum" className="h-6 sm:h-8 w-auto" />
              <span className="text-[#d4af37] font-bold text-sm sm:text-base">Código Quantum</span>
            </div>
            <p className="text-white/40 text-xs sm:text-sm text-center">
              © 2024 Código Quantum. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <button className="text-white/40 hover:text-[#d4af37] text-xs sm:text-sm transition-colors">
                Términos
              </button>
              <button className="text-white/40 hover:text-[#d4af37] text-xs sm:text-sm transition-colors">
                Privacidad
              </button>
              <button 
                className="text-white/40 hover:text-[#d4af37] text-xs sm:text-sm transition-colors"
                onClick={() => navigate("/")}
              >
                Skoolify
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
