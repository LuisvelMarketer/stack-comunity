import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OnlineUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  online_at: string;
}

export const useOnlinePresence = (communityId: string | undefined) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!communityId || !user) return;

    const channelName = `community-presence-${communityId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            users.push({
              id: presence.user_id,
              full_name: presence.full_name,
              avatar_url: presence.avatar_url,
              online_at: presence.online_at,
            });
          });
        });

        setOnlineUsers(users);
        setOnlineCount(users.length);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("User left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        // Get current user profile for presence data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        // Track user presence
        await channel.track({
          user_id: user.id,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          online_at: new Date().toISOString(),
        });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, user]);

  return { onlineUsers, onlineCount };
};