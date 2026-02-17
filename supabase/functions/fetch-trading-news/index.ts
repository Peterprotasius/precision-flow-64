import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch latest news from AI
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a financial news analyst for forex and synthetic indices traders. Today is ${today}. Return upcoming high-impact economic events, market news, and actionable trading tips. Focus on events that move markets: NFP, CPI, interest rate decisions, GDP, PMI, etc.`,
            },
            {
              role: "user",
              content:
                "Give me the top 5 most important upcoming global economic events and 3 trading tips for today/this week. Be specific with dates, times (UTC), and affected currency pairs or indices.",
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "trading_notifications",
                description:
                  "Return trading news events and tips as structured notifications",
                parameters: {
                  type: "object",
                  properties: {
                    notifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          body: { type: "string" },
                          category: {
                            type: "string",
                            enum: ["news", "tip", "alert"],
                          },
                          importance: {
                            type: "string",
                            enum: ["low", "medium", "high"],
                          },
                        },
                        required: ["title", "body", "category", "importance"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["notifications"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "trading_notifications" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const notifications = parsed.notifications;

    // Insert notifications into DB
    if (notifications && notifications.length > 0) {
      const { error: insertErr } = await supabase
        .from("notifications")
        .insert(notifications);
      if (insertErr) {
        console.error("Insert error:", insertErr);
        throw new Error("Failed to save notifications");
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: notifications?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-trading-news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
