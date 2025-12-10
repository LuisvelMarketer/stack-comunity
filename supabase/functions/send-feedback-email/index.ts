import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackEmailRequest {
  project_id: string;
  feedback_id: string;
  feedback_content: string;
  feedback_category: string;
  feedback_priority: string;
  commenter_id: string;
}

// Verify the request comes from an authorized source (service role or internal trigger)
const verifyAuthorization = (req: Request): boolean => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;
  
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  // Accept service role key (for admin calls) or anon key (for trigger calls)
  // The anon key is used by the database trigger - this is intentional
  return token === serviceRoleKey || token === anonKey;
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    if (!verifyAuthorization(req)) {
      console.error("[SEND-FEEDBACK-EMAIL] Unauthorized access attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      project_id,
      feedback_id,
      feedback_content,
      feedback_category,
      feedback_priority,
      commenter_id,
    }: FeedbackEmailRequest = await req.json();

    // Validate required fields
    if (!project_id || !feedback_id || !feedback_content || !commenter_id) {
      console.error("[SEND-FEEDBACK-EMAIL] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate UUID format for IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(project_id) || !uuidRegex.test(feedback_id) || !uuidRegex.test(commenter_id)) {
      console.error("[SEND-FEEDBACK-EMAIL] Invalid UUID format");
      return new Response(
        JSON.stringify({ error: "Invalid ID format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[SEND-FEEDBACK-EMAIL] Processing feedback email for project:", project_id);

    // Get project details and owner - also validates project exists
    const { data: project, error: projectError } = await supabase
      .from("build_projects")
      .select("title, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("[SEND-FEEDBACK-EMAIL] Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate commenter exists
    const { data: commenterExists, error: commenterError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", commenter_id)
      .single();

    if (commenterError || !commenterExists) {
      console.error("[SEND-FEEDBACK-EMAIL] Commenter not found:", commenterError);
      return new Response(
        JSON.stringify({ error: "Commenter not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get project owner's email
    const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.admin.getUserById(
      project.user_id
    );

    if (ownerAuthError || !ownerAuth.user?.email) {
      console.error("[SEND-FEEDBACK-EMAIL] Owner email not found:", ownerAuthError);
      return new Response(
        JSON.stringify({ error: "Owner email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Don't send email if commenter is the project owner
    if (commenter_id === project.user_id) {
      console.log("[SEND-FEEDBACK-EMAIL] Skipping email - commenter is project owner");
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get commenter's profile
    const { data: commenterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", commenter_id)
      .single();

    const commenterName = commenterProfile?.full_name || "Un usuario";
    const categoryLabels: Record<string, string> = {
      bug: "🐛 Bug",
      improvement: "💡 Mejora",
      design: "🎨 Diseño",
      general: "💬 General",
    };
    const priorityLabels: Record<string, string> = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      critical: "Crítica",
    };

    const categoryLabel = categoryLabels[feedback_category] || feedback_category;
    const priorityLabel = priorityLabels[feedback_priority] || feedback_priority;

    // Sanitize feedback content for HTML (basic XSS prevention)
    const sanitizedContent = feedback_content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Código Cero <onboarding@resend.dev>",
      to: [ownerAuth.user.email],
      subject: `Nuevo feedback en tu proyecto: ${project.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
            .feedback-box { background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0; }
            .meta { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .badge-category { background: #e0e7ff; color: #4338ca; }
            .badge-priority { background: #fef3c7; color: #92400e; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">🔔 Nuevo Feedback</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Alguien ha dejado feedback en tu proyecto</p>
          </div>
          <div class="content">
            <p><strong>${commenterName}</strong> ha dejado feedback en tu proyecto <strong>"${project.title}"</strong>:</p>
            
            <div class="feedback-box">
              <div class="meta">
                <span class="badge badge-category">${categoryLabel}</span>
                <span class="badge badge-priority">Prioridad: ${priorityLabel}</span>
              </div>
              <p style="margin: 0; white-space: pre-wrap;">${sanitizedContent}</p>
            </div>
            
            <p>Revisa el feedback y responde a tu compañero para seguir mejorando tu proyecto.</p>
            
            <center>
              <a href="${Deno.env.get("SITE_URL") || "https://zdrekqhxzhuttafkwtpa.lovableproject.com"}/project/${project_id}" class="button">
                Ver Proyecto
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Este email fue enviado desde la plataforma Código Cero</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[SEND-FEEDBACK-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[SEND-FEEDBACK-EMAIL] Error sending feedback email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
