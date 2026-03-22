import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agencyId } = await req.json();

    // Get integration
    const { data: integration } = await adminClient
      .from("integrations")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("provider", "hubspot")
      .eq("status", "active")
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "No active HubSpot integration", stages: [] }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get valid token
    const tokenRes = await fetch(`${supabaseUrl}/functions/v1/hubspot-refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ agencyId }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: "Failed to get token", stages: [] }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pipelineId = integration.settings?.pipeline_id || "default";

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/pipelines/deals/${pipelineId}/stages`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const data = await res.json();

    const stages = (data.results || []).map((s: any) => ({
      stageId: s.id,
      label: s.label,
      displayOrder: s.displayOrder,
    })).sort((a: any, b: any) => a.displayOrder - b.displayOrder);

    return new Response(JSON.stringify({ stages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stages: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
