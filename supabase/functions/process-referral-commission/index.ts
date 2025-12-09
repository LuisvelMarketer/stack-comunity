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

    const { user_id, subscription_amount } = await req.json();
    
    // Use authenticated user's ID for security, ignore user_id from body
    const effectiveUserId = user.id;
    
    // Validate subscription_amount
    if (typeof subscription_amount !== 'number' || subscription_amount <= 0 || subscription_amount > 100000) {
      logStep("Invalid subscription_amount", { subscription_amount });
      return new Response(JSON.stringify({ error: "Invalid subscription amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    logStep("Processing commission", { user_id: effectiveUserId, subscription_amount });

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
      .eq("referred_user_id", effectiveUserId)
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
    
    // Validate commission rate is reasonable (0-100%)
    if (commissionRate < 0 || commissionRate > 100) {
      logStep("Invalid commission rate", { commissionRate });
      throw new Error("Invalid commission rate in database");
    }
    
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
