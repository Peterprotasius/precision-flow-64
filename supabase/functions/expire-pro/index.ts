import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Scheduled task: automatically deactivates Pro users whose pro_expires_at has passed.
// Set up a cron job to call this function periodically (e.g., every hour).
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Find all users where is_pro = true and pro_expires_at < now()
    const { data: expired, error: fetchError } = await supabaseClient
      .from("profiles")
      .select("user_id, display_name, pro_expires_at")
      .eq("is_pro", true)
      .lt("pro_expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ message: "No expired Pro subscriptions found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate all expired Pro users
    const userIds = expired.map((p) => p.user_id);
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ is_pro: false, subscription_status: "free" })
      .in("user_id", userIds);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      message: `Deactivated ${expired.length} expired Pro subscription(s)`,
      count: expired.length,
      users: expired.map((p) => p.display_name || p.user_id),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
