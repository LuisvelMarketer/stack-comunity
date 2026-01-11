import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS Configuration
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://preview.lovable.app',
  'https://zdrekqhxzhuttafkwtpa.lovableproject.com',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isDevelopment = origin?.includes('localhost') || origin?.includes('127.0.0.1');
  let allowedOrigin = ALLOWED_ORIGINS[0];
  
  if (origin && (ALLOWED_ORIGINS.includes(origin) || isDevelopment)) {
    allowedOrigin = origin;
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// Rate limit configuration
const RATE_LIMIT = { requests: 30, windowMs: 60000 }; // 30 req/min

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

// Check rate limit
async function checkRateLimit(userId: string, supabaseAdmin: any): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT.windowMs);

  try {
    const { data: existing } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('function_name', 'ai-mentor-chat')
      .eq('user_id', userId)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (existing) {
      if (existing.request_count >= RATE_LIMIT.requests) {
        return { allowed: false, remaining: 0 };
      }

      await supabaseAdmin
        .from('rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);

      return { allowed: true, remaining: RATE_LIMIT.requests - existing.request_count - 1 };
    }

    await supabaseAdmin
      .from('rate_limits')
      .insert({
        user_id: userId,
        function_name: 'ai-mentor-chat',
        request_count: 1,
        window_start: now.toISOString(),
      });

    return { allowed: true, remaining: RATE_LIMIT.requests - 1 };
  } catch {
    return { allowed: true, remaining: RATE_LIMIT.requests };
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.log("[AI-MENTOR-CHAT] Authentication failed:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check rate limit
    const rateLimitResult = await checkRateLimit(user.id, supabaseAdmin);
    if (!rateLimitResult.allowed) {
      console.log("[AI-MENTOR-CHAT] Rate limit exceeded for user:", user.id);
      return new Response(JSON.stringify({ 
        error: "Límite de solicitudes excedido. Espera un momento antes de continuar.",
        retryAfter: 60 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        },
      });
    }

    const { messages, user_id, course_id, module_id } = await req.json();
    
    // Validate that requested user_id matches authenticated user
    if (user_id && user_id !== user.id) {
      console.log("[AI-MENTOR-CHAT] User ID mismatch");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const effectiveUserId = user_id || user.id;
    console.log(`[AI-MENTOR-CHAT] User: ${effectiveUserId}, Course: ${course_id}, Module: ${module_id}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseClient = supabaseAdmin;

    // Get comprehensive student context
    let studentContext = "";
    let courseContext = "";
    let moduleContext = "";
    let progressContext = "";
    let streakContext = "";
    let communityContext = "";

    // Get student profile and stats
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, level, points, badges')
      .eq('id', effectiveUserId)
      .single();

    if (profile) {
      studentContext = `
PERFIL DEL ESTUDIANTE:
- Nombre: ${profile.full_name || 'Estudiante'}
- Nivel: ${profile.level || 1}
- Puntos totales: ${profile.points || 0}
- Badges desbloqueados: ${Array.isArray(profile.badges) ? profile.badges.length : 0}`;
    }

    // Get student streak data
    const { data: streakData } = await supabaseClient
      .from('user_activity_logs')
      .select('created_at')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (streakData && streakData.length > 0) {
      const lastActivity = new Date(streakData[0].created_at);
      const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      streakContext = `
ACTIVIDAD RECIENTE:
- Última actividad: hace ${daysSinceActivity} días
- Actividades en los últimos 30 días: ${streakData.length}`;
    }

    // Get student communities
    const { data: memberships } = await supabaseClient
      .from('community_members')
      .select('communities(name)')
      .eq('user_id', effectiveUserId)
      .limit(5);

    if (memberships && memberships.length > 0) {
      const communityNames = memberships
        .map(m => (m.communities as any)?.name)
        .filter(Boolean)
        .join(', ');
      communityContext = `
COMUNIDADES: ${communityNames}`;
    }

    // Get course context if available
    if (course_id) {
      const { data: course } = await supabaseClient
        .from('courses')
        .select('title, description')
        .eq('id', course_id)
        .single();
      
      if (course) {
        courseContext = `
CURSO ACTUAL: "${course.title}"
Descripción: ${course.description || 'Sin descripción'}`;
      }

      // Get detailed progress for this course
      const { data: modules } = await supabaseClient
        .from('course_modules')
        .select('id, title, order_index')
        .eq('course_id', course_id)
        .order('order_index');

      const { data: userProgress } = await supabaseClient
        .from('user_progress')
        .select('module_id, completed')
        .eq('user_id', effectiveUserId);

      if (modules && modules.length > 0) {
        const completedIds = new Set(userProgress?.filter(p => p.completed).map(p => p.module_id) || []);
        const completedCount = modules.filter(m => completedIds.has(m.id)).length;
        const percentage = Math.round((completedCount / modules.length) * 100);
        
        // Find current and next module
        const nextModule = modules.find(m => !completedIds.has(m.id));
        
        progressContext = `
PROGRESO EN EL CURSO:
- Módulos completados: ${completedCount}/${modules.length} (${percentage}%)
- Siguiente módulo: ${nextModule?.title || 'Todos completados'}`;
      }
    }

    // Get module context if available
    if (module_id) {
      const { data: module } = await supabaseClient
        .from('course_modules')
        .select('title, content, description')
        .eq('id', module_id)
        .single();
      
      if (module) {
        moduleContext = `
MÓDULO ACTUAL: "${module.title}"
${module.description || ''}
Contenido resumido: ${module.content?.substring(0, 1500) || 'Sin contenido'}`;
      }
    }

    // Get recent questions to avoid repetition
    const { data: recentMessages } = await supabaseClient
      .from('ai_mentor_messages')
      .select('content, role')
      .eq('conversation_id', messages[0]?.conversation_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const systemPrompt = `Eres "Cero", el mentor de IA de la plataforma de aprendizaje "Código Cero". Eres amigable, empático, motivador y experto en programación.

PERSONALIDAD:
- Eres como un amigo programador que siempre está disponible para ayudar
- Celebras los logros del estudiante, por pequeños que sean
- Cuando el estudiante tiene dificultades, eres comprensivo y paciente
- Usas un tono casual pero profesional
- Ocasionalmente usas emojis para hacer la conversación más amigable
${studentContext}
${streakContext}
${communityContext}
${courseContext}
${progressContext}
${moduleContext}

INSTRUCCIONES:
1. Responde siempre en español, de manera clara y amigable
2. Si el estudiante pregunta sobre el módulo actual, usa el contexto para dar respuestas precisas
3. Proporciona ejemplos de código cuando sea útil (usa bloques de código markdown con el lenguaje)
4. Si ves que el estudiante no ha estado activo, anímalo a continuar
5. Si ha completado muchos módulos, felicítalo por su progreso
6. Si está atascado, ofrece diferentes enfoques para resolver el problema
7. Mantén respuestas concisas pero completas (2-4 párrafos)
8. Si no sabes algo con certeza, sé honesto

ÁREAS DE EXPERTISE:
- JavaScript/TypeScript y React
- HTML, CSS y Tailwind CSS
- Node.js, APIs REST y bases de datos
- Git y buenas prácticas
- Arquitectura de software y patrones de diseño
- Debugging y resolución de problemas`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere agregar créditos a tu espacio de trabajo." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("[AI-MENTOR-CHAT] AI Gateway error:", errorText);
      throw new Error("AI Gateway error");
    }

    // Log activity
    if (effectiveUserId) {
      await supabaseClient
        .from('user_activity_logs')
        .insert({
          user_id: effectiveUserId,
          activity_type: 'ai_chat_message',
          course_id: course_id || null,
          module_id: module_id || null,
          metadata: { message_count: messages.length }
        });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error("[AI-MENTOR-CHAT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
