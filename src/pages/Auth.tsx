import { useState, useEffect } from "react";
import skoolifyLogo from "@/assets/skoolify-logo.png";
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

const COMMON_PASSWORDS = [
  "12345678", "password", "123456789", "12345", "1234567", 
  "password1", "qwerty", "abc123", "Password1", "password123"
];

const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.string().email("Email inválido").max(255),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .max(128)
    .regex(/[A-Z]/, "Debe contener una mayúscula")
    .regex(/[0-9]/, "Debe contener un número")
    .refine((p) => !COMMON_PASSWORDS.includes(p.toLowerCase()), "Contraseña muy común"),
});

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const { signIn, signUp, resetPassword, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (referralCode) {
      localStorage.setItem('referral_code', referralCode.toUpperCase());
    }
  }, [referralCode]);

  const trackReferral = async (userId: string) => {
    const storedReferralCode = localStorage.getItem('referral_code');
    if (!storedReferralCode) return;
    try {
      await supabase.functions.invoke('track-referral', {
        body: { referral_code: storedReferralCode, user_id: userId }
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
    setIsLoading(true);

    try {
      if (mode === "signin") {
        const validated = signInSchema.parse({ email, password });
        await signIn(validated.email, validated.password);
      } else if (mode === "signup") {
        const validated = signUpSchema.parse({ fullName, email, password });
        await signUp(validated.email, validated.password, validated.fullName);
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) await trackReferral(newUser.id);
      } else if (mode === "forgot") {
        const result = await resetPassword(email);
        if (result.success) setMode("signin");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Users, title: "Comunidades activas", desc: "Conecta con miles de miembros" },
    { icon: BookOpen, title: "Cursos exclusivos", desc: "Aprende de expertos del sector" },
    { icon: Trophy, title: "Gamificación", desc: "Gana puntos y desbloquea logros" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <img src={skoolifyLogo} alt="Skoolify" className="w-12 h-12 rounded-lg" />
          <div>
            <h1 className="text-4xl font-bold text-white">Skoolify</h1>
            <p className="text-white/80 text-lg">La plataforma de comunidades de aprendizaje</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                <p className="text-white/70">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30" />
              ))}
            </div>
            <p className="text-white/90 text-sm">
              <span className="font-semibold">+10,000</span> miembros activos
            </p>
          </div>
          <p className="text-white/60 text-sm">
            © 2024 Skoolify. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 flex items-center justify-center gap-2">
            <img src={skoolifyLogo} alt="Skoolify" className="w-10 h-10 rounded-lg" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Skoolify
            </h1>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
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
          </div>

          {(referralCode || localStorage.getItem('referral_code')) && (
            <Badge variant="secondary" className="w-fit mx-auto flex bg-green-500/10 text-green-600 border-green-500/30">
              <Gift className="h-3 w-3 mr-1" />
              Invitado por un amigo
            </Badge>
          )}

          {mode !== "forgot" && (
            <>
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground">o continúa con email</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`h-12 ${errors.fullName ? "border-destructive" : ""}`}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
            )}

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

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
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
              </div>
            )}

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
          </form>

          {/* Mode switcher */}
          <div className="text-center space-y-2">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-sm text-primary hover:underline"
              >
                Volver a iniciar sesión
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-primary hover:underline font-medium"
                >
                  {mode === "signin" ? "Regístrate gratis" : "Inicia sesión"}
                </button>
              </p>
            )}
          </div>

          {/* Terms */}
          {mode === "signup" && (
            <p className="text-xs text-center text-muted-foreground">
              Al registrarte, aceptas nuestros{" "}
              <a href="#" className="text-primary hover:underline">Términos de Servicio</a>
              {" "}y{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
