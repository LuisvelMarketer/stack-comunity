import { useEffect, useState } from "react";
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
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gold grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(212, 175, 55, 0.3) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(212, 175, 55, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#d4af37]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#d4af37]/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-[#d4af37]/20' : ''
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <img src={codigoQuantumLogo} alt="Código Quantum" className="h-10 w-auto" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
              Código Quantum
            </span>
          </button>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white hover:bg-white/5"
              onClick={() => navigate("/auth")}
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={handleScheduleCall}
              className="bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-semibold"
            >
              <Phone className="w-4 h-4 mr-2" />
              Agendar Llamada
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-8"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 px-4 py-2 text-sm mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Programa de Aceleración Exclusivo
                </Badge>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
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
                className="text-xl text-white/60 max-w-xl"
              >
                Accede al programa de aceleración más exclusivo para desarrolladores. 
                Tecnología avanzada, mentoría personalizada y conexiones que transformarán tu carrera.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg"
                    onClick={handleScheduleCall}
                    className="bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                  >
                    Agendar Llamada de Admisión
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 px-8 py-6 rounded-xl"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Ver Presentación
                </Button>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-6 pt-4"
              >
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map((i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[#0a0a0f] bg-gradient-to-br from-[#d4af37]/40 to-[#d4af37]/20 flex items-center justify-center"
                    >
                      <span className="text-xs font-bold text-[#d4af37]">{i}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-white/60">
                    <span className="text-[#d4af37] font-semibold">+500</span> desarrolladores transformados
                  </p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                    ))}
                    <span className="text-sm text-white/60 ml-2">4.9/5</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div 
                className="relative rounded-2xl overflow-hidden border border-[#d4af37]/30"
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
                className="absolute -top-4 -right-4 bg-[#0a0a0f] border border-[#d4af37]/30 rounded-xl p-4 shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Aceleración</p>
                    <p className="text-lg font-bold text-[#d4af37]">10x</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -bottom-4 -left-4 bg-[#0a0a0f] border border-[#d4af37]/30 rounded-xl p-4 shadow-xl"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Salario promedio</p>
                    <p className="text-lg font-bold text-[#d4af37]">+200%</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-[#d4af37]/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <p className="text-white/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 mb-4">
              ¿Qué incluye?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Todo lo que necesitas para{" "}
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                acelerar
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Un programa diseñado para llevarte al siguiente nivel en tiempo récord
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-[#0a0a0f] border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 h-full group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-7 h-7 text-[#d4af37]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-white/60">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent via-[#d4af37]/5 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 mb-4">
              Historias de éxito
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ellos ya dieron el{" "}
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                salto cuántico
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="bg-[#0a0a0f] border-[#d4af37]/20 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full border-2 border-[#d4af37]/30"
                      />
                      <div>
                        <h4 className="font-bold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-[#d4af37]">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                      ))}
                    </div>
                    <p className="text-white/70 italic">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 mb-4">
                Acceso completo
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Todo incluido en tu{" "}
                <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                  membresía
                </span>
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-[#d4af37]" />
                    </div>
                    <span className="text-white/80">{benefit}</span>
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
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <Sparkles className="w-16 h-16 text-[#d4af37] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Programa Exclusivo</h3>
                    <p className="text-white/60">Plazas limitadas - Proceso de admisión</p>
                  </div>
                  
                  <div className="py-8 border-y border-[#d4af37]/20 my-6">
                    <p className="text-white/60 mb-2">Inversión personalizada según tu perfil</p>
                    <p className="text-4xl font-bold text-[#d4af37]">Agenda tu llamada</p>
                    <p className="text-white/60 text-sm mt-2">para conocer las opciones disponibles</p>
                  </div>

                  <Button 
                    size="lg"
                    onClick={handleScheduleCall}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-bold text-lg py-6 rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Agendar Llamada de Admisión
                  </Button>

                  <p className="text-xs text-white/40 mt-4">
                    Sin compromiso • Llamada informativa de 30 min
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="relative rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
            
            <div className="relative p-12 md:p-20 text-center">
              <Badge className="bg-white/10 text-white border-white/20 mb-6">
                <Clock className="w-4 h-4 mr-2" />
                Plazas limitadas
              </Badge>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                ¿Listo para dar el{" "}
                <span className="bg-gradient-to-r from-[#d4af37] to-[#f4e5b2] bg-clip-text text-transparent">
                  salto cuántico
                </span>
                ?
              </h2>
              
              <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
                Agenda una llamada con nuestro equipo de admisiones y descubre si el programa es para ti.
              </p>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg"
                  onClick={handleScheduleCall}
                  className="bg-gradient-to-r from-[#d4af37] to-[#c9a227] hover:from-[#c9a227] hover:to-[#b8922a] text-black font-bold text-xl px-12 py-8 rounded-xl shadow-[0_0_60px_rgba(212,175,55,0.4)]"
                >
                  Agendar Mi Llamada
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#d4af37]/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={codigoQuantumLogo} alt="Código Quantum" className="h-8 w-auto" />
              <span className="text-[#d4af37] font-bold">Código Quantum</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2024 Código Quantum. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <button className="text-white/40 hover:text-[#d4af37] text-sm transition-colors">
                Términos
              </button>
              <button className="text-white/40 hover:text-[#d4af37] text-sm transition-colors">
                Privacidad
              </button>
              <button 
                className="text-white/40 hover:text-[#d4af37] text-sm transition-colors"
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
