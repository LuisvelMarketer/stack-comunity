import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get course and module context if available
    let courseContext = "";
    let moduleContext = "";

    if (course_id) {
      const { data: course } = await supabaseClient
        .from('courses')
        .select('title, description')
        .eq('id', course_id)
        .single();
      
      if (course) {
        courseContext = `Curso actual: "${course.title}" - ${course.description || 'Sin descripción'}`;
      }
    }

    if (module_id) {
      const { data: module } = await supabaseClient
        .from('course_modules')
        .select('title, content, description')
        .eq('id', module_id)
        .single();
      
      if (module) {
        moduleContext = `Módulo actual: "${module.title}" - ${module.description || ''}\nContenido del módulo: ${module.content?.substring(0, 2000) || 'Sin contenido'}`;
      }
    }

    // Get user's progress
    let progressContext = "";
    if (effectiveUserId && course_id) {
      const { data: progress } = await supabaseClient
        .from('user_progress')
        .select('completed, course_modules(title)')
        .eq('user_id', effectiveUserId)
        .eq('course_modules.course_id', course_id);

      if (progress && progress.length > 0) {
        const completedModules = progress.filter(p => p.completed).length;
        progressContext = `El estudiante ha completado ${completedModules} de ${progress.length} módulos en este curso.`;
      }
    }

    const systemPrompt = `Eres un mentor de IA amigable y experto para la plataforma de aprendizaje "Código Cero". Tu rol es ayudar a los estudiantes con sus preguntas sobre programación y los cursos.

CONTEXTO DEL ESTUDIANTE:
${courseContext}
${moduleContext}
${progressContext}

INSTRUCCIONES:
1. Responde de manera clara, concisa y amigable en español
2. Si la pregunta es sobre el contenido del módulo actual, usa ese contexto para dar una respuesta más precisa
3. Proporciona ejemplos de código cuando sea útil (usa bloques de código markdown)
4. Si no estás seguro de algo, dilo honestamente
5. Anima al estudiante y sé motivador
6. Mantén las respuestas cortas pero informativas (máximo 3-4 párrafos)
7. Si el estudiante parece frustrado, sé empático y ofrece alternativas

Eres experto en:
- JavaScript, TypeScript, React
- HTML, CSS, Tailwind
- Node.js, APIs REST
- Bases de datos SQL y NoSQL
- Git y control de versiones
- Buenas prácticas de programación`;

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
