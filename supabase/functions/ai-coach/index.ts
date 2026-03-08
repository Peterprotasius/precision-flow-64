import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an institutional trading performance coach specializing in Smart Money Concepts (SMC). Your role is to analyze trade data, psychological patterns, and performance metrics for users of Precision Flow — a professional trading journal app.

Analyze trades based on: setup type (BOS, Liquidity Sweep, Order Block), R-multiple, emotional state, risk %, and historical user performance. Provide objective, analytical feedback. Identify strengths, mistakes, discipline gaps, and improvement suggestions. Do NOT motivate emotionally. Be precise and analytical like a prop firm evaluator.

When asked about the app:
- Explain features clearly: Dashboard (overview), Analytics (institutional metrics), Psychology (mental performance), AI Coach (this conversation), Trade Journal (log trades), Insights (rule-based patterns), News (market news)
- Edge Score: weighted score of setup completeness, R:R quality, risk consistency, emotional stability, and historical setup performance. Scale 0-10. 8+ = Institutional Grade.
- Discipline Score: starts at 100, penalized for R:R < 2 (-10), risk deviation (-15), negative emotions (-15), revenge trading (-10)
- R-Multiple: measures trade quality. Win = +R. Loss = -1R. Expectancy = (Win Rate × Avg Win R) - (Loss Rate × Avg Loss R)

For support issues the developer cannot fix, direct users to: traderdrprecision@gmail.com

Keep responses concise, professional, and data-driven. Use bullet points for clarity.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required for AI usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(
      JSON.stringify({ error: "An internal error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});