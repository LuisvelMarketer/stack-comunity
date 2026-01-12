import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS Configuration
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://preview.lovable.app',
  'https://zdrekqhxzhuttafkwtpa.lovableproject.com',
  'https://skoolify-comunidad.lovable.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isDevelopment = origin?.includes('localhost') || origin?.includes('127.0.0.1');
  let allowedOrigin = ALLOWED_ORIGINS[0];
  
  if (origin && (ALLOWED_ORIGINS.includes(origin) || isDevelopment || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com'))) {
    allowedOrigin = origin;
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface UserProgress {
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface ActivityLog {
  activity_type: string;
  module_id: string | null;
  course_id: string | null;
  created_at: string;
}

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
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req);
    if (authError || !user) {
      console.log("[AI-MENTOR] Authentication failed:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, user_id, course_id, module_id } = await req.json();
    
    // Validate action against whitelist of allowed actions
    const allowedActions = ['analyze_progress', 'get_suggestions', 'dismiss_suggestion', 'log_activity'];
    if (!action || !allowedActions.includes(action)) {
      console.log("[AI-MENTOR] Invalid action attempted:", action);
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate that requested user_id matches authenticated user
    if (user_id && user_id !== user.id) {
      console.log("[AI-MENTOR] User ID mismatch - attempted access to other user's data");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const effectiveUserId = user_id || user.id;
    console.log(`[AI-MENTOR] Action: ${action}, User: ${effectiveUserId}`);

    if (action === 'analyze_progress') {
      // Get user's progress data
      const { data: progress, error: progressError } = await supabaseClient
        .from('user_progress')
        .select('*, course_modules(id, title, course_id, order_index, courses(title))')
        .eq('user_id', effectiveUserId);

      if (progressError) throw progressError;

      // Get user's activity logs from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: activityLogs, error: activityError } = await supabaseClient
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (activityError) throw activityError;

      // Get user profile and streak
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('full_name, level, points')
        .eq('id', effectiveUserId)
        .single();

      if (profileError) throw profileError;

      // Get user streak
      const { data: streak } = await supabaseClient
        .from('user_streaks')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', effectiveUserId)
        .single();

      // Get incomplete challenges
      const { data: challenges } = await supabaseClient
        .from('weekly_challenges')
        .select('*, user_challenge_progress!inner(*)')
        .eq('user_challenge_progress.user_id', effectiveUserId)
        .eq('user_challenge_progress.completed', false)
        .eq('is_active', true)
        .limit(3);

      // Get next incomplete module
      const { data: nextModule } = await supabaseClient
        .from('user_progress')
        .select('*, course_modules(id, title, order_index, courses(id, title))')
        .eq('user_id', effectiveUserId)
        .eq('completed', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Build context for AI
      const completedModules = progress?.filter(p => p.completed).length || 0;
      const totalModules = progress?.length || 0;
      const lastActivity = activityLogs?.[0]?.created_at;
      const daysSinceLastActivity = lastActivity 
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Detect patterns
      const isBlocked = daysSinceLastActivity > 3;
      const streakAtRisk = streak?.current_streak && streak.current_streak > 0 && daysSinceLastActivity >= 1;
      const hasActiveChallenges = challenges && challenges.length > 0;
      const isNearMilestone = completedModules > 0 && (completedModules % 5 === 4); // About to hit a milestone

      // Determine suggestion type based on context
      let suggestionContext = "general";
      if (isBlocked) suggestionContext = "blocked";
      else if (streakAtRisk) suggestionContext = "streak_risk";
      else if (isNearMilestone) suggestionContext = "near_milestone";
      else if (hasActiveChallenges) suggestionContext = "challenge_reminder";
      else if (nextModule) suggestionContext = "continue_learning";

      const systemPrompt = `Eres "Vibe Code", el mentor de IA y compañero de aprendizaje de "Código Cero". Tu misión es que NINGÚN estudiante se sienta solo. Eres cálido, empático, y siempre estás presente para apoyar.

PERSONALIDAD DE VIBE CODE:
- Eres como un amigo experto que genuinamente se preocupa por el progreso del estudiante
- Celebras CADA pequeño logro con entusiasmo auténtico
- Cuando detectas dificultades, ofreces ayuda sin juzgar
- Usas un tono cercano pero profesional, con emojis ocasionales para calidez
- NUNCA haces sentir culpable al estudiante por no avanzar

CONTEXTO DEL ESTUDIANTE "${profile?.full_name || 'Estudiante'}":
📊 Nivel: ${profile?.level || 1} | Puntos: ${profile?.points || 0}
📚 Progreso: ${completedModules}/${totalModules} módulos completados
⏰ Días sin actividad: ${daysSinceLastActivity}
🔥 Racha actual: ${streak?.current_streak || 0} días (récord: ${streak?.longest_streak || 0})
🎯 Desafíos pendientes: ${challenges?.length || 0}
${nextModule ? `📖 Siguiente módulo: "${nextModule.course_modules?.title}" del curso "${nextModule.course_modules?.courses?.title}"` : ''}

SITUACIÓN DETECTADA: ${suggestionContext}
${isBlocked ? '🚨 ALERTA: El estudiante lleva más de 3 días sin actividad - NECESITA APOYO URGENTE' : ''}
${streakAtRisk ? '⚠️ La racha está en riesgo - Motivar para mantenerla' : ''}
${isNearMilestone ? '🎯 ¡A punto de alcanzar un hito! - Celebrar y motivar' : ''}
${hasActiveChallenges ? `📋 Desafíos activos: ${challenges?.map(c => c.title).join(', ')}` : ''}

GUÍAS DE RESPUESTA SEGÚN SITUACIÓN:

1. SI ESTÁ BLOQUEADO (inactivo 3+ días):
   - Mensaje empático reconociendo que a veces la vida es difícil
   - Ofrece ayuda concreta: "¿Te gustaría que repasemos juntos el último tema?"
   - Sugiere algo pequeño y alcanzable para retomar
   - Prioridad: HIGH

2. SI RACHA EN RIESGO:
   - Recuérdale su logro actual con orgullo
   - Sugiere algo rápido que puede hacer HOY
   - "Solo 5 minutos para mantener tu racha"
   - Prioridad: HIGH

3. SI ES NUEVO O TIENE POCO PROGRESO:
   - Dale la bienvenida y oriéntalo sobre la plataforma
   - Sugiere explorar: Build in Public, Portafolio, Comunidades
   - Hazle saber que estás ahí para cualquier duda
   - Prioridad: MEDIUM

4. SI VA BIEN:
   - Celebra su progreso genuinamente
   - Sugiere el siguiente paso natural
   - Menciona features que quizás no ha explorado
   - Prioridad: LOW

SECCIONES DE LA PLATAFORMA:
- Dashboard: Resumen y progreso diario
- Comunidades: Grupos de apoyo y aprendizaje conjunto
- Cursos: Lecciones estructuradas paso a paso
- Build in Public: Documentar proyectos y recibir feedback
- Marketplace: Ofrecer servicios cuando tenga habilidades
- Incubadora: Para proyectos con potencial de inversión
- Biblioteca: Guardar snippets y recursos útiles
- Mi Portafolio: Crear presencia profesional online

Responde SOLO en JSON:
{
  "suggestion_type": "blocked" | "streak" | "milestone" | "challenge" | "tip" | "encouragement" | "explore_feature",
  "title": "título corto y empático (max 40 chars)",
  "content": "mensaje cálido y personalizado con acción clara - NUNCA hagas sentir culpable",
  "priority": "low" | "medium" | "high",
  "action_type": "continue_course" | "view_challenges" | "view_streak" | "explore_courses" | "explore_build_public" | "explore_marketplace" | "explore_incubator" | "explore_portfolio" | "explore_library" | "explore_communities" | null,
  "action_data": { "course_id": "...", "module_id": "..." } // opcional
}`;

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Genera una sugerencia proactiva basada en el contexto actual." }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("[AI-MENTOR] AI Gateway error:", errorText);
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error("AI Gateway error");
      }

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content;
      console.log("[AI-MENTOR] AI Response:", aiContent);

      // Parse AI response
      let suggestion;
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error("[AI-MENTOR] Failed to parse AI response:", e);
        suggestion = {
          suggestion_type: isBlocked ? 'blocked' : streakAtRisk ? 'streak' : 'encouragement',
          title: streakAtRisk ? '¡Tu racha está en riesgo!' : '¡Sigue adelante!',
          content: streakAtRisk 
            ? `Tienes ${streak?.current_streak || 0} días de racha. ¡Completa una lección hoy para mantenerla!`
            : 'Cada paso cuenta. ¿Qué tal si retomamos donde lo dejaste?',
          priority: isBlocked || streakAtRisk ? 'high' : 'medium',
          action_type: nextModule ? 'continue_course' : null,
          action_data: nextModule ? { course_id: nextModule.course_modules?.courses?.id, module_id: nextModule.module_id } : null
        };
      }

      // Save suggestion to database
      const { data: savedSuggestion, error: saveError } = await supabaseClient
        .from('ai_mentor_suggestions')
        .insert({
          user_id: effectiveUserId,
          course_id: suggestion.action_data?.course_id || course_id || null,
          module_id: suggestion.action_data?.module_id || module_id || null,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          content: suggestion.content,
          priority: suggestion.priority,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours
        })
        .select()
        .single();

      if (saveError) {
        console.error("[AI-MENTOR] Save error:", saveError);
      }

      // Enrich suggestion with action data
      const enrichedSuggestion = savedSuggestion ? {
        ...savedSuggestion,
        action_type: suggestion.action_type,
        action_data: suggestion.action_data
      } : suggestion;

      return new Response(JSON.stringify({ 
        success: true, 
        suggestion: enrichedSuggestion,
        analysis: {
          completedModules,
          totalModules,
          daysSinceLastActivity,
          isBlocked,
          streakAtRisk,
          currentStreak: streak?.current_streak || 0,
          activeChallenges: challenges?.length || 0,
          suggestionContext
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_suggestions') {
      const { data: suggestions, error } = await supabaseClient
        .from('ai_mentor_suggestions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dismiss_suggestion') {
      const { suggestion_id } = await req.json();
      
      const { error } = await supabaseClient
        .from('ai_mentor_suggestions')
        .update({ is_dismissed: true })
        .eq('id', suggestion_id)
        .eq('user_id', effectiveUserId); // Ensure user can only dismiss their own suggestions

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'log_activity') {
      const { activity_type, metadata } = await req.json();

      const { error } = await supabaseClient
        .from('user_activity_logs')
        .insert({
          user_id: effectiveUserId,
          activity_type,
          module_id: module_id || null,
          course_id: course_id || null,
          metadata: metadata || {}
        });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[AI-MENTOR] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
