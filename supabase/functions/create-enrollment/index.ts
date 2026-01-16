import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentRequest {
  course_id: string;
  community_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-ENROLLMENT] Request received");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[CREATE-ENROLLMENT] No authorization header");
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.log("[CREATE-ENROLLMENT] Invalid token:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido o expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log("[CREATE-ENROLLMENT] User authenticated:", userId);

    // Parse request body
    const { course_id, community_id }: EnrollmentRequest = await req.json();

    if (!course_id || !community_id) {
      return new Response(
        JSON.stringify({ error: "course_id y community_id son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CREATE-ENROLLMENT] Enrolling user in course:", course_id, "community:", community_id);

    // Create admin client for operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify community exists
    const { data: community, error: communityError } = await supabaseAdmin
      .from("communities")
      .select("id, name, is_paid, stripe_price_id")
      .eq("id", community_id)
      .single();

    if (communityError || !community) {
      console.log("[CREATE-ENROLLMENT] Community not found:", communityError);
      return new Response(
        JSON.stringify({ error: "Comunidad no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify course exists and belongs to community
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id, title, community_id, is_published")
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      console.log("[CREATE-ENROLLMENT] Course not found:", courseError);
      return new Response(
        JSON.stringify({ error: "Curso no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (course.community_id !== community_id) {
      return new Response(
        JSON.stringify({ error: "El curso no pertenece a esta comunidad" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is member of community
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("community_members")
      .select("id")
      .eq("community_id", community_id)
      .eq("user_id", userId)
      .maybeSingle();

    // If paid community, check subscription
    if (community.is_paid && community.stripe_price_id) {
      const { data: subscription, error: subError } = await supabaseAdmin
        .from("community_subscriptions")
        .select("status")
        .eq("community_id", community_id)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (!subscription) {
        console.log("[CREATE-ENROLLMENT] User not subscribed to paid community");
        return new Response(
          JSON.stringify({ 
            error: "Necesitas una suscripción activa para inscribirte en este curso",
            requires_subscription: true 
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Add user to community if not already a member
    if (!membership) {
      const { error: joinError } = await supabaseAdmin
        .from("community_members")
        .insert({
          community_id: community_id,
          user_id: userId,
          role: "member"
        });

      if (joinError) {
        console.log("[CREATE-ENROLLMENT] Error joining community:", joinError);
        // Continue anyway, might already be a member due to race condition
      } else {
        console.log("[CREATE-ENROLLMENT] User joined community");
      }
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("course_enrollments")
      .upsert({
        user_id: userId,
        course_id: course_id,
        community_id: community_id,
        status: "active",
        enrolled_at: new Date().toISOString()
      }, {
        onConflict: "user_id,course_id"
      })
      .select()
      .single();

    if (enrollError) {
      console.log("[CREATE-ENROLLMENT] Error creating enrollment:", enrollError);
      return new Response(
        JSON.stringify({ error: "Error al crear la inscripción" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CREATE-ENROLLMENT] Enrollment created successfully:", enrollment.id);

    return new Response(
      JSON.stringify({
        success: true,
        enrollment: enrollment,
        message: `Te has inscrito exitosamente en ${course.title}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[CREATE-ENROLLMENT] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});