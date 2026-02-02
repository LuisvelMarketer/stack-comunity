import { useState, useEffect, useCallback } from "react";
import stackLogo from "@/assets/stack-logo.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, ArrowRight, Eye, EyeOff, Users, BookOpen, Trophy } from "lucide-react";
import { z } from "zod";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeText } from "@/lib/validation-schemas";

// Security: Extended list of common passwords
const COMMON_PASSWORDS = [
  "12345678", "password", "123456789", "12345", "1234567", 
  "password1", "qwerty", "abc123", "Password1", "password123",
  "letmein", "welcome", "monkey", "dragon", "master",
  "login", "admin", "passw0rd", "123123", "111111"
];

// Security: Regex patterns for input sanitization
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
];

// Security: Sanitize input to prevent XSS and injection
const sanitizeInput = (input: string): string => {
  let sanitized = input.trim();
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return sanitized;
};

// Security: Validate email format strictly
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 255 && !email.includes('..') && !email.startsWith('.') && !email.endsWith('.');
};

// Security: Strict validation schemas with sanitization
const signUpSchema = z.object({
  fullName: z.string()
    .transform(val => sanitizeInput(val))
    .pipe(z.string()
      .min(1, "El nombre es requerido")
      .max(100, "Nombre demasiado largo")
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nombre contiene caracteres no permitidos")
    ),
  email: z.string()
    .transform(val => sanitizeInput(val.toLowerCase()))
    .pipe(z.string()
      .email("Email inválido")
      .max(255, "Email demasiado largo")
      .refine(isValidEmail, "Formato de email inválido")
    ),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Contraseña demasiado larga")
    .regex(/[A-Z]/, "Debe contener una mayúscula")
    .regex(/[a-z]/, "Debe contener una minúscula")
    .regex(/[0-9]/, "Debe contener un número")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Debe contener un carácter especial")
    .refine((p) => !COMMON_PASSWORDS.includes(p.toLowerCase()), "Contraseña muy común")
    .refine((p) => !/(.)\1{2,}/.test(p), "No puede contener caracteres repetidos consecutivos"),
});

const signInSchema = z.object({
  email: z.string()
    .transform(val => sanitizeInput(val.toLowerCase()))
    .pipe(z.string()
      .email("Email inválido")
      .max(255)
    ),
  password: z.string()
    .min(1, "Contraseña requerida")
    .max(128, "Contraseña demasiado larga"),
});

const forgotPasswordSchema = z.object({
  email: z.string()
    .transform(val => sanitizeInput(val.toLowerCase()))
    .pipe(z.string()
      .email("Email inválido")
      .max(255)
    ),
});

// Security: Rate limiting for failed attempts
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { signIn, signUp, resetPassword, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine panel positions based on mode
  const isSignUp = mode === "signup";

  // Security: Check lockout status
  const isLockedOut = useCallback(() => {
    if (!lockoutUntil) return false;
    if (Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
      return false;
    }
    return true;
  }, [lockoutUntil]);

  // Security: Handle failed login attempt
  const handleFailedAttempt = useCallback(() => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(lockoutTime);
      toast({
        title: "Cuenta bloqueada temporalmente",
        description: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.",
        variant: "destructive",
      });
    }
  }, [failedAttempts, toast]);

  useEffect(() => {
    if (referralCode) {
      // Security: Sanitize referral code
      const sanitizedCode = sanitizeInput(referralCode).toUpperCase().slice(0, 20);
      if (/^[A-Z0-9]+$/.test(sanitizedCode)) {
        localStorage.setItem('referral_code', sanitizedCode);
      }
    }
  }, [referralCode]);

  const trackReferral = async (userId: string) => {
    const storedReferralCode = localStorage.getItem('referral_code');
    if (!storedReferralCode) return;
    try {
      // Security: Validate UUID format for user_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('Invalid user ID format');
        return;
      }
      
      await supabase.functions.invoke('track-referral', {
        body: { 
          referral_code: sanitizeInput(storedReferralCode), 
          user_id: userId 
        }
      });
      localStorage.removeItem('referral_code');
    } catch (error) {
      console.error('Error tracking referral:', error);
    }
  };

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Security: Check if locked out
    if (isLockedOut()) {
      const remainingTime = Math.ceil((lockoutUntil! - Date.now()) / 60000);
      toast({
        title: "Cuenta bloqueada",
        description: `Intenta de nuevo en ${remainingTime} minutos.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signin") {
        const validated = signInSchema.parse({ email, password });
        const result = await signIn(validated.email, validated.password);
        if (!result) {
          handleFailedAttempt();
        } else {
          setFailedAttempts(0);
        }
      } else if (mode === "signup") {
        const validated = signUpSchema.parse({ fullName, email, password });
        await signUp(validated.email, validated.password, validated.fullName);
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) await trackReferral(newUser.id);
      } else if (mode === "forgot") {
        const validated = forgotPasswordSchema.parse({ email });
        const result = await resetPassword(validated.email);
        if (result.success) setMode("signin");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      } else {
        // Security: Don't expose internal error details
        handleFailedAttempt();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (newMode: "signin" | "signup" | "forgot") => {
    setErrors({});
    setMode(newMode);
  };

  const features = [
    { icon: Users, title: "Comunidades activas", desc: "Conecta con miles de miembros" },
    { icon: BookOpen, title: "Cursos exclusivos", desc: "Aprende de expertos del sector" },
    { icon: Trophy, title: "Gamificación", desc: "Gana puntos y desbloquea logros" },
  ];

  // Branding Panel Component
  const BrandingPanel = () => (
    <motion.div 
      layout
      className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0f14 0%, #14181E 50%, #1a2530 100%)'
      }}
    >
      {/* Animated glow orbs */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-20 w-80 h-80 rounded-full blur-[100px]"
          style={{ background: 'hsl(171 52% 56% / 0.25)' }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2] 
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'hsl(171 52% 56% / 0.2)' }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15] 
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px]"
          style={{ background: 'hsl(171 52% 56% / 0.15)' }}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(171 52% 56%) 1px, transparent 1px), linear-gradient(90deg, hsl(171 52% 56%) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Logo and brand */}
      <motion.div 
        className="relative z-10 flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <div 
            className="absolute inset-0 blur-xl rounded-xl"
            style={{ background: 'hsl(171 52% 56% / 0.5)' }}
          />
          <img src={stackLogo} alt="STACK" className="relative w-16 h-16 rounded-xl" />
        </div>
        <div>
          <h1 
            className="text-4xl font-bold tracking-widest"
            style={{ 
              color: 'hsl(171 52% 56%)',
              textShadow: '0 0 40px hsl(171 52% 56% / 0.6), 0 0 80px hsl(171 52% 56% / 0.3)'
            }}
          >
            STACK
          </h1>
          <p className="text-white/70 text-lg tracking-wide">Infrastructure for the Elite</p>
        </div>
      </motion.div>

      <div className="relative z-10 space-y-8">
        {features.map((feature, i) => (
          <motion.div 
            key={i} 
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div 
              className="w-14 h-14 rounded-xl backdrop-blur-sm flex items-center justify-center flex-shrink-0 border"
              style={{ 
                background: 'hsl(171 52% 56% / 0.15)',
                borderColor: 'hsl(171 52% 56% / 0.3)',
                boxShadow: '0 0 20px hsl(171 52% 56% / 0.2)'
              }}
            >
              <feature.icon className="h-6 w-6" style={{ color: 'hsl(171 52% 56%)' }} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
              <p className="text-white/60">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div 
                key={i} 
                className="w-10 h-10 rounded-full backdrop-blur-sm border-2"
                style={{ 
                  background: 'hsl(171 52% 56% / 0.2)',
                  borderColor: 'hsl(171 52% 56% / 0.4)'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
              />
            ))}
          </div>
          <p className="text-white/80 text-sm">
            <span className="font-semibold" style={{ color: 'hsl(171 52% 56%)' }}>+10,000</span> miembros activos
          </p>
        </div>
        <p className="text-white/40 text-sm">
          © 2024 STACK. All rights reserved.
        </p>
      </motion.div>
    </motion.div>
  );

  // Form Panel Component
  const FormPanel = () => (
    <motion.div 
      layout
      className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8 flex items-center justify-center gap-2">
          <img src={stackLogo} alt="STACK" className="w-10 h-10 rounded-lg" />
          <h1 className="text-3xl font-semibold tracking-widest bg-gradient-primary bg-clip-text text-transparent">
            STACK
          </h1>
        </div>

        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={mode}
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold">
              {mode === "signin" && "Bienvenido de nuevo"}
              {mode === "signup" && "Crea tu cuenta"}
              {mode === "forgot" && "Recuperar contraseña"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "signin" && "Ingresa a tu cuenta para continuar"}
              {mode === "signup" && "Únete a la comunidad de aprendizaje"}
              {mode === "forgot" && "Te enviaremos un enlace de recuperación"}
            </p>
          </motion.div>
        </AnimatePresence>

        {(referralCode || localStorage.getItem('referral_code')) && (
          <Badge variant="secondary" className="w-fit mx-auto flex bg-green-500/10 text-green-600 border-green-500/30">
            <Gift className="h-3 w-3 mr-1" />
            Invitado por un amigo
          </Badge>
        )}

        {mode !== "forgot" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={signInWithGoogle}
              className="w-full h-12 text-base"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">o continúa con email</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div 
                key="fullName"
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`h-12 ${errors.fullName ? "border-destructive" : ""}`}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <AnimatePresence mode="wait">
            {mode !== "forgot" && (
              <motion.div 
                key="password"
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("forgot")}
                      className="text-sm text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                {mode === "signup" && <PasswordStrengthIndicator password={password} />}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Cargando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "signin" && "Iniciar Sesión"}
                  {mode === "signup" && "Crear Cuenta"}
                  {mode === "forgot" && "Enviar enlace"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </motion.div>
        </motion.form>

        {/* Mode switcher */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => handleModeSwitch("signin")}
              className="text-sm text-primary hover:underline"
            >
              Volver a iniciar sesión
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <motion.button
                type="button"
                onClick={() => handleModeSwitch(mode === "signin" ? "signup" : "signin")}
                className="text-primary hover:underline font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mode === "signin" ? "Regístrate gratis" : "Inicia sesión"}
              </motion.button>
            </p>
          )}
        </motion.div>

        {/* Terms */}
        <AnimatePresence>
          {mode === "signup" && (
            <motion.p 
              className="text-xs text-center text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              Al registrarte, aceptas nuestros{" "}
              <a href="#" className="text-primary hover:underline">Términos de Servicio</a>
              {" "}y{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="min-h-screen flex overflow-hidden"
      layout
    >
      <AnimatePresence mode="wait" initial={false}>
        {isSignUp ? (
          <motion.div
            key="signup-layout"
            className="min-h-screen w-full flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* When signup: Form on LEFT, Branding on RIGHT */}
            <motion.div
              className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5
              }}
            >
              <FormPanelContent 
                mode={mode}
                handleModeSwitch={handleModeSwitch}
                handleSubmit={handleSubmit}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                fullName={fullName}
                setFullName={setFullName}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                errors={errors}
                isLoading={isLoading}
                signInWithGoogle={signInWithGoogle}
                referralCode={referralCode}
              />
            </motion.div>
            <motion.div
              className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5
              }}
            >
              <BrandingContent features={features} isSignUp={isSignUp} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="signin-layout"
            className="min-h-screen w-full flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* When signin/forgot: Branding on LEFT, Form on RIGHT */}
            <motion.div
              className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5
              }}
            >
              <BrandingContent features={features} isSignUp={isSignUp} />
            </motion.div>
            <motion.div
              className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.5
              }}
            >
              <FormPanelContent 
                mode={mode}
                handleModeSwitch={handleModeSwitch}
                handleSubmit={handleSubmit}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                fullName={fullName}
                setFullName={setFullName}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                errors={errors}
                isLoading={isLoading}
                signInWithGoogle={signInWithGoogle}
                referralCode={referralCode}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Extracted Branding Content Component
const BrandingContent = ({ features, isSignUp }: { features: { icon: any; title: string; desc: string }[]; isSignUp: boolean }) => (
  <>
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-10">
      <motion.div 
        className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1] 
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </div>
    
    <motion.div 
      className="relative z-10 flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <img src={stackLogo} alt="STACK" className="w-12 h-12 rounded-lg" />
      <div>
        <h1 className="text-4xl font-semibold tracking-widest text-white">STACK</h1>
        <p className="text-white/80 text-lg">Infrastructure for the Elite</p>
      </div>
    </motion.div>

    <div className="relative z-10 space-y-8">
      {features.map((feature, i) => (
        <motion.div 
          key={i} 
          className="flex items-start gap-4"
          initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <feature.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
            <p className="text-white/70">{feature.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>

    <motion.div 
      className="relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <motion.div 
              key={i} 
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
            />
          ))}
        </div>
        <p className="text-white/90 text-sm">
          <span className="font-semibold">+10,000</span> miembros activos
        </p>
      </div>
      <p className="text-white/60 text-sm">
        © 2024 Skoolify. Todos los derechos reservados.
      </p>
    </motion.div>
  </>
);

// Extracted Form Panel Content Component
const FormPanelContent = ({
  mode,
  handleModeSwitch,
  handleSubmit,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  showPassword,
  setShowPassword,
  errors,
  isLoading,
  signInWithGoogle,
  referralCode
}: {
  mode: "signin" | "signup" | "forgot";
  handleModeSwitch: (mode: "signin" | "signup" | "forgot") => void;
  handleSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  signInWithGoogle: () => void;
  referralCode: string | null;
}) => (
  <div className="w-full max-w-md space-y-8">
    {/* Mobile logo */}
    <div className="lg:hidden text-center mb-8 flex items-center justify-center gap-2">
      <img src={stackLogo} alt="STACK" className="w-10 h-10 rounded-lg" />
      <h1 className="text-3xl font-semibold tracking-widest bg-gradient-primary bg-clip-text text-transparent">
        STACK
      </h1>
    </div>

    {/* Header */}
    <AnimatePresence mode="wait">
      <motion.div 
        key={mode}
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold">
          {mode === "signin" && "Bienvenido de nuevo"}
          {mode === "signup" && "Crea tu cuenta"}
          {mode === "forgot" && "Recuperar contraseña"}
        </h2>
        <p className="text-muted-foreground">
          {mode === "signin" && "Ingresa a tu cuenta para continuar"}
          {mode === "signup" && "Únete a la comunidad de aprendizaje"}
          {mode === "forgot" && "Te enviaremos un enlace de recuperación"}
        </p>
      </motion.div>
    </AnimatePresence>

    {(referralCode || localStorage.getItem('referral_code')) && (
      <Badge variant="secondary" className="w-fit mx-auto flex bg-green-500/10 text-green-600 border-green-500/30">
        <Gift className="h-3 w-3 mr-1" />
        Invitado por un amigo
      </Badge>
    )}

    {mode !== "forgot" && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={signInWithGoogle}
          className="w-full h-12 text-base"
        >
          <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-muted-foreground">o continúa con email</span>
          </div>
        </div>
      </motion.div>
    )}

    {/* Form */}
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {mode === "signup" && (
          <motion.div 
            key="fullName"
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`h-12 ${errors.fullName ? "border-destructive" : ""}`}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-12 ${errors.email ? "border-destructive" : ""}`}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <AnimatePresence mode="wait">
        {mode !== "forgot" && (
          <motion.div 
            key="password"
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch("forgot")}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            {mode === "signup" && <PasswordStrengthIndicator password={password} />}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Cargando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {mode === "signin" && "Iniciar Sesión"}
              {mode === "signup" && "Crear Cuenta"}
              {mode === "forgot" && "Enviar enlace"}
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </motion.div>
    </motion.form>

    {/* Mode switcher */}
    <motion.div 
      className="text-center space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {mode === "forgot" ? (
        <button
          type="button"
          onClick={() => handleModeSwitch("signin")}
          className="text-sm text-primary hover:underline"
        >
          Volver a iniciar sesión
        </button>
      ) : (
        <p className="text-sm text-muted-foreground">
          {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <motion.button
            type="button"
            onClick={() => handleModeSwitch(mode === "signin" ? "signup" : "signin")}
            className="text-primary hover:underline font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mode === "signin" ? "Regístrate gratis" : "Inicia sesión"}
          </motion.button>
        </p>
      )}
    </motion.div>

    {/* Terms */}
    <AnimatePresence>
      {mode === "signup" && (
        <motion.p 
          className="text-xs text-center text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          Al registrarte, aceptas nuestros{" "}
          <a href="#" className="text-primary hover:underline">Términos de Servicio</a>
          {" "}y{" "}
          <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

export default Auth;
