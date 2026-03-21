import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ServiceModule {
  name: string;
  timeline_type?: string;  // 'project' | 'ongoing' | 'deliverable'
  setup_weeks?: number;
  min_weeks?: number;
  max_weeks?: number;
  phase_category?: string; // 'discovery' | 'strategy' | 'creative' | 'build' | 'launch' | 'ongoing'
  can_parallel?: boolean;
  depends_on?: string[];
}

interface Phase {
  phase_number: number;
  phase_name: string;
  category: string;
  weeks: number;
  services: string[];
  is_ongoing: boolean;
  week_start?: number | null;
  week_end?: number | null;
  week_range?: string;
  description?: string;
}

function buildPhases(services: ServiceModule[]): { phases: Phase[]; totalProjectWeeks: number } {
  const projectServices = services.filter(s => (s.timeline_type || 'project') === 'project');
  const ongoingServices = services.filter(s => s.timeline_type === 'ongoing');
  const deliverableServices = services.filter(s => s.timeline_type === 'deliverable');
  const allOngoing = [...ongoingServices, ...deliverableServices];

  const phases: Phase[] = [];
  let phaseNumber = 1;

  // Edge case: only ongoing services
  if (projectServices.length === 0 && allOngoing.length > 0) {
    const maxSetup = ongoingServices.length > 0
      ? Math.max(...ongoingServices.map(s => s.setup_weeks || 0))
      : 0;

    phases.push({
      phase_number: phaseNumber++,
      phase_name: 'Setup & Onboarding',
      category: 'discovery',
      weeks: Math.max(maxSetup, 2),
      services: allOngoing.map(s => s.name),
      is_ongoing: false,
    });

    phases.push({
      phase_number: phaseNumber++,
      phase_name: 'Ongoing Management',
      category: 'ongoing',
      weeks: 0,
      services: allOngoing.map(s => s.name),
      is_ongoing: true,
    });
  } else {
    // DISCOVERY — always include if project services exist
    if (projectServices.length > 0) {
      const discoveryWeeks = projectServices.length >= 5 ? 3 : projectServices.length >= 3 ? 2 : 1;
      phases.push({
        phase_number: phaseNumber++,
        phase_name: 'Discovery & Research',
        category: 'discovery',
        weeks: Math.min(discoveryWeeks, 3),
        services: services.map(s => s.name),
        is_ongoing: false,
      });
    }

    // STRATEGY
    const strategyServices = projectServices.filter(s => s.phase_category === 'strategy');
    if (strategyServices.length > 0) {
      const weeks = Math.max(...strategyServices.map(s => s.min_weeks || 2));
      phases.push({
        phase_number: phaseNumber++,
        phase_name: 'Strategy & Planning',
        category: 'strategy',
        weeks,
        services: strategyServices.map(s => s.name),
        is_ongoing: false,
      });
    }

    // CREATIVE
    const creativeServices = projectServices.filter(s => s.phase_category === 'creative');
    if (creativeServices.length > 0) {
      const weeks = Math.max(...creativeServices.map(s => s.min_weeks || 2));
      phases.push({
        phase_number: phaseNumber++,
        phase_name: 'Creative Development',
        category: 'creative',
        weeks,
        services: creativeServices.map(s => s.name),
        is_ongoing: false,
      });
    }

    // BUILD
    const buildServices = projectServices.filter(s => s.phase_category === 'build');
    if (buildServices.length > 0) {
      const parallelBuilds = buildServices.filter(s => s.can_parallel !== false);
      const sequentialBuilds = buildServices.filter(s => s.can_parallel === false);

      const parallelMax = parallelBuilds.length > 0
        ? Math.max(...parallelBuilds.map(s => s.min_weeks || 2))
        : 0;
      const sequentialMax = sequentialBuilds.length > 0
        ? Math.max(...sequentialBuilds.map(s => s.min_weeks || 2))
        : 0;

      const weeks = Math.max(parallelMax, sequentialMax);
      phases.push({
        phase_number: phaseNumber++,
        phase_name: 'Build & Implementation',
        category: 'build',
        weeks,
        services: buildServices.map(s => s.name),
        is_ongoing: false,
      });
    }

    // LAUNCH — always if project services exist
    if (projectServices.length > 0) {
      const launchWeeks = projectServices.length >= 4 ? 2 : 1;
      phases.push({
        phase_number: phaseNumber++,
        phase_name: 'Launch & Optimize',
        category: 'launch',
        weeks: launchWeeks,
        services: projectServices.map(s => s.name),
        is_ongoing: false,
      });
    }

    // ONGOING
    if (allOngoing.length > 0) {
      phases.push({
        phase_number: phaseNumber++,
        phase_name: 'Ongoing Management',
        category: 'ongoing',
        weeks: 0,
        services: allOngoing.map(s => s.name),
        is_ongoing: true,
      });
    }
  }

  // Calculate week ranges
  let currentWeek = 1;
  phases.forEach(phase => {
    if (phase.is_ongoing) {
      phase.week_start = null;
      phase.week_end = null;
      phase.week_range = 'Ongoing';
    } else {
      phase.week_start = currentWeek;
      phase.week_end = currentWeek + phase.weeks - 1;
      phase.week_range = phase.weeks === 1
        ? `Week ${phase.week_start}`
        : `Weeks ${phase.week_start}–${phase.week_end}`;
      currentWeek = phase.week_end + 1;
    }
  });

  const totalProjectWeeks = currentWeek - 1;
  return { phases, totalProjectWeeks };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { services, clientName } = await req.json();

    const moduleList: ServiceModule[] = (services || []).map((s: any) => ({
      name: s.name || 'Service',
      timeline_type: s.timeline_type || 'project',
      setup_weeks: s.setup_weeks || 0,
      min_weeks: s.min_weeks ?? 2,
      max_weeks: s.max_weeks ?? 4,
      phase_category: s.phase_category || 'build',
      can_parallel: s.can_parallel !== false,
      depends_on: s.depends_on || [],
    }));

    const { phases, totalProjectWeeks } = buildPhases(moduleList);
    const serviceNames = moduleList.map(s => s.name).join(", ");
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey || !serviceNames) {
      // Return phases with default descriptions
      const result = phases.map(p => ({
        name: p.phase_name,
        duration: p.week_range || p.phase_name,
        description: p.is_ongoing
          ? `We'll provide ongoing management and optimization for ${p.services.join(', ')}, with regular reporting and continuous improvement.`
          : `We'll focus on ${p.phase_name.toLowerCase()} during this phase, covering ${p.services.slice(0, 3).join(', ')}.`,
        week_start: p.week_start,
        week_end: p.week_end,
        week_range: p.week_range,
        services: p.services,
        is_ongoing: p.is_ongoing,
      }));

      return new Response(JSON.stringify({ phases: result, totalProjectWeeks }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build per-phase prompts
    const phasePrompts = phases.map(p => {
      if (p.is_ongoing) {
        return `Phase: ${p.phase_name}\nType: Ongoing monthly management\nServices: ${p.services.join(', ')}`;
      }
      return `Phase: ${p.phase_name}\nWeek range: ${p.week_range}\nServices in this phase: ${p.services.join(', ')}`;
    }).join("\n\n");

    const systemPrompt = `You are writing short project phase descriptions for a client proposal from a marketing agency.

Rules:
- Write in first person plural ("we" / "our")
- Reference the specific services that happen in each phase
- Be specific about deliverables produced in each phase
- Professional but approachable tone
- Do not use generic filler
- Always respond in English regardless of input language
- Each description should be exactly 2-3 sentences
- For "Ongoing Management" phases, mention regular reporting and optimization cadence
- Return a JSON array of objects with "name" and "description" fields
- Return ONLY valid JSON, no markdown or code blocks`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
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
        max_tokens: 1500,
      }),
    });

    let aiPhases: any[] = [];
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      let aiText = aiData.choices?.[0]?.message?.content?.trim() || "";
      aiText = aiText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      try {
        aiPhases = JSON.parse(aiText);
      } catch {
        aiPhases = [];
      }
    }

    const result = phases.map((p, i) => ({
      name: p.phase_name,
      duration: p.week_range || p.phase_name,
      description: aiPhases[i]?.description || (p.is_ongoing
        ? `We'll provide ongoing management and optimization for ${p.services.join(', ')}, with regular reporting and continuous improvement.`
        : `We'll focus on ${p.phase_name.toLowerCase()} during this phase, covering ${p.services.slice(0, 3).join(', ')}.`),
      week_start: p.week_start,
      week_end: p.week_end,
      week_range: p.week_range,
      services: p.services,
      is_ongoing: p.is_ongoing,
    }));

    return new Response(JSON.stringify({ phases: result, totalProjectWeeks }), {
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
