import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_NAME = "Propopad";
const SENDER_DOMAIN = "notify.propopad.com";
const FROM_DOMAIN = "propopad.com";

async function sendInviteEmail(
  supabase: any,
  email: string,
  token: string,
  agencyName: string
) {
  // Build the accept-invite URL
  const siteUrl = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", "").replace("https://", "");
  const appUrl = "https://pixel-perfect-clone-5890.lovable.app";
  const confirmationUrl = `${appUrl}/accept-invite?token=${token}`;

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: appUrl,
    confirmationUrl,
  };

  const html = await renderAsync(React.createElement(InviteEmail, templateProps));
  const text = await renderAsync(React.createElement(InviteEmail, templateProps), {
    plainText: true,
  });

  const messageId = crypto.randomUUID();

  // Log pending
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: "team_invite",
    recipient_email: email,
    status: "pending",
    metadata: { agency_name: agencyName },
  });

  // Enqueue for async sending
  const { error: enqueueError } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: `You've been invited to join ${agencyName} on Propopad`,
      html,
      text,
      purpose: "transactional",
      idempotency_key: `team-invite-${token}-${Date.now()}`,
      label: "team_invite",
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("Failed to enqueue invite email", { error: enqueueError, email });
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "team_invite",
      recipient_email: email,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
  } else {
    console.log("Invite email enqueued", { email, messageId });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action, ...body } = await req.json();

    // ACTION: create-invite
    if (action === "create-invite") {
      const { agency_id, email, role, invited_by } = body;

      // Check plan limit
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency_id);

      const { count: pendingCount } = await supabase
        .from("team_invites")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agency_id)
        .eq("status", "pending");

      const { data: agency } = await supabase
        .from("agencies")
        .select("plan_id, name, trial_ends_at")
        .eq("id", agency_id)
        .single();

      const effectivePlanId = agency?.trial_ends_at && new Date(agency.trial_ends_at) > new Date()
        ? "pro"
        : (agency?.plan_id || "free");

      const { data: plan } = await supabase
        .from("plans")
        .select("max_users")
        .eq("id", effectivePlanId)
        .single();

      const totalUsers = (userCount || 0) + (pendingCount || 0);
      if (plan?.max_users && totalUsers >= plan.max_users) {
        return new Response(
          JSON.stringify({ error: `Your plan allows ${plan.max_users} team members. Upgrade to add more.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already in this agency
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .eq("agency_id", agency_id)
        .maybeSingle();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "This user is already a member of your team." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check pending invite
      const { data: existingInvite } = await supabase
        .from("team_invites")
        .select("id")
        .eq("agency_id", agency_id)
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        return new Response(
          JSON.stringify({ error: "An invite is already pending for this email." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate token
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();

      const { data: invite, error: insertErr } = await supabase
        .from("team_invites")
        .insert({
          agency_id,
          email,
          role: role || "member",
          invited_by,
          token,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Send invite email
      await sendInviteEmail(supabase, email, token, agency?.name || "your team");

      return new Response(
        JSON.stringify({ invite, agency_name: agency?.name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: accept-invite
    if (action === "accept-invite") {
      const { token, user_id } = body;

      const { data: invite, error: fetchErr } = await supabase
        .from("team_invites")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (fetchErr || !invite) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired invite." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(invite.expires_at) < new Date()) {
        await supabase
          .from("team_invites")
          .update({ status: "expired" })
          .eq("id", invite.id);
        return new Response(
          JSON.stringify({ error: "This invite has expired." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already belongs to another agency
      const { data: existingProfile } = await supabase
        .from("users")
        .select("agency_id")
        .eq("id", user_id)
        .single();

      if (existingProfile?.agency_id && existingProfile.agency_id !== invite.agency_id) {
        return new Response(
          JSON.stringify({
            error: "You're already a member of another agency. Leave your current agency first or use a different email.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user profile to join the agency
      const { error: updateErr } = await supabase
        .from("users")
        .update({
          agency_id: invite.agency_id,
          role: invite.role || "member",
        })
        .eq("id", user_id);

      if (updateErr) throw updateErr;

      // Mark invite as accepted
      await supabase
        .from("team_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      return new Response(
        JSON.stringify({ success: true, agency_id: invite.agency_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: resend-invite
    if (action === "resend-invite") {
      const { invite_id } = body;

      // Fetch the invite to get email and token
      const { data: invite } = await supabase
        .from("team_invites")
        .select("email, token, agency_id")
        .eq("id", invite_id)
        .eq("status", "pending")
        .single();

      if (!invite) {
        return new Response(
          JSON.stringify({ error: "Invite not found or already accepted." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reset expiry
      await supabase
        .from("team_invites")
        .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
        .eq("id", invite_id);

      // Get agency name for email
      const { data: agency } = await supabase
        .from("agencies")
        .select("name")
        .eq("id", invite.agency_id)
        .single();

      // Re-send the invite email
      await sendInviteEmail(supabase, invite.email, invite.token, agency?.name || "your team");

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: revoke-invite
    if (action === "revoke-invite") {
      const { invite_id } = body;
      await supabase
        .from("team_invites")
        .update({ status: "revoked" })
        .eq("id", invite_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: remove-member
    if (action === "remove-member") {
      const { user_id, agency_id } = body;
      
      const { data: targetUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", user_id)
        .single();

      if (targetUser?.role === "owner") {
        return new Response(
          JSON.stringify({ error: "Cannot remove the agency owner." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("users")
        .update({ agency_id: null, role: null })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: change-role
    if (action === "change-role") {
      const { user_id, new_role, requester_id } = body;

      if (new_role === "owner") {
        const { data: currentOwner } = await supabase
          .from("users")
          .select("id")
          .eq("id", requester_id)
          .eq("role", "owner")
          .single();

        if (!currentOwner) {
          return new Response(
            JSON.stringify({ error: "Only the current owner can transfer ownership." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("users")
          .update({ role: "admin" })
          .eq("id", requester_id);

        await supabase
          .from("users")
          .update({ role: "owner" })
          .eq("id", user_id);
      } else {
        const { data: target } = await supabase
          .from("users")
          .select("role")
          .eq("id", user_id)
          .single();

        if (target?.role === "owner") {
          return new Response(
            JSON.stringify({ error: "Cannot demote the owner. Transfer ownership first." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("users")
          .update({ role: new_role })
          .eq("id", user_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
