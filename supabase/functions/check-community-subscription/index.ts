import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-COMMUNITY-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { community_id } = await req.json();
    if (!community_id) throw new Error("community_id is required");

    // Get community details
    const { data: community, error: communityError } = await supabaseClient
      .from("communities")
      .select("id, is_paid, stripe_product_id")
      .eq("id", community_id)
      .single();

    if (communityError || !community) {
      throw new Error("Community not found");
    }

    // If community is free, return subscribed
    if (!community.is_paid) {
      return new Response(JSON.stringify({ 
        subscribed: true, 
        is_free: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false, is_free: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    // Check if any subscription is for this community's product
    const hasActiveSubscription = subscriptions.data.some((sub: any) => {
      return sub.items.data.some((item: any) => 
        item.price.product === community.stripe_product_id
      );
    });

    logStep("Subscription check complete", { hasActiveSubscription });

    // Update local subscription record
    if (hasActiveSubscription) {
      const activeSub = subscriptions.data.find((sub: any) => 
        sub.items.data.some((item: any) => item.price.product === community.stripe_product_id)
      );

      if (activeSub) {
        await supabaseClient
          .from("community_subscriptions")
          .upsert({
            user_id: user.id,
            community_id: community_id,
            stripe_customer_id: customerId,
            stripe_subscription_id: activeSub.id,
            status: activeSub.status,
            current_period_start: new Date(activeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: activeSub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,community_id'
          });
      }
    }

    return new Response(JSON.stringify({ 
      subscribed: hasActiveSubscription, 
      is_free: false 
    }), {
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
