import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret to prevent unauthorized calls
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow calls with service role key OR cron secret
    if (cronSecret && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== cronSecret && token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        console.log("[PROCESS-SCHEDULED-NOTIFICATIONS] Unauthorized access attempt");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing scheduled notifications...");

    // Get all scheduled notifications that are due
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from("broadcast_notifications")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled notifications:", fetchError);
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log("No scheduled notifications to process");
      return new Response(
        JSON.stringify({ message: "No scheduled notifications to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${scheduledNotifications.length} notifications to send`);

    for (const notification of scheduledNotifications) {
      try {
        // Get community name
        const { data: community } = await supabase
          .from("communities")
          .select("name")
          .eq("id", notification.community_id)
          .single();

        // Get filtered members
        let membersQuery = supabase
          .from("community_members")
          .select("user_id, joined_at")
          .eq("community_id", notification.community_id)
          .eq("is_owner", false);

        const { data: members } = await membersQuery;

        if (!members || members.length === 0) {
          console.log(`No members for notification ${notification.id}`);
          await supabase
            .from("broadcast_notifications")
            .update({ status: "sent", recipients_count: 0 })
            .eq("id", notification.id);
          continue;
        }

        let filteredMembers = members;

        // Apply join date filter
        if (notification.join_date_filter && notification.join_date_filter !== "all") {
          const now = new Date();
          let cutoffDate: Date;

          switch (notification.join_date_filter) {
            case "7days":
              cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "30days":
              cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case "3months":
              cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            case "6months":
              cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
              break;
            default:
              cutoffDate = new Date(0);
          }

          filteredMembers = filteredMembers.filter(
            (m) => new Date(m.joined_at) >= cutoffDate
          );
        }

        // Apply level filter
        if (notification.level_filter && notification.level_filter !== "all") {
          const userIds = filteredMembers.map((m) => m.user_id);
          
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, level")
              .in("id", userIds);

            if (profiles) {
              const targetLevel = parseInt(notification.level_filter);
              const levelUserIds = new Set(
                profiles.filter((p) => p.level >= targetLevel).map((p) => p.id)
              );
              filteredMembers = filteredMembers.filter((m) =>
                levelUserIds.has(m.user_id)
              );
            }
          }
        }

        if (filteredMembers.length === 0) {
          console.log(`No filtered members for notification ${notification.id}`);
          await supabase
            .from("broadcast_notifications")
            .update({ status: "sent", recipients_count: 0 })
            .eq("id", notification.id);
          continue;
        }

        // Create notifications for filtered members
        const communityName = community?.name || "Comunidad";
        const notificationsToInsert = filteredMembers.map((member) => ({
          user_id: member.user_id,
          type: "community_broadcast",
          title: `${communityName}: ${notification.title}`,
          content: notification.content,
          link: `/community/${notification.community_id}`,
        }));

        const { error: insertError } = await supabase
          .from("notifications")
          .insert(notificationsToInsert);

        if (insertError) {
          console.error(`Error inserting notifications for ${notification.id}:`, insertError);
          continue;
        }

        // Update broadcast status
        await supabase
          .from("broadcast_notifications")
          .update({ status: "sent", recipients_count: filteredMembers.length })
          .eq("id", notification.id);

        console.log(`Sent notification ${notification.id} to ${filteredMembers.length} members`);
      } catch (err) {
        console.error(`Error processing notification ${notification.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: scheduledNotifications.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
