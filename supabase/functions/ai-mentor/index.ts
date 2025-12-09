import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        .select('*, course_modules(id, title, course_id, order_index)')
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

      // Get user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('full_name, level, points')
        .eq('id', effectiveUserId)
        .single();

      if (profileError) throw profileError;

      // Build context for AI
      const completedModules = progress?.filter(p => p.completed).length || 0;
      const totalModules = progress?.length || 0;
      const lastActivity = activityLogs?.[0]?.created_at;
      const daysSinceLastActivity = lastActivity 
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Detect if user is blocked
      const isBlocked = daysSinceLastActivity > 3 || 
        (activityLogs?.filter(a => a.activity_type === 'quiz_attempt').length || 0) > 5;

      const systemPrompt = `Eres un mentor de IA amigable y motivador para una plataforma de aprendizaje de programación llamada "Código Cero". Tu objetivo es ayudar a los estudiantes a superar bloqueos y mantenerlos motivados.

Contexto del estudiante:
- Nombre: ${profile?.full_name || 'Estudiante'}
- Nivel: ${profile?.level || 1}
- Puntos: ${profile?.points || 0}
- Módulos completados: ${completedModules}/${totalModules}
- Días desde última actividad: ${daysSinceLastActivity}
- Parece bloqueado: ${isBlocked ? 'Sí' : 'No'}

Genera una sugerencia personalizada en español que sea:
1. Específica y accionable
2. Motivadora pero no condescendiente
3. Corta (máximo 2-3 oraciones)

Responde SOLO en formato JSON con esta estructura:
{
  "suggestion_type": "blocked" | "encouragement" | "tip" | "milestone",
  "title": "título corto",
  "content": "contenido de la sugerencia",
  "priority": "low" | "medium" | "high"
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
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Genera una sugerencia personalizada para este estudiante basándote en su progreso." }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("[AI-MENTOR] AI Gateway error:", errorText);
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
          suggestion_type: isBlocked ? 'blocked' : 'encouragement',
          title: '¡Sigue adelante!',
          content: 'Cada paso cuenta. ¿Qué tal si retomamos donde lo dejaste?',
          priority: isBlocked ? 'high' : 'medium'
        };
      }

      // Save suggestion to database
      const { data: savedSuggestion, error: saveError } = await supabaseClient
        .from('ai_mentor_suggestions')
        .insert({
          user_id: effectiveUserId,
          course_id: course_id || null,
          module_id: module_id || null,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          content: suggestion.content,
          priority: suggestion.priority,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .select()
        .single();

      if (saveError) {
        console.error("[AI-MENTOR] Save error:", saveError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        suggestion: savedSuggestion || suggestion,
        analysis: {
          completedModules,
          totalModules,
          daysSinceLastActivity,
          isBlocked
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
