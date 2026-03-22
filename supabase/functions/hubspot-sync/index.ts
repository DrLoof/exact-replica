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

    // Sync all proposals with active HubSpot integration
    const { data: integration } = await adminClient
      .from("integrations")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("provider", "hubspot")
      .eq("status", "active")
      .single();

    if (!integration || !integration.sync_enabled) {
      return new Response(JSON.stringify({ error: "No active HubSpot integration" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all proposals with clients that could be synced
    const { data: proposals } = await adminClient
      .from("proposals")
      .select("id, status")
      .eq("agency_id", agencyId)
      .in("status", ["sent", "viewed", "accepted", "declined"]);

    let synced = 0;
    let errors = 0;

    for (const proposal of (proposals || [])) {
      try {
        const syncRes = await fetch(`${supabaseUrl}/functions/v1/hubspot-sync-proposal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({ proposalId: proposal.id }),
        });
        if (syncRes.ok) synced++;
        else errors++;
      } catch {
        errors++;
      }
      await new Promise((r) => setTimeout(r, 150)); // Rate limiting
    }

    // Update last_synced_at
    await adminClient
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);

    return new Response(JSON.stringify({ success: true, synced, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
