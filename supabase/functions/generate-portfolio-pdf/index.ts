import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug } = await req.json();

    if (!slug) {
      throw new Error("Slug is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch portfolio settings
    const { data: settings, error: settingsError } = await supabase
      .from("portfolio_settings")
      .select("*")
      .eq("slug", slug)
      .single();

    if (settingsError) throw new Error("Portfolio not found");

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, bio, location, level, points")
      .eq("id", settings.user_id)
      .single();

    // Fetch projects
    const { data: projects } = await supabase
      .from("build_projects")
      .select("title, description, tech_stack, live_url, repository_url")
      .eq("user_id", settings.user_id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch certificates
    const { data: certificates } = await supabase
      .from("certificates")
      .select(`
        certificate_number,
        issued_at,
        courses (title)
      `)
      .eq("user_id", settings.user_id)
      .order("issued_at", { ascending: false });

    // Fetch achievements
    const { data: achievements } = await supabase
      .from("user_achievements")
      .select(`
        unlocked_at,
        achievements (name, description, points)
      `)
      .eq("user_id", settings.user_id)
      .order("unlocked_at", { ascending: false })
      .limit(20);

    // Generate HTML
    const html = generatePDFHTML({
      settings,
      profile,
      projects: projects || [],
      certificates: certificates || [],
      achievements: achievements || [],
    });

    console.log("Portfolio PDF HTML generated for:", slug);

    return new Response(
      JSON.stringify({ html }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating portfolio PDF:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generatePDFHTML(data: any): string {
  const { settings, profile, projects, certificates, achievements } = data;

  const projectsHTML = projects.map((p: any) => `
    <div class="project">
      <h3>${p.title}</h3>
      ${p.description ? `<p>${p.description}</p>` : ""}
      ${p.tech_stack?.length ? `<p class="tech"><strong>Tecnologías:</strong> ${p.tech_stack.join(", ")}</p>` : ""}
      ${p.live_url ? `<p><a href="${p.live_url}">${p.live_url}</a></p>` : ""}
    </div>
  `).join("");

  const certificatesHTML = certificates.map((c: any) => `
    <div class="certificate">
      <h4>${c.courses?.title || "Curso"}</h4>
      <p class="meta">${c.certificate_number} • ${new Date(c.issued_at).toLocaleDateString("es-ES")}</p>
    </div>
  `).join("");

  const achievementsHTML = achievements.map((a: any) => `
    <span class="badge">${a.achievements?.name} (+${a.achievements?.points} pts)</span>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio - ${profile?.full_name || "Usuario"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    header { 
      text-align: center; 
      margin-bottom: 40px; 
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    h1 { font-size: 2.5em; margin-bottom: 8px; color: #111; }
    .headline { font-size: 1.3em; color: #666; margin-bottom: 16px; }
    .meta { font-size: 0.9em; color: #888; }
    .summary { margin: 20px 0; color: #444; }
    .contact { margin-top: 16px; }
    .contact a { color: #0066cc; margin: 0 8px; text-decoration: none; }
    section { margin-bottom: 40px; }
    h2 { 
      font-size: 1.5em; 
      margin-bottom: 20px; 
      color: #111;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }
    .project { 
      margin-bottom: 24px; 
      padding: 16px; 
      background: #f9f9f9; 
      border-radius: 8px;
    }
    .project h3 { margin-bottom: 8px; color: #222; }
    .project p { margin-bottom: 4px; }
    .tech { font-size: 0.9em; color: #666; }
    .certificate { margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #0066cc; }
    .certificate h4 { margin-bottom: 4px; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { 
      display: inline-block; 
      padding: 6px 12px; 
      background: #e8f4fc; 
      color: #0066cc;
      border-radius: 20px; 
      font-size: 0.85em;
    }
    footer { 
      margin-top: 60px; 
      text-align: center; 
      color: #888; 
      font-size: 0.9em;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    @media print {
      body { padding: 20px; }
      .project { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${profile?.full_name || "Usuario"}</h1>
    ${settings?.headline ? `<p class="headline">${settings.headline}</p>` : ""}
    <p class="meta">
      ${profile?.location ? `📍 ${profile.location} • ` : ""}
      Nivel ${profile?.level || 1} • ${profile?.points || 0} puntos
    </p>
    ${settings?.summary ? `<p class="summary">${settings.summary}</p>` : ""}
    <div class="contact">
      ${settings?.contact_email ? `<a href="mailto:${settings.contact_email}">✉️ Email</a>` : ""}
      ${settings?.linkedin_url ? `<a href="${settings.linkedin_url}">LinkedIn</a>` : ""}
      ${settings?.github_url ? `<a href="${settings.github_url}">GitHub</a>` : ""}
      ${settings?.website_url ? `<a href="${settings.website_url}">Web</a>` : ""}
    </div>
  </header>

  ${projects.length > 0 ? `
  <section>
    <h2>🚀 Proyectos (${projects.length})</h2>
    ${projectsHTML}
  </section>
  ` : ""}

  ${certificates.length > 0 ? `
  <section>
    <h2>🏆 Certificados (${certificates.length})</h2>
    ${certificatesHTML}
  </section>
  ` : ""}

  ${achievements.length > 0 ? `
  <section>
    <h2>⭐ Logros (${achievements.length})</h2>
    <div class="badges">
      ${achievementsHTML}
    </div>
  </section>
  ` : ""}

  <footer>
     <p>Portfolio generado con STACK • ${new Date().toLocaleDateString("es-ES")}</p>
  </footer>
</body>
</html>
  `;
}
