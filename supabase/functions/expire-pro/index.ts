import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check: verify the caller provides a valid authorization matching anon key (cron job)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Only allow calls authenticated with the anon key or service role key (cron jobs)
  if (token !== anonKey && token !== serviceKey) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { data: expired, error: fetchError } = await supabaseClient
      .from("profiles")
      .select("user_id, pro_expires_at")
      .eq("is_pro", true)
      .lt("pro_expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ message: "No expired subscriptions found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = expired.map((p) => p.user_id);
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ is_pro: false, subscription_status: "free" })
      .in("user_id", userIds);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      message: `Deactivated ${expired.length} expired subscription(s)`,
      count: expired.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("expire-pro error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
