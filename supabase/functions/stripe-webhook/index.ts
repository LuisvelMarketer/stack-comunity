import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Código Cero product and price IDs
const CODIGO_CERO_PRICE_ID = "price_1SqzUwPj8vjAHltshbt4EmDf";
const CODIGO_CERO_PRODUCT_ID = "prod_TockytiwhBNeam";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No stripe-signature header found");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMsg });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", {
          sessionId: session.id,
          customerEmail: session.customer_email,
          mode: session.mode,
        });

        if (session.mode === "subscription" || session.mode === "payment") {
          const customerEmail = session.customer_email || session.customer_details?.email;
          const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
          const currency = session.currency?.toUpperCase() || "USD";
          
          // Get metadata from the session
          const metadata = session.metadata || {};
          const courseType = metadata.course_type || "codigo_cero";
          const tier = metadata.tier || "standard";
          const fullName = session.customer_details?.name || metadata.full_name || null;

          logStep("Session details", { customerEmail, amountTotal, currency, courseType, tier });

          if (customerEmail) {
            // Check if user exists
            const { data: existingProfile, error: profileError } = await supabaseAdmin
              .from("profiles")
              .select("id, email")
              .eq("email", customerEmail)
              .maybeSingle();

            if (profileError) {
              logStep("Error checking profile", { error: profileError.message });
            }

            if (existingProfile) {
              logStep("User exists, creating enrollment", { userId: existingProfile.id });
              
              // Get default course
              const { data: defaultCourse } = await supabaseAdmin
                .from("courses")
                .select("id, community_id")
                .eq("is_published", true)
                .order("order_index", { ascending: true })
                .limit(1)
                .single();

              if (defaultCourse) {
                const { error: enrollmentError } = await supabaseAdmin
                  .from("course_enrollments")
                  .upsert({
                    user_id: existingProfile.id,
                    course_id: defaultCourse.id,
                    community_id: defaultCourse.community_id,
                    course_type: courseType,
                    tier: tier,
                    amount_paid: amountTotal,
                    currency: currency,
                    stripe_session_id: session.id,
                    is_active: true,
                    status: "active",
                    enrolled_at: new Date().toISOString(),
                  }, {
                    onConflict: "user_id,course_id",
                  });

                if (enrollmentError) {
                  logStep("Error creating enrollment", { error: enrollmentError.message });
                } else {
                  logStep("Enrollment created successfully");
                }
              }
            } else {
              logStep("User does not exist, creating pending enrollment");
              
              // Create pending enrollment
              const { error: pendingError } = await supabaseAdmin
                .from("pending_enrollments")
                .insert({
                  email: customerEmail,
                  full_name: fullName,
                  course_type: courseType,
                  tier: tier,
                  amount_paid: amountTotal,
                  currency: currency,
                  stripe_session_id: session.id,
                  source: "stripe_checkout",
                  status: "pending",
                  purchase_date: new Date().toISOString(),
                });

              if (pendingError) {
                logStep("Error creating pending enrollment", { error: pendingError.message });
              } else {
                logStep("Pending enrollment created successfully");
              }
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment succeeded", {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        });
        // Additional logic for successful payments if needed
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", {
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        // Handle failed payments - could notify user or update status
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
