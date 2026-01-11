// Shared CORS configuration for Edge Functions

const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://preview.lovable.app',
  'https://zdrekqhxzhuttafkwtpa.lovableproject.com',
];

// Add environment-specific origins
const CUSTOM_ORIGIN = Deno.env.get('ALLOWED_ORIGIN');
if (CUSTOM_ORIGIN) {
  ALLOWED_ORIGINS.push(CUSTOM_ORIGIN);
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  // In development, allow localhost
  const isDevelopment = origin?.includes('localhost') || origin?.includes('127.0.0.1');
  
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Default fallback
  
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin) || isDevelopment) {
      allowedOrigin = origin;
    }
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCorsPreFlight(req: Request): Response | null {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  
  return null;
}

// Helper to create response with CORS headers
export function corsResponse(
  body: unknown,
  status: number,
  origin: string | null
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    }
  );
}
