import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// CORS - allow external webhook sources
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
};

// Input validation schema with flexible sanitization for external webhooks
const enrollmentSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform(val => val.toLowerCase().trim()),
  full_name: z.string()
    .max(100, "Name too long")
    .optional()
    .transform(val => val?.trim().replace(/[<>]/g, '')), // Basic XSS prevention
  course_type: z.string().default("cero").transform(val => {
    // Normalize course_type values
    const normalized = val.toLowerCase().trim();
    if (normalized === "quantum" || normalized === "codigo quantum") return "quantum";
    return "cero";
  }),
  tier: z.string().default("standard").transform(val => {
    const normalized = val.toLowerCase().trim();
    if (["premium", "vip"].includes(normalized)) return normalized;
    return "standard";
  }),
  amount_paid: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === undefined || val === null || val === "") return undefined;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? undefined : Math.round(num);
  }),
  amount_cents: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === undefined || val === null || val === "") return undefined;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? undefined : Math.round(num);
  }),
  currency: z.string().default("USD").transform(val => val.toUpperCase()),
  purchase_date: z.string().optional(),
  stripe_session_id: z.string().max(200).optional(),
  source: z.string().default("webhook"),
});

// Rate limiting using IP-based tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
};

// Constant-time string comparison to prevent timing attacks
const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  // Avoid logging sensitive data
  const safeDetails = details ? {
    ...details,
    email: details.email ? `${String(details.email).substring(0, 3)}***` : undefined,
  } : undefined;
  console.log(`[CREATE-ENROLLMENT] ${step}`, safeDetails ? JSON.stringify(safeDetails) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get client IP for rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                   req.headers.get("x-real-ip") ||
                   req.headers.get("cf-connecting-ip") ||
                   "unknown";

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    logStep("Rate limit exceeded", { ip: clientIp });
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    });
  }

  try {
    logStep("Request received", { ip: clientIp, method: req.method });

    // 1. Validate webhook secret (constant-time comparison)
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("SKOOL_WEBHOOK_SECRET");
    
    if (!expectedSecret) {
      logStep("CRITICAL: SKOOL_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!webhookSecret || !secureCompare(webhookSecret, expectedSecret)) {
      logStep("Invalid webhook secret", { ip: clientIp });
      // Delay response to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Webhook secret validated");

    // 2. Parse and validate request body with Zod
    let rawBody: unknown;
    try {
      rawBody = await req.json();
      logStep("Body parsed", { keys: Object.keys(rawBody as object) });
    } catch (e) {
      logStep("JSON parse error", { error: String(e) });
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parseResult = enrollmentSchema.safeParse(rawBody);
    if (!parseResult.success) {
      logStep("Validation failed", { errors: parseResult.error.flatten() });
      return new Response(JSON.stringify({ 
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { 
      email, 
      full_name, 
      course_type, 
      tier, 
      amount_paid, 
      amount_cents,
      currency, 
      purchase_date, 
      stripe_session_id, 
      source 
    } = parseResult.data;
    
    // Use amount_paid or amount_cents (for backward compatibility)
    const finalAmount = amount_paid || amount_cents;
    
    logStep("Validated enrollment request", { email, course_type, tier, source });

    // 3. Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 4. Check if user exists in profiles by email
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      logStep("Database error checking profile", { error: profileError.message });
      throw new Error("Database error");
    }

    logStep("Profile check complete", { exists: !!existingProfile });

    // 5. Get the first course and community for default enrollment
    const { data: defaultCourse } = await supabase
      .from("courses")
      .select("id, community_id")
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingProfile?.id) {
      // User exists - create enrollment directly
      const enrollmentData: Record<string, unknown> = {
        user_id: existingProfile.id,
        course_type: course_type,
        tier: tier,
        is_active: true,
        status: "active",
        enrolled_at: new Date().toISOString(),
      };

      // Add optional fields
      if (defaultCourse?.id) enrollmentData.course_id = defaultCourse.id;
      if (defaultCourse?.community_id) enrollmentData.community_id = defaultCourse.community_id;
      if (finalAmount !== undefined) enrollmentData.amount_paid = finalAmount;
      if (currency) enrollmentData.currency = currency;
      if (stripe_session_id) enrollmentData.stripe_session_id = stripe_session_id;

      logStep("Creating enrollment", { user_id: existingProfile.id, course_type });

      const { error: enrollmentError } = await supabase
        .from("course_enrollments")
        .upsert(enrollmentData, { 
          onConflict: "user_id,course_id",
          ignoreDuplicates: false 
        });

      if (enrollmentError) {
        logStep("Error creating enrollment", { error: enrollmentError.message, code: enrollmentError.code });
        throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
      }

      logStep("Enrollment created for existing user", { email });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Enrollment created",
        user_exists: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // User doesn't exist yet - store in pending_enrollments
      const pendingData: Record<string, unknown> = {
        email,
        course_type: course_type,
        status: "pending",
        activated: false,
      };

      // Add optional fields
      if (full_name) pendingData.full_name = full_name;
      if (tier) pendingData.tier = tier;
      if (finalAmount !== undefined) pendingData.amount_paid = finalAmount;
      if (currency) pendingData.currency = currency;
      if (purchase_date) pendingData.purchase_date = purchase_date;
      if (stripe_session_id) pendingData.stripe_session_id = stripe_session_id;
      if (source) pendingData.source = source;

      logStep("Creating pending enrollment", { email, course_type });

      const { error: pendingError } = await supabase
        .from("pending_enrollments")
        .upsert(pendingData, { 
          onConflict: "email,course_type",
          ignoreDuplicates: false 
        });

      if (pendingError) {
        logStep("Error creating pending enrollment", { error: pendingError.message, code: pendingError.code });
        throw new Error(`Failed to create pending enrollment: ${pendingError.message}`);
      }

      logStep("Pending enrollment created", { email });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Pending enrollment created",
        user_exists: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-ENROLLMENT] Internal error:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
