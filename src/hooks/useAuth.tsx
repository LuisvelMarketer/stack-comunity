import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Security: Input validation schemas
const emailSchema = z.string()
  .email("Email inválido")
  .max(255, "Email demasiado largo")
  .transform(val => val.toLowerCase().trim());

const passwordSchema = z.string()
  .min(1, "Contraseña requerida")
  .max(128, "Contraseña demasiado larga");

const fullNameSchema = z.string()
  .min(1, "Nombre requerido")
  .max(100, "Nombre demasiado largo")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nombre contiene caracteres no permitidos")
  .transform(val => val.trim());

// Security: Sanitize input to prevent injection
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check if user needs onboarding after sign in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', session.user.id)
              .single();

            if (profile && !profile.onboarding_completed) {
              navigate('/onboarding');
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      // Security: Validate and sanitize all inputs
      const validatedEmail = emailSchema.parse(email);
      const validatedPassword = passwordSchema.parse(password);
      const validatedName = fullNameSchema.parse(sanitizeInput(fullName));

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedEmail,
        password: validatedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validatedName,
          },
        },
      });

      if (error) {
        // Security: Log failed signup attempt (without sensitive data)
        console.warn('Signup failed:', error.message);
        throw error;
      }

      // Security: Verify user was actually created
      if (!data.user) {
        throw new Error('Error al crear usuario');
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Bienvenido a la plataforma",
      });

      navigate("/dashboard");
      return true;
    } catch (error: any) {
      // Security: Don't expose internal error details to user
      const userMessage = error.message?.includes('already registered') 
        ? 'Este email ya está registrado'
        : 'Error al crear cuenta. Verifica tus datos.';
      
      toast({
        title: "Error al crear cuenta",
        description: userMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [navigate, toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Security: Validate inputs before sending to server
      const validatedEmail = emailSchema.parse(email);
      const validatedPassword = passwordSchema.parse(password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedEmail,
        password: validatedPassword,
      });

      if (error) {
        // Security: Log failed login attempt
        console.warn('Login failed for email:', validatedEmail.substring(0, 3) + '***');
        throw error;
      }

      // Security: Verify session was created
      if (!data.session) {
        throw new Error('Error de autenticación');
      }

      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente",
      });

      navigate("/dashboard");
      return true;
    } catch (error: any) {
      // Security: Generic error message to prevent user enumeration
      toast({
        title: "Error al iniciar sesión",
        description: "Email o contraseña incorrectos",
        variant: "destructive",
      });
      return false;
    }
  }, [navigate, toast]);

  const signOut = useCallback(async () => {
    try {
      // Security: Clear any cached data before signing out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      // Security: Clear local storage items that might contain sensitive data
      localStorage.removeItem('referral_code');

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: "Error al cerrar sesión. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Security: Validate email before sending
      const validatedEmail = emailSchema.parse(email);
      
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      // Security: Always show success message to prevent email enumeration
      toast({
        title: "Email enviado",
        description: "Si el email existe, recibirás un enlace de recuperación",
      });

      return { success: true };
    } catch (error: any) {
      // Security: Don't reveal if email exists or not
      toast({
        title: "Email enviado",
        description: "Si el email existe, recibirás un enlace de recuperación",
      });
      return { success: true }; // Always return success to prevent enumeration
    }
  }, [toast]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      // Security: Validate new password
      const validatedPassword = z.string()
        .min(8, "Mínimo 8 caracteres")
        .max(128, "Contraseña demasiado larga")
        .regex(/[A-Z]/, "Debe contener una mayúscula")
        .regex(/[a-z]/, "Debe contener una minúscula")
        .regex(/[0-9]/, "Debe contener un número")
        .parse(newPassword);

      const { error } = await supabase.auth.updateUser({
        password: validatedPassword,
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      });

      navigate("/dashboard");
      return { success: true };
    } catch (error: any) {
      const message = error instanceof z.ZodError 
        ? error.errors[0]?.message 
        : "Error al actualizar contraseña";
      
      toast({
        title: "Error al actualizar contraseña",
        description: message,
        variant: "destructive",
      });
      return { success: false };
    }
  }, [navigate, toast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión con Google",
        description: "No se pudo conectar con Google. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
  };
};