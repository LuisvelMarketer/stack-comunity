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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    
    const { referral_code, user_id } = await req.json();
    
    if (!referral_code || !user_id) {
      throw new Error("Missing referral_code or user_id");
    }
    
    logStep("Processing referral", { referral_code, user_id });

    // Find affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from("affiliates")
      .select("id, user_id")
      .eq("referral_code", referral_code.toUpperCase())
      .single();

    if (affiliateError || !affiliate) {
      logStep("Affiliate not found", { referral_code });
      return new Response(JSON.stringify({ success: false, error: "Código de referido no válido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prevent self-referral
    if (affiliate.user_id === user_id) {
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
      .eq("referred_user_id", user_id)
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
        referred_user_id: user_id,
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
