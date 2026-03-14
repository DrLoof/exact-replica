import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scraped_text, company_name } = await req.json();
    if (!scraped_text) {
      return new Response(JSON.stringify({ error: "scraped_text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ summary: scraped_text.slice(0, 300) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are summarizing a company's publicly available website for use as context in a business proposal.

Return a JSON object with two fields:
1. "summary": A 2-3 sentence business summary of this company. Focus on: what the company does, who they serve, and their market position. Write in third person, professional tone. Write entirely in your own words — do not copy any sentences verbatim from the source. Do NOT include lists of services detected, do NOT include raw data dumps. Always write in English regardless of the source language.
2. "industry": The best matching industry from this list: Technology, Healthcare, Finance, E-commerce, Education, Real Estate, Manufacturing, Media, Non-profit, Professional Services, Retail, Other. Pick exactly one.

Return ONLY valid JSON, nothing else.`,
          },
          {
            role: "user",
            content: `Company name: ${company_name || "Unknown"}\n\nWebsite content:\n${scraped_text.slice(0, 8000)}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ summary: scraped_text.slice(0, 300) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";
    
    let summary = scraped_text.slice(0, 300);
    let industry = "";
    
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      summary = parsed.summary || summary;
      industry = parsed.industry || "";
    } catch {
      // If JSON parsing fails, use raw content as summary
      summary = rawContent || summary;
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
