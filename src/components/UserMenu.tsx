import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, LayoutDashboard, Shield, MessageCircle, Gift, Users, CreditCard } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";

interface UserMenuProps {
  showAdminLink?: boolean;
}

export const UserMenu = ({ showAdminLink = false }: UserMenuProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; level: number }>({
    full_name: null,
    avatar_url: null,
    level: 1,
  });
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUnreadMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('unread-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages'
          },
          (payload) => {
            // Check if message is for current user and not sent by them
            if (payload.new.sender_id !== user.id) {
              setUnreadMessages(prev => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'direct_messages',
            filter: `read=eq.true`
          },
          () => {
            fetchUnreadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadMessages = async () => {
    if (!user) return;
    
    try {
      // Get all conversations where user is a participant
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

      if (!conversations || conversations.length === 0) {
        setUnreadMessages(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Count unread messages not sent by current user
      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .eq("read", false)
        .neq("sender_id", user.id);

      setUnreadMessages(count || 0);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, level")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex items-center gap-2">
      <GlobalSearch />
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => navigate("/messages")}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </Button>
      <NotificationCenter />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
            <UserAvatar
              src={profile.avatar_url}
              fallback={getInitials()}
              level={profile.level}
              size="md"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-64 bg-card z-50" 
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium leading-none">
                {profile.full_name || "Mi Cuenta"}
              </p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs leading-none text-muted-foreground">
                  Usuario registrado desde {new Date(user?.created_at || "").toLocaleDateString("es-ES", { 
                    month: "short", 
                    year: "numeric" 
                  })}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Mi Dashboard</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate("/profile")}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate("/affiliate")}
            className="cursor-pointer"
          >
            <Gift className="mr-2 h-4 w-4" />
            <span>Programa de Afiliados</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate("/my-communities")}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Mis Comunidades</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate("/subscriptions")}
            className="cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Mis Suscripciones</span>
          </DropdownMenuItem>

          {showAdminLink && (
            <DropdownMenuItem 
              onClick={() => navigate("/admin")}
              className="cursor-pointer"
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Panel de Admin</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={signOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
