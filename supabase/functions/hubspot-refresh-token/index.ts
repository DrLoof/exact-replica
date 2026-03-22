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

    const { agencyId } = await req.json();
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: integration, error } = await adminClient
      .from("integrations")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("provider", "hubspot")
      .single();

    if (error || !integration) {
      return new Response(JSON.stringify({ error: "Integration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(integration.token_expires_at);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    // If token is still valid, return it
    if (expiresAt > fiveMinutesFromNow) {
      return new Response(JSON.stringify({ access_token: integration.access_token, refreshed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh the token
    const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: hubspotClientId,
        client_secret: hubspotClientSecret,
        refresh_token: integration.refresh_token,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      // Token refresh failed — likely revoked
      await adminClient
        .from("integrations")
        .update({
          status: "error",
          error_message: "Token refresh failed. Please reconnect HubSpot.",
        })
        .eq("id", integration.id);

      return new Response(JSON.stringify({ error: "Token refresh failed", details: tokenData }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await adminClient
      .from("integrations")
      .update({
        access_token,
        refresh_token,
        token_expires_at: newExpiresAt,
        status: "active",
        error_message: null,
      })
      .eq("id", integration.id);

    return new Response(JSON.stringify({ access_token, refreshed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
