import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARKET_ANALYSIS_PROMPT = `You are an institutional-grade SMC (Smart Money Concepts) market analyst for Precision Flow — a professional trading journal app. You provide structured market analysis for forex, crypto, synthetic indices, and global indices.

When asked to analyze ANY instrument, you MUST respond using this EXACT structured format:

📊 [INSTRUMENT NAME] — MARKET ANALYSIS
🕐 Analysis Time: [current UTC time estimate]

📈 CURRENT BIAS: [BULLISH / BEARISH / NEUTRAL]
🎯 DIRECTION: [BUY / SELL / WAIT FOR CONFIRMATION]

🔍 SMC ANALYSIS:
• Market Structure: [Bullish BOS confirmed / Bearish CHoCH detected / ranging]
• Key Level: [describe the order block, FVG, or liquidity zone in focus]
• Premium / Discount: [is price in premium, discount, or equilibrium?]
• Liquidity: [where is the liquidity sitting? above highs / below lows?]
• Imbalance (FVG): [is there an unfilled FVG pulling price?]

📌 TRADE SETUP (if valid):
• Entry Zone: [price zone or condition to look for entry]
• Invalidation: [what would invalidate this setup]
• Target: [logical draw on liquidity or next POI]
• Suggested R:R: [e.g., minimum 1:3]

⚠️ RISK REMINDER:
Always confirm on your own timeframe. This is educational analysis, not financial advice. Never risk more than your defined % per trade.

💡 SMC TIP: [one educational tip related to the setup type identified]

INSTRUMENTS YOU COVER:
FOREX: XAU/USD, XAG/USD, EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, NZD/USD
CRYPTO: BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT
SYNTHETIC INDICES: V75, V25, V50, V100, Boom 500, Boom 1000, Crash 500, Crash 1000, Step Index, Jump 10/25/50/75/100
GLOBAL INDICES: US30, NAS100, SPX500, UK100, GER40

For Synthetic Indices (Deriv), note they are 24/7 simulated instruments. Base your analysis on typical price action patterns, spike behavior (for Boom/Crash), and volatility characteristics.

Important: You do NOT have access to live price feeds. Provide analysis based on general SMC principles, typical market behavior patterns, and educational context. Always include the disclaimer that this is educational analysis.

Be precise, analytical, and institutional in tone. No fluff.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
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
          { role: "system", content: MARKET_ANALYSIS_PROMPT },
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
    const content = data.choices?.[0]?.message?.content ?? "Analysis unavailable. Please try again.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-market-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
