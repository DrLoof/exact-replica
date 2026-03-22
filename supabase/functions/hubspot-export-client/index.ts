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

    const { clientId, agencyId } = await req.json();

    // Get integration
    const { data: integration } = await adminClient
      .from("integrations")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("provider", "hubspot")
      .eq("status", "active")
      .single();

    if (!integration || !integration.sync_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "No active HubSpot integration" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings = integration.settings || {};
    if (!settings.sync_clients) {
      return new Response(JSON.stringify({ skipped: true, reason: "Client sync disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client
    const { data: client } = await adminClient
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (!client) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already linked
    if (client.hubspot_contact_id) {
      return new Response(JSON.stringify({ skipped: true, reason: "Already linked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ error: "Failed to get HubSpot token" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = tokenData.access_token;

    // Search for existing contact by email
    let hubspotContactId: string | null = null;
    if (client.contact_email) {
      const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: client.contact_email }],
          }],
        }),
      });
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) {
        hubspotContactId = searchData.results[0].id;
      }
    }

    if (!hubspotContactId) {
      // Create new contact
      const contactName = client.contact_name || "";
      const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            email: client.contact_email || "",
            firstname: contactName.split(" ")[0] || "",
            lastname: contactName.split(" ").slice(1).join(" ") || "",
            company: client.company_name,
            jobtitle: client.contact_title || "",
            phone: client.phone || "",
            website: client.website || "",
          },
        }),
      });
      const contactData = await createRes.json();
      if (contactData.id) {
        hubspotContactId = contactData.id;
      }
    }

    if (hubspotContactId) {
      await adminClient
        .from("clients")
        .update({ hubspot_contact_id: hubspotContactId })
        .eq("id", clientId);
    }

    return new Response(JSON.stringify({ success: true, hubspotContactId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("hubspot-export-client error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
