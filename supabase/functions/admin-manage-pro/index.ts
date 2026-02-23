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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error("Authentication error");
    const adminId = userData.user?.id;
    if (!adminId) throw new Error("Not authenticated");

    // Verify the caller is an admin using the has_role function
    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized: admin access required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { action, user_id, months } = await req.json();

    if (!user_id) throw new Error("user_id is required");

    if (action === "activate") {
      // Activate Pro for N months (default 1)
      const durationMonths = months || 1;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const { error } = await supabaseClient
        .from("profiles")
        .update({
          is_pro: true,
          pro_expires_at: expiresAt.toISOString(),
          subscription_status: "pro",
        })
        .eq("user_id", user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, pro_expires_at: expiresAt.toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "deactivate") {
      const { error } = await supabaseClient
        .from("profiles")
        .update({
          is_pro: false,
          pro_expires_at: null,
          subscription_status: "free",
        })
        .eq("user_id", user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "extend") {
      // Extend current Pro by N months
      const durationMonths = months || 1;
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("pro_expires_at")
        .eq("user_id", user_id)
        .single();

      const baseDate = profile?.pro_expires_at ? new Date(profile.pro_expires_at) : new Date();
      if (baseDate < new Date()) baseDate.setTime(Date.now());
      baseDate.setMonth(baseDate.getMonth() + durationMonths);

      const { error } = await supabaseClient
        .from("profiles")
        .update({
          is_pro: true,
          pro_expires_at: baseDate.toISOString(),
          subscription_status: "pro",
        })
        .eq("user_id", user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, pro_expires_at: baseDate.toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "list") {
      // List all users with their Pro status
      const { data: profiles, error } = await supabaseClient
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_pro, pro_expires_at, subscription_status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get emails from auth.users
      const { data: { users: authUsers }, error: authError } = await supabaseClient.auth.admin.listUsers();
      if (authError) throw authError;

      const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

      const enriched = (profiles || []).map((p) => ({
        ...p,
        email: emailMap.get(p.user_id) || "unknown",
      }));

      return new Response(JSON.stringify({ users: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use: activate, deactivate, extend, or list");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
