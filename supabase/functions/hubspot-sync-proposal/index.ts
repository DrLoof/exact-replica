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

    const { proposalId } = await req.json();

    // Get proposal with client info
    const { data: proposal, error: pErr } = await adminClient
      .from("proposals")
      .select("*, client:clients(*)")
      .eq("id", proposalId)
      .single();

    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "Proposal not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get integration
    const { data: integration } = await adminClient
      .from("integrations")
      .select("*")
      .eq("agency_id", proposal.agency_id)
      .eq("provider", "hubspot")
      .eq("status", "active")
      .single();

    if (!integration || !integration.sync_enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "No active HubSpot integration" }), {
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
      body: JSON.stringify({ agencyId: proposal.agency_id }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: "Failed to get HubSpot token" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = tokenData.access_token;
    const settings = integration.settings || {};
    const stageMapping = settings.stage_mapping || {};

    // Get share URL if proposal is shared
    let shareUrl = "";
    const { data: share } = await adminClient
      .from("proposal_shares")
      .select("share_id")
      .eq("proposal_id", proposalId)
      .eq("is_active", true)
      .limit(1)
      .single();
    if (share) {
      shareUrl = `https://app.propopad.com/p/${share.share_id}`;
    }

    // Sync client to HubSpot contact first if needed
    let hubspotContactId = proposal.client?.hubspot_contact_id;
    if (!hubspotContactId && proposal.client?.contact_email && settings.sync_clients) {
      // Search for existing contact by email
      const searchRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/search`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{ propertyName: "email", operator: "EQ", value: proposal.client.contact_email }],
            }],
          }),
        }
      );
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) {
        hubspotContactId = searchData.results[0].id;
      } else {
        // Create contact
        const contactName = proposal.client.contact_name || "";
        const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: {
              email: proposal.client.contact_email,
              firstname: contactName.split(" ")[0] || "",
              lastname: contactName.split(" ").slice(1).join(" ") || "",
              company: proposal.client.company_name,
              jobtitle: proposal.client.contact_title || "",
              phone: proposal.client.phone || "",
              website: proposal.client.website || "",
            },
          }),
        });
        const contactData = await createRes.json();
        if (contactData.id) hubspotContactId = contactData.id;
      }

      if (hubspotContactId) {
        await adminClient
          .from("clients")
          .update({ hubspot_contact_id: hubspotContactId })
          .eq("id", proposal.client.id);
      }
    }

    // Sync proposal as deal
    const dealProperties: Record<string, any> = {
      dealname: proposal.title || `Proposal for ${proposal.client?.company_name || "Client"}`,
      amount: proposal.grand_total || 0,
      pipeline: settings.pipeline_id || "default",
      description: `Propopad proposal: ${proposal.reference_number}`,
    };

    if (stageMapping[proposal.status]) {
      dealProperties.dealstage = stageMapping[proposal.status];
    }

    let hubspotDealId = proposal.hubspot_deal_id;

    if (hubspotDealId) {
      // Update existing deal
      const updateRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ properties: dealProperties }),
      });
      if (!updateRes.ok) {
        const errBody = await updateRes.text();
        console.error("Failed to update HubSpot deal:", errBody);
      }
    } else {
      // Create new deal
      const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ properties: dealProperties }),
      });
      const dealData = await createRes.json();
      if (dealData.id) {
        hubspotDealId = dealData.id;
        await adminClient
          .from("proposals")
          .update({ hubspot_deal_id: hubspotDealId })
          .eq("id", proposalId);

        // Associate deal with contact
        if (hubspotContactId) {
          await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}/associations/contacts/${hubspotContactId}/deal_to_contact`,
            { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
    }

    // Add activity note
    if (hubspotDealId) {
      const noteMap: Record<string, string> = {
        sent: `Proposal sent via Propopad — ${proposal.title || proposal.reference_number}${shareUrl ? ` (${shareUrl})` : ""}`,
        viewed: `Client viewed the proposal — ${proposal.title || proposal.reference_number}`,
        accepted: `Proposal accepted — ${proposal.title || proposal.reference_number}`,
        declined: `Proposal declined — ${proposal.title || proposal.reference_number}`,
      };
      const noteBody = noteMap[proposal.status];
      if (noteBody) {
        await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: {
              hs_note_body: noteBody,
              hs_timestamp: new Date().toISOString(),
            },
            associations: [{
              to: { id: hubspotDealId },
              types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }],
            }],
          }),
        });
      }
    }

    // Update last_synced_at
    await adminClient
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);

    return new Response(JSON.stringify({ success: true, hubspotDealId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("hubspot-sync-proposal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
