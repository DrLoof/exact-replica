import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      proposalId,
      signerName,
      signerTitle,
      signerCompany,
      signerEmail,
      signatureText,
      signatureFont,
      consentText,
      userAgent,
    } = await req.json();

    if (!proposalId || !signerName || !signerCompany || !signatureText || !consentText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP from request headers
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the proposal with all related data for the snapshot
    const { data: proposal, error: propError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (propError || !proposal) {
      return new Response(
        JSON.stringify({ error: "Proposal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (proposal.is_locked) {
      return new Response(
        JSON.stringify({ error: "Proposal is already signed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch services for snapshot
    const { data: services } = await supabase
      .from("proposal_services")
      .select("*, service_modules(name, description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables)")
      .eq("proposal_id", proposalId)
      .order("display_order");

    // Fetch terms
    const { data: terms } = proposal.agency_id
      ? await supabase.from("terms_clauses").select("title, content").eq("agency_id", proposal.agency_id).order("display_order")
      : { data: [] };

    // Build proposal snapshot
    const snapshot = {
      title: proposal.title,
      reference_number: proposal.reference_number,
      subtitle: proposal.subtitle,
      executive_summary: proposal.executive_summary,
      total_fixed: proposal.total_fixed,
      total_monthly: proposal.total_monthly,
      grand_total: proposal.grand_total,
      bundle_savings: proposal.bundle_savings,
      validity_days: proposal.validity_days,
      revision_rounds: proposal.revision_rounds,
      notice_period: proposal.notice_period,
      estimated_duration: proposal.estimated_duration,
      phases: proposal.phases,
      services: (services || []).map((s: any) => ({
        name: s.service_modules?.name,
        description: s.service_modules?.description,
        pricing_model: s.service_modules?.pricing_model,
        price: s.price_override ?? s.service_modules?.price_fixed ?? s.service_modules?.price_monthly ?? s.service_modules?.price_hourly,
        deliverables: s.service_modules?.deliverables,
        is_addon: s.is_addon,
      })),
      terms: terms || [],
    };

    // Generate SHA-256 hash of snapshot
    const snapshotStr = JSON.stringify(snapshot);
    const proposalHash = await sha256(snapshotStr);

    // Insert signature record
    const { data: signature, error: sigError } = await supabase
      .from("proposal_signatures")
      .insert({
        proposal_id: proposalId,
        signer_name: signerName,
        signer_title: signerTitle || null,
        signer_company: signerCompany,
        signer_email: signerEmail || null,
        signature_text: signatureText,
        signature_font: signatureFont || "Caveat",
        ip_address: ipAddress,
        user_agent: userAgent || null,
        consent_text: consentText,
        proposal_snapshot: snapshot,
        proposal_hash: proposalHash,
        role: "client",
      })
      .select()
      .single();

    if (sigError) {
      console.error("Signature insert error:", sigError);
      return new Response(
        JSON.stringify({ error: "Failed to record signature" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lock the proposal
    await supabase
      .from("proposals")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
        is_locked: true,
      })
      .eq("id", proposalId);

    // Fire-and-forget HubSpot sync for accepted status
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    fetch(`${supabaseUrl}/functions/v1/hubspot-sync-proposal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ proposalId }),
    }).catch(() => {});

    // Create in-app notification for the agency
    if (proposal.agency_id) {
      await supabase.from("notifications").insert({
        agency_id: proposal.agency_id,
        user_id: proposal.created_by,
        type: "proposal_signed",
        title: `${signerName} signed your proposal`,
        message: `"${proposal.title || proposal.reference_number}" has been signed by ${signerName}${signerTitle ? `, ${signerTitle}` : ""} at ${signerCompany}.`,
        proposal_id: proposalId,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        signature: {
          id: signature.id,
          signed_at: signature.signed_at,
          signer_name: signature.signer_name,
          proposal_hash: proposalHash,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sign proposal error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process signature" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
