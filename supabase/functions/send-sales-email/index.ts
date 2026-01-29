import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  lead_id: string;
  email_type: "thinking" | "not_responding" | "last_attempt" | "welcome";
  custom_message?: string;
}

// Email templates
const getEmailTemplate = (
  type: string,
  leadName: string,
  _customMessage?: string
) => {
  const templates: Record<string, { subject: string; html: string }> = {
    thinking: {
      subject: `${leadName}, ¿tienes 2 minutos?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hola ${leadName},</p>
          
          <p>Sé que mencionaste que necesitabas pensarlo. Totalmente entendible — es una decisión importante.</p>
          
          <p>Solo quería dejarte algo que escuché hace poco:</p>
          
          <blockquote style="border-left: 3px solid #6366f1; padding-left: 15px; margin: 20px 0; color: #4b5563; font-style: italic;">
            "Las personas que esperan el momento perfecto para empezar, nunca empiezan."
          </blockquote>
          
          <p>No te lo digo para presionarte.</p>
          
          <p>Te lo digo porque sé lo que pasa cuando dejamos las cosas "para después". Después se convierte en nunca.</p>
          
          <p>¿Qué te parece si hacemos esto?</p>
          
          <p>Cuéntame cuál es la principal duda que tienes. Sin compromiso. Solo quiero asegurarme de que tomes la mejor decisión para ti.</p>
          
          <p style="margin-top: 30px;">Un abrazo,<br>
          <strong>El equipo de Código Cero</strong></p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            P.D. Los cupos son limitados y se están llenando rápido. No me gustaría que te quedes fuera por no haber preguntado.
          </p>
        </div>
      `,
    },
    not_responding: {
      subject: `${leadName}, ¿está todo bien?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hola ${leadName},</p>
          
          <p>No he tenido noticias tuyas desde nuestra llamada.</p>
          
          <p>Quiero ser directo contigo:</p>
          
          <p>Si decidiste que Código Cero no es para ti, lo respeto completamente. Solo te pido que me lo hagas saber para no seguir ocupando tu tiempo.</p>
          
          <p>Pero si todavía estás evaluando, me gustaría compartirte esto:</p>
          
          <p>Esta semana <strong>3 personas más se unieron</strong> y ya están avanzando en construir sus primeras apps.</p>
          
          <p>No te cuento esto para presumir. Te lo cuento porque sé que tú también puedes estar ahí.</p>
          
          <p>La pregunta es: <strong>¿qué te está frenando?</strong></p>
          
          <p>Respóndeme con una palabra si quieres:</p>
          <ul>
            <li><strong>DENTRO</strong> → Si quieres asegurar tu lugar</li>
            <li><strong>DUDA</strong> → Si tienes una pregunta pendiente</li>
            <li><strong>NO</strong> → Si decidiste no entrar (sin resentimientos)</li>
          </ul>
          
          <p style="margin-top: 30px;">Esperando tu respuesta,<br>
          <strong>El equipo de Código Cero</strong></p>
        </div>
      `,
    },
    last_attempt: {
      subject: `Última oportunidad, ${leadName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hola ${leadName},</p>
          
          <p>Este es mi último mensaje.</p>
          
          <p>Entiendo que la vida pasa, las cosas se complican, y a veces simplemente no es el momento.</p>
          
          <p>Pero antes de dejarte ir, quiero que sepas algo:</p>
          
          <p>Hace 6 meses, una persona me escribió diciendo "no puedo ahora". Hace 2 semanas me escribió de nuevo, frustrada porque seguía en el mismo lugar.</p>
          
          <p>No quiero que eso te pase a ti.</p>
          
          <p>Si en algún momento decides que sí quieres dar el paso, aquí estaré.</p>
          
          <p>Pero los cupos de esta generación se cierran esta semana.</p>
          
          <p><strong>¿Última pregunta?</strong><br>
          ¿Hay algo — lo que sea — que pueda hacer para ayudarte a tomar esta decisión?</p>
          
          <p style="margin-top: 30px;">Con respeto,<br>
          <strong>El equipo de Código Cero</strong></p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            P.D. Si no escucho de ti, asumiré que no es el momento y eliminaré tu aplicación. Sin resentimientos.
          </p>
        </div>
      `,
    },
    welcome: {
      subject: `🚀 ¡Bienvenido a Código Cero, ${leadName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; font-size: 28px;">¡Felicidades! 🎉</h1>
          </div>
          
          <p>Hola ${leadName},</p>
          
          <p>Acabas de tomar la mejor decisión de tu vida.</p>
          
          <p>A partir de hoy, eres parte de una comunidad exclusiva de personas que decidieron dejar de esperar y empezar a crear.</p>
          
          <h2 style="color: #4b5563; font-size: 18px; margin-top: 30px;">📋 Próximos Pasos:</h2>
          
          <ol style="line-height: 1.8;">
            <li><strong>Revisa tu correo</strong> — En los próximos minutos recibirás acceso a la plataforma</li>
            <li><strong>Únete a la comunidad</strong> — Preséntate y conoce a tus compañeros</li>
            <li><strong>Primera sesión</strong> — Agenda tu onboarding personalizado</li>
            <li><strong>Empieza a aprender</strong> — El primer módulo te está esperando</li>
          </ol>
          
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 10px; margin: 30px 0; text-align: center;">
            <p style="margin: 0; font-size: 16px;">Tu acceso estará listo en menos de 24 horas.</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Mientras tanto, prepárate para transformar tu futuro.</p>
          </div>
          
          <p><strong>¿Tienes alguna pregunta?</strong><br>
          Responde a este correo directamente y te ayudaremos.</p>
          
          <p style="margin-top: 30px;">¡Nos vemos adentro!<br>
          <strong>El equipo de Código Cero</strong></p>
        </div>
      `,
    },
  };

  return templates[type] || templates.thinking;
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SALES-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing request");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Invalid token");
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized - admin role required");
    }

    const { lead_id, email_type, custom_message }: EmailRequest = await req.json();

    if (!lead_id || !email_type) {
      throw new Error("Missing required fields: lead_id and email_type");
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("sales_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error("Lead not found");
    }

    logStep("Sending email", { leadEmail: lead.email, type: email_type });

    const template = getEmailTemplate(email_type, lead.full_name, custom_message);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Código Cero <onboarding@resend.dev>",
      to: [lead.email],
      subject: template.subject,
      html: template.html,
    });

    const emailId = (emailResponse as any).id || "sent";
    logStep("Email sent", { resendId: emailId });

    // Log the email
    await supabaseAdmin.from("sales_email_logs").insert({
      lead_id: lead_id,
      email_type: email_type,
      subject: template.subject,
      sent_by: user.id,
    });

    // Update lead status and follow-up count
    const updates: Record<string, any> = {
      follow_up_count: (lead.follow_up_count || 0) + 1,
      last_follow_up_at: new Date().toISOString(),
    };

    // Update lead status based on email type
    if (email_type === "thinking") {
      updates.lead_status = "thinking";
    } else if (email_type === "not_responding") {
      updates.lead_status = "not_responding";
    } else if (email_type === "welcome") {
      updates.lead_status = "converted";
      updates.converted_at = new Date().toISOString();
    }

    await supabaseAdmin
      .from("sales_leads")
      .update(updates)
      .eq("id", lead_id);

    return new Response(
      JSON.stringify({ success: true, email_id: emailId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
