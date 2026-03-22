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

    const { agencyId, action, selectedContacts } = await req.json();

    // Verify user belongs to agency
    const { data: userProfile } = await adminClient
      .from("users")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (userProfile?.agency_id !== agencyId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get integration & token
    const { data: integration } = await adminClient
      .from("integrations")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("provider", "hubspot")
      .eq("status", "active")
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "No active HubSpot integration" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // ACTION: fetch — get contacts from HubSpot for preview
    if (action === "fetch") {
      let allContacts: any[] = [];
      let after: string | undefined;
      let pages = 0;

      do {
        const url = new URL("https://api.hubapi.com/crm/v3/objects/contacts");
        url.searchParams.set("limit", "100");
        url.searchParams.set("properties", "email,firstname,lastname,company,jobtitle,phone,website");
        if (after) url.searchParams.set("after", after);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.results) allContacts = allContacts.concat(data.results);
        after = data.paging?.next?.after;
        pages++;
        if (pages >= 5) break; // Max 500 contacts
        if (after) await new Promise((r) => setTimeout(r, 150));
      } while (after);

      // Get existing clients for dedup
      const { data: existingClients } = await adminClient
        .from("clients")
        .select("id, contact_email, company_name, hubspot_contact_id")
        .eq("agency_id", agencyId);

      const existingEmails = new Set((existingClients || []).map((c: any) => c.contact_email?.toLowerCase()).filter(Boolean));
      const existingCompanies = new Set((existingClients || []).map((c: any) => c.company_name?.toLowerCase()).filter(Boolean));
      const existingHubspotIds = new Set((existingClients || []).map((c: any) => c.hubspot_contact_id).filter(Boolean));

      const contacts = allContacts.map((c: any) => {
        const email = c.properties.email?.toLowerCase();
        const company = c.properties.company;
        const alreadyLinked = existingHubspotIds.has(c.id);
        const emailMatch = email && existingEmails.has(email);
        const companyMatch = company && existingCompanies.has(company.toLowerCase());
        const hasCompany = !!company;

        return {
          hubspotId: c.id,
          email: c.properties.email || "",
          firstName: c.properties.firstname || "",
          lastName: c.properties.lastname || "",
          company: company || "",
          title: c.properties.jobtitle || "",
          phone: c.properties.phone || "",
          website: c.properties.website || "",
          alreadyInPropopad: alreadyLinked || emailMatch || companyMatch,
          willUpdate: (alreadyLinked || emailMatch || companyMatch) && hasCompany,
          hasCompany,
          importable: hasCompany,
        };
      });

      return new Response(JSON.stringify({ contacts, total: contacts.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: import — import selected contacts
    if (action === "import") {
      if (!selectedContacts || !Array.isArray(selectedContacts)) {
        return new Response(JSON.stringify({ error: "No contacts provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let imported = 0;
      let updated = 0;

      for (const contact of selectedContacts) {
        // Check if already exists by email or hubspot_contact_id
        const { data: existing } = await adminClient
          .from("clients")
          .select("id, hubspot_contact_id")
          .eq("agency_id", agencyId)
          .or(`contact_email.eq.${contact.email},hubspot_contact_id.eq.${contact.hubspotId}`)
          .limit(1)
          .single();

        const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

        if (existing) {
          // Update — fill gaps, don't overwrite existing data
          const updates: Record<string, any> = { hubspot_contact_id: contact.hubspotId };
          if (!existing.hubspot_contact_id) updates.hubspot_contact_id = contact.hubspotId;

          await adminClient
            .from("clients")
            .update(updates)
            .eq("id", existing.id);
          updated++;
        } else {
          // Create new client
          await adminClient
            .from("clients")
            .insert({
              agency_id: agencyId,
              company_name: contact.company || contactName || "Unknown",
              contact_name: contactName || null,
              contact_email: contact.email || null,
              contact_title: contact.title || null,
              phone: contact.phone || null,
              website: contact.website || null,
              hubspot_contact_id: contact.hubspotId,
              created_by: user.id,
            });
          imported++;
        }

        await new Promise((r) => setTimeout(r, 50)); // Rate limiting
      }

      // Update last_synced_at
      await adminClient
        .from("integrations")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", integration.id);

      return new Response(JSON.stringify({ success: true, imported, updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("hubspot-import-contacts error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
