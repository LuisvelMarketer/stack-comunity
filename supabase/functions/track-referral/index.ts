import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-REFERRAL] ${step}${detailsStr}`);
};

// Helper function to verify user authentication
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, error: "No authorization header" };
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user, error: null };
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      logStep("Authentication failed", { error: authError });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { referral_code, user_id } = await req.json();
    
    // Validate inputs
    if (!referral_code || typeof referral_code !== 'string' || referral_code.length > 20) {
      logStep("Invalid referral_code");
      return new Response(JSON.stringify({ success: false, error: "Código de referido inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Use authenticated user's ID, ignore user_id from request body for security
    const effectiveUserId = user.id;
    
    logStep("Processing referral", { referral_code, user_id: effectiveUserId });

    // Find affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from("affiliates")
      .select("id, user_id")
      .eq("referral_code", referral_code.toUpperCase().trim())
      .single();

    if (affiliateError || !affiliate) {
      logStep("Affiliate not found", { referral_code });
      return new Response(JSON.stringify({ success: false, error: "Código de referido no válido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prevent self-referral
    if (affiliate.user_id === effectiveUserId) {
      logStep("Self-referral attempt blocked");
      return new Response(JSON.stringify({ success: false, error: "No puedes usar tu propio código" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user was already referred
    const { data: existingReferral } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_user_id", effectiveUserId)
      .single();

    if (existingReferral) {
      logStep("User already referred");
      return new Response(JSON.stringify({ success: false, error: "Ya tienes un código de referido asignado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create referral record
    const { error: insertError } = await supabaseAdmin
      .from("referrals")
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: effectiveUserId,
        status: "pending"
      });

    if (insertError) {
      throw insertError;
    }

    logStep("Referral tracked successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
