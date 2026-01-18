import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Strict CORS - only allow known origins
const ALLOWED_ORIGINS = [
  "https://skoolify-comunidad.lovable.app",
  "https://lovable.app",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.includes(o)) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-request-timestamp, x-request-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'",
  };
};

// Input validation schema with strict sanitization
const enrollmentSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(255, "Email too long")
    .transform(val => val.toLowerCase().trim()),
  full_name: z.string()
    .max(100, "Name too long")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Invalid characters in name")
    .optional()
    .transform(val => val?.trim()),
  course_type: z.enum(["cero", "quantum"]).default("cero"),
  tier: z.enum(["standard", "premium", "vip"]).default("standard"),
  amount_paid: z.number().positive().max(100000).optional(),
  currency: z.enum(["USD", "EUR", "MXN"]).default("USD"),
  purchase_date: z.string().datetime().optional(),
  stripe_session_id: z.string()
    .max(100)
    .regex(/^cs_[a-zA-Z0-9]+$/, "Invalid Stripe session format")
    .optional(),
  source: z.enum(["webhook", "manual", "stripe"]).default("webhook"),
});

// Rate limiting using IP-based tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

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

// Validate request timestamp to prevent replay attacks
const validateTimestamp = (timestamp: string | null): boolean => {
  if (!timestamp) return false;
  
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return !isNaN(requestTime) && Math.abs(now - requestTime) < fiveMinutes;
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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validate request timestamp (prevent replay attacks)
    const requestTimestamp = req.headers.get("x-request-timestamp");
    if (!validateTimestamp(requestTimestamp)) {
      logStep("Invalid or expired timestamp", { ip: clientIp });
      return new Response(JSON.stringify({ error: "Request expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse and validate request body with Zod
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
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

    const { email, full_name, course_type, tier, amount_paid, currency, purchase_date, stripe_session_id, source } = parseResult.data;
    
    logStep("Validated enrollment request", { email, course_type, source });

    // 4. Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 5. Check if user exists in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      logStep("Database error checking profile", { error: profileError.message });
      throw new Error("Database error");
    }

    // 6. Get the default course and community IDs
    const { data: defaultCourse } = await supabase
      .from("courses")
      .select("id, community_id")
      .limit(1)
      .single();

    const courseId = defaultCourse?.id || "00000000-0000-0000-0000-000000000000";
    const communityId = defaultCourse?.community_id || "00000000-0000-0000-0000-000000000000";

    if (existingProfile?.id) {
      // User exists - create enrollment directly
      const { error: enrollmentError } = await supabase
        .from("course_enrollments")
        .upsert({
          user_id: existingProfile.id,
          course_id: courseId,
          community_id: communityId,
          course_type: course_type,
          tier: tier,
          is_active: true,
          amount_paid: amount_paid,
          currency: currency,
          stripe_session_id: stripe_session_id,
          enrolled_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_id" });

      if (enrollmentError) {
        logStep("Error creating enrollment", { error: enrollmentError.message });
        throw new Error("Failed to create enrollment");
      }

      logStep("Enrollment created for existing user", { email });
    } else {
      // User doesn't exist yet - store in pending_enrollments
      const { error: pendingError } = await supabase
        .from("pending_enrollments")
        .upsert({
          email,
          full_name,
          course_type: course_type,
          tier: tier,
          amount_paid: amount_paid,
          currency,
          purchase_date: purchase_date || new Date().toISOString(),
          stripe_session_id,
          source: source,
          status: "pending",
          activated: false,
        }, { onConflict: "email,course_type" });

      if (pendingError) {
        logStep("Error creating pending enrollment", { error: pendingError.message });
        throw new Error("Failed to create pending enrollment");
      }

      logStep("Pending enrollment created", { email });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error internally but return generic message
    console.error("[CREATE-ENROLLMENT] Internal error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
