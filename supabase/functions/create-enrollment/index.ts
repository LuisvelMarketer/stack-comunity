import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("SKOOL_WEBHOOK_SECRET");
    
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.log("[CREATE-ENROLLMENT] Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, full_name, course_type, tier, amount_cents, currency, purchase_date, stripe_session_id, source } = body;

    console.log("[CREATE-ENROLLMENT] Received enrollment request", { email, course_type, source });

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists in profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("email", email)
      .single();

    if (existingProfile?.user_id) {
      // User exists - create enrollment directly
      const { error: enrollmentError } = await supabase
        .from("course_enrollments")
        .upsert({
          user_id: existingProfile.user_id,
          course_type: course_type || "cero",
          tier: tier || "standard",
          is_active: true,
          enrolled_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_type" });

      if (enrollmentError) {
        console.log("[CREATE-ENROLLMENT] Error creating enrollment", enrollmentError);
        throw enrollmentError;
      }

      console.log("[CREATE-ENROLLMENT] Enrollment created for existing user", { email });
    } else {
      // User doesn't exist yet - store in pending_enrollments
      const { error: pendingError } = await supabase
        .from("pending_enrollments")
        .upsert({
          email,
          full_name,
          course_type: course_type || "cero",
          tier: tier || "standard",
          amount_cents,
          currency,
          purchase_date,
          stripe_session_id,
          source: source || "webhook",
          status: "pending",
        }, { onConflict: "email,course_type" });

      if (pendingError) {
        console.log("[CREATE-ENROLLMENT] Error creating pending enrollment", pendingError);
        throw pendingError;
      }

      console.log("[CREATE-ENROLLMENT] Pending enrollment created", { email });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CREATE-ENROLLMENT] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
