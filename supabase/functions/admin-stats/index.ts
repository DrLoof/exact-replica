import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Service role client for cross-agency reads
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify is_admin
    const { data: profile } = await admin.from("users").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Run all queries in parallel
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      agenciesRes,
      usersRes,
      proposalsRes,
      proposalServicesRes,
      feedbackRes,
      apiCallsRes,
      modulesRes,
    ] = await Promise.all([
      admin.from("agencies").select("id, name, website, created_at, onboarding_complete, onboarding_step, scrape_status, scraped_at, logo_url"),
      admin.from("users").select("id, email, full_name, agency_id, created_at"),
      admin.from("proposals").select("id, agency_id, status, template_id, grand_total, total_fixed, total_monthly, created_at, sent_at, viewed_at, accepted_at, declined_at, signed_at, is_locked"),
      admin.from("proposal_services").select("id, proposal_id, module_id, bundle_id"),
      admin.from("feedback").select("*").order("created_at", { ascending: false }),
      admin.from("api_calls").select("*").order("created_at", { ascending: false }).limit(500),
      admin.from("service_modules").select("id, name, agency_id"),
    ]);

    const agencies = agenciesRes.data || [];
    const users = usersRes.data || [];
    const proposals = proposalsRes.data || [];
    const proposalServices = proposalServicesRes.data || [];
    const feedback = feedbackRes.data || [];
    const apiCalls = apiCallsRes.data || [];
    const modules = modulesRes.data || [];

    // === OVERVIEW METRICS ===
    const totalAgencies = agencies.length;

    // Active this week: agencies with proposals created/updated in last 7 days
    const proposalsThisWeek = proposals.filter(p => new Date(p.created_at) >= weekAgo);
    const activeAgencyIds = new Set(proposalsThisWeek.map(p => p.agency_id));
    const activeThisWeek = activeAgencyIds.size;

    const proposalsPrevWeek = proposals.filter(p => {
      const d = new Date(p.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const onboardingComplete = agencies.filter(a => a.onboarding_complete).length;
    const totalProposals = proposals.length;

    // === FUNNEL ===
    const startedOnboarding = agencies.filter(a => a.scrape_status !== null).length;
    const completedScan = agencies.filter(a => a.scrape_status === "complete").length;
    const completedOnboarding = onboardingComplete;
    const agenciesWithProposals = new Set(proposals.map(p => p.agency_id)).size;
    const sentStatuses = ["sent", "viewed", "accepted"];
    const agenciesSent = new Set(proposals.filter(p => sentStatuses.includes(p.status)).map(p => p.agency_id)).size;
    const totalUsers = users.length;
    
    // Agencies with 2+ proposals
    const proposalCountByAgency: Record<string, number> = {};
    proposals.forEach(p => {
      if (p.agency_id) proposalCountByAgency[p.agency_id] = (proposalCountByAgency[p.agency_id] || 0) + 1;
    });
    const agenciesWithMultiple = Object.values(proposalCountByAgency).filter(c => c >= 2).length;

    const funnel = [
      { label: "Started onboarding", count: startedOnboarding },
      { label: "Completed website scan", count: completedScan },
      { label: "Completed onboarding", count: completedOnboarding },
      { label: "Created first proposal", count: agenciesWithProposals },
      { label: "Sent/shared a proposal", count: agenciesSent },
      { label: "Created account (signed up)", count: totalUsers },
      { label: "Created second proposal", count: agenciesWithMultiple },
      { label: "Upgraded to paid", count: 0 },
    ];

    // === USERS TABLE ===
    // Join agencies with their proposal counts and user info
    const recentAgencies = agencies
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map(a => {
        const agencyProposals = proposals.filter(p => p.agency_id === a.id);
        const lastActivity = agencyProposals.length > 0
          ? agencyProposals.reduce((max, p) => {
              const d = new Date(p.created_at).getTime();
              return d > max ? d : max;
            }, 0)
          : new Date(a.created_at).getTime();

        let status = "New";
        const createdAt = new Date(a.created_at);
        if (now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000) {
          status = "New";
        } else if (!a.onboarding_complete && now.getTime() - createdAt.getTime() > 48 * 60 * 60 * 1000) {
          status = "Stalled";
        } else if (a.onboarding_complete && now.getTime() - lastActivity > 7 * 24 * 60 * 60 * 1000) {
          status = "Inactive";
        } else if (a.onboarding_complete) {
          status = "Active";
        }

        return {
          ...a,
          proposal_count: agencyProposals.length,
          status,
          last_activity: new Date(lastActivity).toISOString(),
        };
      });

    // === AGENCY GROWTH (daily cumulative) ===
    const growthData: { date: string; count: number }[] = [];
    const sortedAgencies = [...agencies].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let cumulative = 0;
    const dailyCounts: Record<string, number> = {};
    sortedAgencies.forEach(a => {
      const day = new Date(a.created_at).toISOString().slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    const allDays = Object.keys(dailyCounts).sort();
    allDays.forEach(day => {
      cumulative += dailyCounts[day];
      growthData.push({ date: day, count: cumulative });
    });

    // === PROPOSALS STATS ===
    const templateCounts: Record<string, number> = {};
    proposals.forEach(p => {
      const t = p.template_id || "classic";
      templateCounts[t] = (templateCounts[t] || 0) + 1;
    });

    const statusCounts: Record<string, number> = {};
    proposals.forEach(p => {
      const s = p.status || "draft";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const sentProposals = proposals.filter(p => sentStatuses.includes(p.status) || p.sent_at);
    const acceptedProposals = proposals.filter(p => p.status === "accepted" || p.accepted_at);
    const avgValue = proposals.length > 0
      ? proposals.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0) / proposals.length
      : 0;
    const totalPipeline = proposals.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);

    // Top services
    const moduleCounts: Record<string, { count: number; agencies: Set<string>; name: string }> = {};
    proposalServices.forEach(ps => {
      if (!ps.module_id) return;
      const mod = modules.find(m => m.id === ps.module_id);
      const proposal = proposals.find(p => p.id === ps.proposal_id);
      if (!moduleCounts[ps.module_id]) {
        moduleCounts[ps.module_id] = { count: 0, agencies: new Set(), name: mod?.name || "Unknown" };
      }
      moduleCounts[ps.module_id].count++;
      if (proposal?.agency_id) moduleCounts[ps.module_id].agencies.add(proposal.agency_id);
    });

    const topServices = Object.entries(moduleCounts)
      .map(([id, data]) => ({ id, name: data.name, proposals: data.count, agencies: data.agencies.size }))
      .sort((a, b) => b.proposals - a.proposals)
      .slice(0, 10);

    // Avg services per proposal
    const servicesPerProposal: Record<string, number> = {};
    proposalServices.forEach(ps => {
      if (ps.proposal_id) servicesPerProposal[ps.proposal_id] = (servicesPerProposal[ps.proposal_id] || 0) + 1;
    });
    const avgServices = proposals.length > 0
      ? Object.values(servicesPerProposal).reduce((s, v) => s + v, 0) / proposals.length
      : 0;

    const bundleProposals = new Set(proposalServices.filter(ps => ps.bundle_id).map(ps => ps.proposal_id)).size;

    // === SYSTEM ===
    const tableCounts = {
      agencies: agencies.length,
      users: users.length,
      proposals: proposals.length,
      proposal_services: proposalServices.length,
      feedback: feedback.length,
      api_calls: apiCalls.length,
      modules: modules.length,
    };

    const recentApiCalls = apiCalls.filter(c => new Date(c.created_at) >= dayAgo);
    const failedScans = agencies.filter(a => a.scrape_status === "failed" && a.scraped_at && new Date(a.scraped_at) >= dayAgo).length;
    const failedApiCalls = recentApiCalls.filter(c => c.status === "error").length;
    const successApiCalls = recentApiCalls.filter(c => c.status === "success");
    const avgDuration = successApiCalls.length > 0
      ? successApiCalls.reduce((s, c) => s + (c.duration_ms || 0), 0) / successApiCalls.length
      : 0;

    return new Response(JSON.stringify({
      overview: {
        totalAgencies,
        activeThisWeek,
        activePercentage: totalAgencies > 0 ? Math.round((activeThisWeek / totalAgencies) * 100) : 0,
        onboardingComplete,
        onboardingPercentage: totalAgencies > 0 ? Math.round((onboardingComplete / totalAgencies) * 100) : 0,
        totalProposals,
        proposalsThisWeek: proposalsThisWeek.length,
        proposalsPrevWeek: proposalsPrevWeek.length,
        payingUsers: 0,
      },
      funnel,
      recentAgencies,
      growthData,
      proposals: {
        total: totalProposals,
        thisWeek: proposalsThisWeek.length,
        avgPerAgency: totalAgencies > 0 ? (totalProposals / totalAgencies).toFixed(1) : "0",
        templateCounts,
        statusCounts,
        avgServices: avgServices.toFixed(1),
        bundlePercentage: totalProposals > 0 ? Math.round((bundleProposals / totalProposals) * 100) : 0,
        sentCount: sentProposals.length,
        sentPercentage: totalProposals > 0 ? Math.round((sentProposals.length / totalProposals) * 100) : 0,
        acceptedCount: acceptedProposals.length,
        acceptedPercentage: sentProposals.length > 0 ? Math.round((acceptedProposals.length / sentProposals.length) * 100) : 0,
        avgValue: Math.round(avgValue),
        totalPipeline: Math.round(totalPipeline),
        topServices,
      },
      feedback: feedback,
      system: {
        tableCounts,
        totalRows: Object.values(tableCounts).reduce((s, v) => s + v, 0),
        apiCalls24h: recentApiCalls.length,
        failedScans,
        failedApiCalls,
        avgDurationMs: Math.round(avgDuration),
        lastApiCall: apiCalls.length > 0 ? apiCalls[0].created_at : null,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
