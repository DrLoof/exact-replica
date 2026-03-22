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
    const hubspotClientId = Deno.env.get("HUBSPOT_CLIENT_ID");
    const hubspotClientSecret = Deno.env.get("HUBSPOT_CLIENT_SECRET");

    if (!hubspotClientId || !hubspotClientSecret) {
      return new Response(JSON.stringify({ error: "HubSpot credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user auth
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, redirectUri } = await req.json();

    // Exchange code for tokens
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: hubspotClientId,
        client_secret: hubspotClientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: tokenData.message || "Token exchange failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get HubSpot portal info
    let hubId = null;
    try {
      const infoRes = await fetch("https://api.hubapi.com/oauth/v1/access-tokens/" + access_token);
      const infoData = await infoRes.json();
      hubId = infoData.hub_id?.toString() || null;
    } catch (_) {}

    // Get user's agency_id
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userProfile } = await adminClient
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.agency_id) {
      return new Response(JSON.stringify({ error: "No agency found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert integration record
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    await adminClient
      .from("integrations")
      .upsert({
        agency_id: userProfile.agency_id,
        provider: "hubspot",
        access_token,
        refresh_token,
        token_expires_at: tokenExpiresAt,
        hub_id: hubId,
        status: "active",
        error_message: null,
        settings: {
          sync_proposals: true,
          sync_clients: true,
          import_contacts: true,
          auto_create_deals: true,
          pipeline_id: "default",
          stage_mapping: {},
        },
      }, { onConflict: "agency_id,provider" });

    return new Response(JSON.stringify({ success: true, hubId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
