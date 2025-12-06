import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-COMMISSION] ${step}${detailsStr}`);
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
    
    const { user_id, subscription_amount } = await req.json();
    
    if (!user_id || !subscription_amount) {
      throw new Error("Missing user_id or subscription_amount");
    }
    
    logStep("Processing commission", { user_id, subscription_amount });

    // Find pending referral for this user
    const { data: referral, error: referralError } = await supabaseAdmin
      .from("referrals")
      .select(`
        id,
        affiliate_id,
        affiliates (
          id,
          commission_rate
        )
      `)
      .eq("referred_user_id", user_id)
      .eq("status", "pending")
      .single();

    if (referralError || !referral) {
      logStep("No pending referral found for user");
      return new Response(JSON.stringify({ success: true, commission_created: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate commission
    const affiliateData = referral.affiliates as any;
    const commissionRate = affiliateData?.commission_rate || 20;
    const commissionAmount = (subscription_amount * commissionRate) / 100;

    logStep("Calculated commission", { commissionRate, commissionAmount });

    // Update referral status to converted
    await supabaseAdmin
      .from("referrals")
      .update({
        status: "converted",
        converted_at: new Date().toISOString()
      })
      .eq("id", referral.id);

    // Create commission record
    const { error: commissionError } = await supabaseAdmin
      .from("commissions")
      .insert({
        affiliate_id: referral.affiliate_id,
        referral_id: referral.id,
        amount: commissionAmount,
        subscription_amount: subscription_amount,
        status: "pending"
      });

    if (commissionError) {
      throw commissionError;
    }

    logStep("Commission created successfully");

    return new Response(JSON.stringify({ success: true, commission_created: true, amount: commissionAmount }), {
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
