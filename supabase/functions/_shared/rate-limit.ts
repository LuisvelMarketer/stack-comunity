// Rate limiting middleware for Edge Functions

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

// Rate limits per function
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'ai-mentor-chat': { requests: 30, windowMs: 60000 },    // 30 req/min
  'ai-mentor': { requests: 30, windowMs: 60000 },          // 30 req/min
  'create-checkout': { requests: 5, windowMs: 60000 },     // 5 req/min
  'create-community-checkout': { requests: 5, windowMs: 60000 },
  'customer-portal': { requests: 10, windowMs: 60000 },    // 10 req/min
  'generate-certificate': { requests: 10, windowMs: 60000 },
  'generate-portfolio-pdf': { requests: 5, windowMs: 60000 },
  'send-feedback-email': { requests: 10, windowMs: 60000 },
  'track-referral': { requests: 20, windowMs: 60000 },
  'default': { requests: 100, windowMs: 60000 },           // 100 req/min default
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export async function checkRateLimit(
  identifier: string, // user_id or IP address
  functionName: string,
  supabaseAdmin: SupabaseClient
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[functionName] || RATE_LIMITS.default;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Try to get existing rate limit entry
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('function_name', functionName)
      .or(`user_id.eq.${identifier},ip_address.eq.${identifier}`)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new requests
      console.error('Rate limit fetch error:', fetchError);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: config.requests,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    if (existing) {
      // Check if over limit
      if (existing.request_count >= config.requests) {
        const resetAt = new Date(new Date(existing.window_start).getTime() + config.windowMs);
        const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter,
        };
      }

      // Increment counter
      await supabaseAdmin
        .from('rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);

      return {
        allowed: true,
        remaining: config.requests - existing.request_count - 1,
        resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMs),
      };
    }

    // Create new entry
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    await supabaseAdmin
      .from('rate_limits')
      .insert({
        user_id: isUuid ? identifier : null,
        ip_address: !isUuid ? identifier : null,
        function_name: functionName,
        request_count: 1,
        window_start: now.toISOString(),
      });

    return {
      allowed: true,
      remaining: config.requests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

// Get client IP from request headers
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

// Create rate limit response
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Demasiadas solicitudes. Por favor, espera antes de intentar de nuevo.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
