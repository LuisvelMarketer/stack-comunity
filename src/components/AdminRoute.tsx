import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!loading && user) {
        try {
          const { data, error } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          });

          if (error) throw error;

          if (!data) {
            navigate("/dashboard");
            return;
          }

          setIsAdmin(data);
        } catch (error) {
          console.error("Error checking admin role:", error);
          navigate("/dashboard");
        } finally {
          setChecking(false);
        }
      } else if (!loading && !user) {
        navigate("/auth");
      }
    };

    checkAdminRole();
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : null;
};
