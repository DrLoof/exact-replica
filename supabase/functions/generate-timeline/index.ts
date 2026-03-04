import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DEFAULT_PHASES = [
  { name: "Discovery & Research", pct: 0.12 },
  { name: "Strategy & Architecture", pct: 0.12 },
  { name: "Creative Development", pct: 0.31 },
  { name: "Build & Produce", pct: 0.25 },
  { name: "Launch & Optimize", pct: 0.20 },
];

function distributeWeeks(totalWeeks: number) {
  const rawWeeks = DEFAULT_PHASES.map(p => p.pct * totalWeeks);
  const rounded = rawWeeks.map(w => Math.max(1, Math.round(w)));
  
  // Adjust to match total
  let sum = rounded.reduce((a, b) => a + b, 0);
  let i = rounded.length - 1;
  while (sum > totalWeeks && i >= 0) {
    if (rounded[i] > 1) { rounded[i]--; sum--; }
    i--;
  }
  while (sum < totalWeeks) {
    rounded[2]++; // add to Creative Development
    sum++;
  }

  const phases = [];
  let weekStart = 1;
  for (let j = 0; j < DEFAULT_PHASES.length; j++) {
    const weekEnd = weekStart + rounded[j] - 1;
    phases.push({
      name: DEFAULT_PHASES[j].name,
      weekStart,
      weekEnd,
      duration: weekStart === weekEnd ? `WEEK ${weekStart}` : `WEEKS ${weekStart}–${weekEnd}`,
    });
    weekStart = weekEnd + 1;
  }
  return phases;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { services, clientName, totalWeeks, customPhases } = await req.json();
    
    const effectiveTotal = totalWeeks || 16;
    const phaseData = customPhases?.length > 0
      ? customPhases.map((p: any, i: number) => ({
          name: p.name,
          weekStart: p.weekStart || (i * 3 + 1),
          weekEnd: p.weekEnd || ((i + 1) * 3),
          duration: p.duration || `WEEKS ${i * 3 + 1}–${(i + 1) * 3}`,
        }))
      : distributeWeeks(effectiveTotal);

    const serviceNames = (services || []).map((s: any) => s.name || s).join(", ");
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey || !serviceNames) {
      // Return phases with default descriptions
      const defaultDescriptions: Record<string, string> = {
        "Discovery & Research": "Deep-dive into your brand, market, competitors, and audience. Stakeholder interviews, analytics audit, and competitive benchmarking to build a strategic foundation.",
        "Strategy & Architecture": "We'll develop the strategic framework, positioning, and project architecture that will guide all creative and technical execution.",
        "Creative Development": "Design concepts, content creation, and iterative review cycles. We'll bring the strategy to life through compelling creative work.",
        "Build & Produce": "Technical development, production, and rigorous quality assurance testing to ensure everything meets our high standards.",
        "Launch & Optimize": "Coordinated go-live, monitoring, and performance optimization to ensure a successful launch and continued improvement.",
      };

      const phases = phaseData.map((p: any) => ({
        name: p.name,
        duration: p.duration,
        description: defaultDescriptions[p.name] || `We'll focus on ${p.name.toLowerCase()} during this phase of the project.`,
      }));

      return new Response(JSON.stringify({ phases }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate AI descriptions for each phase
    const phasePrompts = phaseData.map((p: any) => `Phase: ${p.name}\nWeek range: ${p.duration}`).join("\n\n");

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
            content: `You are writing short project phase descriptions for a client proposal.

Rules:
- Write in first person plural ("we" / "our")
- Reference the specific services that happen in each phase
- Professional but approachable tone
- Do not use generic filler — be specific to the services selected
- Always respond in English regardless of input language
- Each description should be exactly 2-3 sentences
- Return a JSON array of objects with "name" and "description" fields
- Return ONLY valid JSON, no markdown or code blocks`,
          },
          {
            role: "user",
            content: `Client: ${clientName || "the client"}
Selected services: ${serviceNames}

Generate descriptions for these phases:

${phasePrompts}

Return JSON array: [{"name": "Phase Name", "description": "2-3 sentences"}]`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      // Fallback to defaults
      const phases = phaseData.map((p: any) => ({
        name: p.name,
        duration: p.duration,
        description: `We'll focus on ${p.name.toLowerCase()} during this phase, leveraging our expertise in ${serviceNames.split(",").slice(0, 2).join(" and ")}.`,
      }));
      return new Response(JSON.stringify({ phases }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let aiText = aiData.choices?.[0]?.message?.content?.trim() || "";
    
    // Strip markdown code blocks if present
    aiText = aiText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    let aiPhases: any[] = [];
    try {
      aiPhases = JSON.parse(aiText);
    } catch {
      // Fallback
      aiPhases = [];
    }

    const phases = phaseData.map((p: any, i: number) => ({
      name: p.name,
      duration: p.duration,
      description: aiPhases[i]?.description || `We'll focus on ${p.name.toLowerCase()} during this phase of the project.`,
    }));

    return new Response(JSON.stringify({ phases }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Timeline generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate timeline" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
