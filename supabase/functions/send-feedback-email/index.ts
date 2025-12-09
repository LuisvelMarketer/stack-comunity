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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log("Processing feedback email for project:", project_id);

    // Get project details and owner
    const { data: project, error: projectError } = await supabase
      .from("build_projects")
      .select("title, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      throw new Error("Project not found");
    }

    // Get project owner's email
    const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.admin.getUserById(
      project.user_id
    );

    if (ownerAuthError || !ownerAuth.user?.email) {
      console.error("Owner email not found:", ownerAuthError);
      throw new Error("Owner email not found");
    }

    // Don't send email if commenter is the project owner
    if (commenter_id === project.user_id) {
      console.log("Skipping email - commenter is project owner");
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
              <p style="margin: 0; white-space: pre-wrap;">${feedback_content}</p>
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending feedback email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
