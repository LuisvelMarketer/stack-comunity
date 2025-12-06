import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecurringEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  max_attendees: number | null;
  community_id: string;
  created_by: string;
  recurrence_type: string;
  recurrence_end_date: string | null;
}

function addInterval(date: Date, type: string): Date {
  const newDate = new Date(date);
  switch (type) {
    case "daily":
      newDate.setDate(newDate.getDate() + 1);
      break;
    case "weekly":
      newDate.setDate(newDate.getDate() + 7);
      break;
    case "monthly":
      newDate.setMonth(newDate.getMonth() + 1);
      break;
  }
  return newDate;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting recurring events generation...");

    // Get all recurring parent events
    const { data: recurringEvents, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .not("recurrence_type", "is", null)
      .is("parent_event_id", null);

    if (fetchError) {
      console.error("Error fetching recurring events:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringEvents?.length || 0} recurring events`);

    const now = new Date();
    const lookAheadDays = 30; // Generate events up to 30 days ahead
    const lookAheadDate = new Date(now);
    lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

    let createdCount = 0;

    for (const event of (recurringEvents || []) as RecurringEvent[]) {
      // Check recurrence end date
      if (event.recurrence_end_date && new Date(event.recurrence_end_date) < now) {
        console.log(`Skipping ${event.title} - recurrence ended`);
        continue;
      }

      // Get the latest instance of this event
      const { data: latestInstance } = await supabase
        .from("events")
        .select("event_date")
        .or(`id.eq.${event.id},parent_event_id.eq.${event.id}`)
        .order("event_date", { ascending: false })
        .limit(1)
        .single();

      const lastDate = latestInstance 
        ? new Date(latestInstance.event_date)
        : new Date(event.event_date);

      // Generate future instances
      let nextDate = addInterval(lastDate, event.recurrence_type);

      while (nextDate <= lookAheadDate) {
        // Check if we've passed the recurrence end date
        if (event.recurrence_end_date && nextDate > new Date(event.recurrence_end_date)) {
          break;
        }

        // Skip if the date is in the past
        if (nextDate < now) {
          nextDate = addInterval(nextDate, event.recurrence_type);
          continue;
        }

        // Check if this instance already exists
        const { data: existingInstance } = await supabase
          .from("events")
          .select("id")
          .eq("parent_event_id", event.id)
          .eq("event_date", nextDate.toISOString())
          .single();

        if (!existingInstance) {
          // Create the new instance
          const { error: insertError } = await supabase.from("events").insert({
            title: event.title,
            description: event.description,
            event_date: nextDate.toISOString(),
            location: event.location,
            max_attendees: event.max_attendees,
            community_id: event.community_id,
            created_by: event.created_by,
            parent_event_id: event.id,
          });

          if (insertError) {
            console.error(`Error creating instance for ${event.title}:`, insertError);
          } else {
            console.log(`Created instance for ${event.title} on ${nextDate.toISOString()}`);
            createdCount++;
          }
        }

        nextDate = addInterval(nextDate, event.recurrence_type);
      }
    }

    console.log(`Recurring events generation complete. Created ${createdCount} new instances.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${createdCount} recurring event instances` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in generate-recurring-events:", err);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
