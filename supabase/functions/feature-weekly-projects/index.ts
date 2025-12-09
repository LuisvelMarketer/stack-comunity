import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
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
        console.log("[FEATURE-WEEKLY-PROJECTS] Unauthorized access attempt");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting weekly featured projects selection...");

    // First, unfeature all currently featured projects
    const { error: unfeaturedError } = await supabase
      .from("build_projects")
      .update({ is_featured: false, featured_at: null })
      .eq("is_featured", true);

    if (unfeaturedError) {
      console.error("Error unfeaturing projects:", unfeaturedError);
      throw unfeaturedError;
    }

    // Get date from 7 days ago for activity calculation
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get projects with their recent activity count
    const { data: projects, error: projectsError } = await supabase
      .from("build_projects")
      .select(`
        id,
        likes_count,
        views_count,
        visibility,
        status,
        project_updates!inner(id, created_at)
      `)
      .eq("visibility", "public")
      .gte("project_updates.created_at", weekAgo.toISOString());

    if (projectsError) {
      console.error("Error fetching projects with updates:", projectsError);
    }

    // Also get projects without recent updates but with high engagement
    const { data: engagedProjects, error: engagedError } = await supabase
      .from("build_projects")
      .select("id, likes_count, views_count")
      .eq("visibility", "public")
      .order("likes_count", { ascending: false })
      .limit(20);

    if (engagedError) {
      console.error("Error fetching engaged projects:", engagedError);
    }

    // Calculate scores for all projects
    const projectScores = new Map<string, number>();

    // Score projects with recent activity
    if (projects) {
      for (const project of projects) {
        const updateCount = Array.isArray(project.project_updates) 
          ? project.project_updates.length 
          : 1;
        const likesScore = (project.likes_count || 0) * 3;
        const viewsScore = (project.views_count || 0) * 0.5;
        const activityScore = updateCount * 10;
        
        const totalScore = likesScore + viewsScore + activityScore;
        projectScores.set(project.id, totalScore);
      }
    }

    // Add engaged projects that might not have recent updates
    if (engagedProjects) {
      for (const project of engagedProjects) {
        if (!projectScores.has(project.id)) {
          const likesScore = (project.likes_count || 0) * 3;
          const viewsScore = (project.views_count || 0) * 0.5;
          projectScores.set(project.id, likesScore + viewsScore);
        }
      }
    }

    // Sort by score and get top 5
    const sortedProjects = Array.from(projectScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`Selected ${sortedProjects.length} projects to feature`);

    // Feature the top projects
    const featuredIds = sortedProjects.map(([id]) => id);
    
    if (featuredIds.length > 0) {
      const { error: featureError } = await supabase
        .from("build_projects")
        .update({ is_featured: true, featured_at: new Date().toISOString() })
        .in("id", featuredIds);

      if (featureError) {
        console.error("Error featuring projects:", featureError);
        throw featureError;
      }

      // Create notifications for featured project owners
      const { data: featuredProjects } = await supabase
        .from("build_projects")
        .select("id, user_id, title")
        .in("id", featuredIds);

      if (featuredProjects) {
        const notifications = featuredProjects.map(project => ({
          user_id: project.user_id,
          type: "achievement",
          title: "¡Tu proyecto fue destacado!",
          content: `Tu proyecto "${project.title}" ha sido seleccionado como proyecto destacado de la semana.`,
          link: `/project/${project.id}`
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        featured_count: featuredIds.length,
        featured_ids: featuredIds
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in feature-weekly-projects:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
