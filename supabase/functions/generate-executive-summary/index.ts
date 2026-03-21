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
    const {
      agencyName,
      clientName,
      serviceNames,
      serviceContexts,
      clientChallenge,
      clientChallenges,
      clientGoal,
      goals,
      clientContextNote,
    } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const servicesStr = (serviceNames || []).join(", ");
    const contextsStr = (serviceContexts || []).join("\n");

    // Support both old single clientChallenge and new clientChallenges array
    const challenges: string[] = clientChallenges || (clientChallenge ? [clientChallenge] : []);

    let contextBlock = "";
    if (challenges.length > 0) {
      if (challenges.length === 1) {
        contextBlock += `\n- Client's main challenge (from agency): ${challenges[0]}\n  USE THIS as the primary framing. It overrides the service context.`;
      } else {
        contextBlock += `\n- Client's key challenges (from agency):\n${challenges.map((c: string) => `  • ${c}`).join('\n')}\n  Address these challenges and connect them to the proposed services. Use the first 1-2 as primary framing.`;
      }
    }

    // Support both old single clientGoal and new goals array
    const goalsList: Array<{label: string; kpi: string}> = goals || (clientGoal ? [{ label: clientGoal, kpi: '' }] : []);
    if (goalsList.length > 0) {
      contextBlock += `\n- Proposal goals and KPI targets:\n${goalsList.map((g: any) => `  • ${g.label}${g.kpi ? ` (target: ${g.kpi})` : ''}`).join('\n')}\n  Reference these specific targets in the summary. Connect services to how they'll achieve these goals.`;
    }

    if (clientContextNote) {
      contextBlock += `\n- Additional context: ${clientContextNote}\n  Weave this in naturally. This is insider knowledge — use it to make the proposal feel like it came from a real conversation.`;
    }

    const prompt = `You are writing an executive summary paragraph for a marketing proposal from ${agencyName || "the agency"} to ${clientName || "the client"}.

RULES:
- Write 3-5 sentences. One paragraph. No headers or bullets.
- Write in plain, professional English. Direct and warm.
- Sound like a confident agency owner, not a chatbot.
- Write from the agency's perspective using first person plural ("we", "our", "us"). The proposal is written BY the agency TO the client.
- Use "you" and "your" when referring to the client.
- NEVER refer to the agency in third person. Never use "they", "their", or the agency name as a subject.
- Do NOT use these words: leverage, synergy, holistic, elevate, cutting-edge, game-changer, spearhead, unlock, empower, innovative, robust, seamless.
- Do NOT start with "Dear", "This proposal", or "We are pleased".
- Start with the client's name or their situation.

STRUCTURE:
1. One sentence about the client's current situation or challenge
2. One to two sentences about the approach (reference services naturally — don't list them mechanically)
3. One sentence about the expected outcome

CONTEXT:
- Client: ${clientName || "the client"}
- Agency: ${agencyName || "the agency"}
- Selected services: ${servicesStr}
- Service context: ${contextsStr}${contextBlock}`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write executive summary paragraphs for marketing proposals. Return ONLY the paragraph text, no quotes, no headers, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(
        JSON.stringify({ summary: null, error: "AI generation failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content?.trim() || null;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Executive summary generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate executive summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
