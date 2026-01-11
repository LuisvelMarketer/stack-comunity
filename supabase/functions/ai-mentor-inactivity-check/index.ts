import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret to prevent unauthorized calls
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow calls with service role key OR cron secret
    if (cronSecret && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== cronSecret && token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        console.log("[AI-MENTOR-INACTIVITY] Unauthorized access attempt");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("[AI-MENTOR-INACTIVITY] Starting inactivity check...");

    // Find users who have been inactive for more than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get all users with their last activity
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, full_name');

    if (profilesError) {
      console.error("[AI-MENTOR-INACTIVITY] Profiles error:", profilesError);
      throw profilesError;
    }

    console.log(`[AI-MENTOR-INACTIVITY] Found ${profiles?.length || 0} profiles to check`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let notificationsSent = 0;

    for (const profile of profiles || []) {
      // Get user's last activity
      const { data: lastActivity, error: activityError } = await supabaseClient
        .from('user_activity_logs')
        .select('created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activityError) {
        console.error(`[AI-MENTOR-INACTIVITY] Activity error for user ${profile.id}:`, activityError);
        continue;
      }

      // Check if user has any activity at all, or if their last activity was more than 3 days ago
      const lastActivityDate = lastActivity?.created_at ? new Date(lastActivity.created_at) : null;
      const isInactive = !lastActivityDate || lastActivityDate < threeDaysAgo;

      if (!isInactive) {
        continue;
      }

      // Check if we already sent a notification in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: recentNotification, error: notifCheckError } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', 'ai_mentor_inactivity')
        .gte('created_at', oneDayAgo.toISOString())
        .limit(1)
        .maybeSingle();

      if (notifCheckError) {
        console.error(`[AI-MENTOR-INACTIVITY] Notification check error for user ${profile.id}:`, notifCheckError);
        continue;
      }

      if (recentNotification) {
        console.log(`[AI-MENTOR-INACTIVITY] Already sent notification to user ${profile.id} recently`);
        continue;
      }

      // Get user's progress for context
      const { data: progress, error: progressError } = await supabaseClient
        .from('user_progress')
        .select('*, course_modules(title, courses(title))')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .limit(1)
        .maybeSingle();

      const daysSinceActivity = lastActivityDate 
        ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Generate personalized message with AI
      const systemPrompt = `Eres "Cero", el mentor de IA de "Código Cero". Un estudiante llamado "${profile.full_name || 'Estudiante'}" ha estado inactivo por ${daysSinceActivity} días.
${progress ? `Su último módulo fue: "${progress.course_modules?.title}" del curso "${progress.course_modules?.courses?.title}"` : 'No tiene cursos en progreso.'}

Tu misión es traerlo de vuelta con un mensaje CÁLIDO y EMPÁTICO. 

REGLAS IMPORTANTES:
1. NUNCA hagas sentir culpable al estudiante
2. Reconoce que la vida a veces es complicada
3. Ofrece algo específico y fácil de hacer para retomar
4. Hazle saber que estás ahí para ayudar
5. Usa un tono de amigo que se preocupa genuinamente
6. Máximo 2-3 oraciones, pero con calidez

EJEMPLOS DE BUENOS MENSAJES:
- "¡Hey! Sé que la vida puede ser intensa. Solo quería recordarte que estoy aquí cuando quieras continuar 😊"
- "Te extrañamos por aquí. ¿Qué tal si hoy solo revisamos 5 minutos juntos? Sin presión."
- "Vi que dejaste un módulo a medias. ¿Necesitas ayuda con algo? Estoy aquí para ti."

Responde SOLO en formato JSON:
{
  "title": "título de la notificación (máx 50 caracteres, cálido y no culpabilizante)",
  "content": "contenido del mensaje empático"
}`;

      try {
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
              { role: "user", content: "Genera la notificación." }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`[AI-MENTOR-INACTIVITY] AI error for user ${profile.id}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content;

        let notification = {
          title: "¡Te extrañamos!",
          content: `Han pasado ${daysSinceActivity} días desde tu última visita. ¿Qué tal si retomamos tu aprendizaje?`
        };

        try {
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            notification = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.log(`[AI-MENTOR-INACTIVITY] Using fallback message for user ${profile.id}`);
        }

        // Create notification in database
        const { error: insertError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: profile.id,
            type: 'ai_mentor_inactivity',
            title: notification.title,
            content: notification.content,
            link: '/dashboard',
            read: false
          });

        if (insertError) {
          console.error(`[AI-MENTOR-INACTIVITY] Insert error for user ${profile.id}:`, insertError);
          continue;
        }

        // Also create an AI mentor suggestion
        await supabaseClient
          .from('ai_mentor_suggestions')
          .insert({
            user_id: profile.id,
            suggestion_type: 'blocked',
            title: notification.title,
            content: notification.content,
            priority: 'high',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });

        notificationsSent++;
        console.log(`[AI-MENTOR-INACTIVITY] Sent notification to user ${profile.id}`);

      } catch (aiError) {
        console.error(`[AI-MENTOR-INACTIVITY] AI processing error for user ${profile.id}:`, aiError);
      }
    }

    console.log(`[AI-MENTOR-INACTIVITY] Completed. Sent ${notificationsSent} notifications.`);

    return new Response(JSON.stringify({ 
      success: true,
      notificationsSent,
      usersChecked: profiles?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[AI-MENTOR-INACTIVITY] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
