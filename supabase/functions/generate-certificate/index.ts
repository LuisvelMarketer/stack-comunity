import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { courseId } = await req.json();

    if (!courseId) {
      throw new Error("Course ID is required");
    }

    console.log(`Generating certificate for user ${user.id}, course ${courseId}`);

    // Check if certificate already exists
    const { data: existingCert } = await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingCert) {
      console.log("Certificate already exists:", existingCert.certificate_number);
      return new Response(
        JSON.stringify({ 
          success: true, 
          certificate: existingCert,
          message: "Certificate already exists" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify course completion (all modules completed)
    const { data: modules } = await supabaseAdmin
      .from("course_modules")
      .select("id")
      .eq("course_id", courseId);

    if (!modules || modules.length === 0) {
      throw new Error("Course has no modules");
    }

    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("module_id, completed")
      .eq("user_id", user.id)
      .in("module_id", modules.map(m => m.id));

    const completedModules = progress?.filter(p => p.completed).length || 0;

    if (completedModules < modules.length) {
      throw new Error(`Course not completed. Completed ${completedModules}/${modules.length} modules.`);
    }

    // Get course and user info
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, points")
      .eq("id", user.id)
      .single();

    if (!course) {
      throw new Error("Course not found");
    }

    // Generate certificate number
    const { data: certNumber } = await supabaseAdmin.rpc("generate_certificate_number");

    // Create certificate record
    const { data: certificate, error: insertError } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_number: certNumber,
        issued_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting certificate:", insertError);
      throw new Error("Failed to create certificate");
    }

    console.log("Certificate created successfully:", certificate.certificate_number);

    // Add points to user for completing course
    const currentPoints = (profile as any)?.points || 0;
    await supabaseAdmin
      .from("profiles")
      .update({ 
        points: currentPoints + 100 
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        certificate: {
          ...certificate,
          course_title: course.title,
          user_name: profile?.full_name || "Estudiante",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating certificate:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
