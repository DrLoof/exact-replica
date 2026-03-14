import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClients, useServiceModules, useServiceGroups, useBundles, useTimelinePhases } from '@/hooks/useAgencyData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SignupGate } from '@/components/onboarding/SignupGate';
import { defaultModulesByGroup, type DefaultModule } from '@/lib/defaultModules';
import { generateProposalTitle } from '@/lib/proposalTitleGenerator';
import { GenerationScreen } from '@/components/proposal-new/GenerationScreen';
import { ClientZone } from '@/components/proposal-new/ClientZone';
import { ServiceZone } from '@/components/proposal-new/ServiceZone';
import { TimelineZone } from '@/components/proposal-new/TimelineZone';

// Build virtual modules/groups from guest onboarding data
function buildGuestData(guestOnboarding: any) {
  const selectedKeys = new Set<string>(guestOnboarding.selectedModuleKeys || []);
  const groupNameMap: Record<string, string> = guestOnboarding.groupNameMap || {};
  
  const virtualModules: any[] = [];
  const virtualGroups: any[] = [];
  const groupSet = new Set<string>();

  for (const [groupName, mods] of Object.entries(defaultModulesByGroup)) {
    (mods as DefaultModule[]).forEach((mod, i) => {
      const key = `${groupName}-${i}`;
      if (!selectedKeys.has(key)) return;
      const id = `guest-${key}`;
      if (!groupSet.has(groupName)) {
        groupSet.add(groupName);
        virtualGroups.push({ id: `group-${groupName}`, name: groupName });
      }
      virtualModules.push({
        id,
        name: mod.name,
        short_description: mod.shortDesc,
        description: mod.description,
        pricing_model: mod.pricingModel,
        price_fixed: mod.pricingModel === 'fixed' ? mod.price : null,
        price_monthly: mod.pricingModel === 'monthly' ? mod.price : null,
        price_hourly: mod.pricingModel === 'hourly' ? mod.price : null,
        service_type: mod.serviceType,
        group_id: `group-${groupName}`,
        is_active: true,
        deliverables: mod.deliverables,
        default_timeline: mod.defaultTimeline,
      });
    });
  }
  return { virtualModules, virtualGroups };
}

export default function ProposalNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agency, userProfile, user } = useAuth();
  const isGuestMode = searchParams.get('guest') === 'true' && !agency;
  
  const guestOnboarding = useMemo(() => {
    if (!isGuestMode) return null;
    try {
      const raw = localStorage.getItem('propopad_guest_onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [isGuestMode]);

  const guestData = useMemo(() => guestOnboarding ? buildGuestData(guestOnboarding) : null, [guestOnboarding]);

  const { data: clients = [] } = useClients();
  const { data: dbModules = [] } = useServiceModules();
  const { data: dbGroups = [] } = useServiceGroups();
  const { data: dbBundles = [] } = useBundles();
  const { data: timelinePhases = [] } = useTimelinePhases();

  const modules = isGuestMode ? (guestData?.virtualModules || []) : dbModules;
  const groups = isGuestMode ? (guestData?.virtualGroups || []) : dbGroups;
  const bundles = isGuestMode ? [] : dbBundles;
  const currencySymbol = isGuestMode
    ? (guestOnboarding?.scrapeData?.detected_currency?.symbol || '$')
    : (agency?.currency_symbol || '$');

  // Client state
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [clientChallenge, setClientChallenge] = useState('');
  const [clientChallengeOther, setClientChallengeOther] = useState('');
  const [clientGoal, setClientGoal] = useState('');
  const [clientGoalOther, setClientGoalOther] = useState('');
  const [clientContextNote, setClientContextNote] = useState('');
  const [clientContext, setClientContext] = useState('');

  // Service state
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(() => {
    if (isGuestMode && guestData) {
      return new Set(guestData.virtualModules.map((m: any) => m.id));
    }
    const servicesParam = searchParams.get('services');
    if (servicesParam) return new Set(servicesParam.split(',').filter(Boolean));
    return new Set<string>();
  });
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(() => searchParams.get('bundle'));
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  // Timeline state
  const [showTimeline, setShowTimeline] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    return d.toISOString().split('T')[0];
  });

  const [saving, setSaving] = useState(false);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [showGenerating, setShowGenerating] = useState(false);

  // Pre-fill from query params
  const prefilledClientId = searchParams.get('client');
  const repeatMode = searchParams.get('repeat') === 'true';
  const initialBundleId = searchParams.get('bundle');

  useEffect(() => {
    if (initialBundleId && bundles.length > 0 && modules.length > 0) {
      const bundle = bundles.find((b: any) => b.id === initialBundleId);
      if (bundle) {
        const bundleModuleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id);
        setSelectedModuleIds(prev => {
          const next = new Set(prev);
          bundleModuleIds.forEach((id: string) => next.add(id));
          return next;
        });
      }
    }
  }, [initialBundleId, bundles.length, modules.length]);

  useEffect(() => {
    if (prefilledClientId && clients.length > 0 && !selectedClient) {
      const found = clients.find((c: any) => c.id === prefilledClientId);
      if (found) {
        setSelectedClient(found);
        if (repeatMode) loadLastProposalServices(prefilledClientId);
      }
    }
  }, [prefilledClientId, clients.length]);

  const loadLastProposalServices = async (clientId: string) => {
    const { data: lastProposal } = await supabase
      .from('proposals').select('id').eq('client_id', clientId)
      .order('created_at', { ascending: false }).limit(1).single();
    if (!lastProposal) return;
    const { data: svcData } = await supabase
      .from('proposal_services').select('module_id, price_override').eq('proposal_id', lastProposal.id);
    if (svcData && svcData.length > 0) {
      const ids = new Set(svcData.filter((s: any) => s.module_id).map((s: any) => s.module_id as string));
      setSelectedModuleIds(ids);
      const overrides: Record<string, number> = {};
      svcData.forEach((s: any) => { if (s.module_id && s.price_override != null) overrides[s.module_id] = s.price_override; });
      if (Object.keys(overrides).length > 0) setPriceOverrides(overrides);
      toast.success(`Pre-filled ${ids.size} services from last proposal`);
    }
  };

  // Service helpers
  const toggleModule = (id: string) => {
    setSelectedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBundleSelect = (bundleId: string) => {
    if (selectedBundleId === bundleId) {
      const bundle = bundles.find((b: any) => b.id === bundleId);
      if (bundle) {
        const bundleModuleIds = new Set((bundle.bundle_modules || []).map((bm: any) => bm.module_id));
        setSelectedModuleIds(prev => {
          const next = new Set(prev);
          bundleModuleIds.forEach(id => next.delete(id));
          return next;
        });
      }
      setSelectedBundleId(null);
    } else {
      const bundle = bundles.find((b: any) => b.id === bundleId);
      if (bundle) {
        const bundleModuleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id);
        setSelectedModuleIds(prev => {
          const next = new Set(prev);
          bundleModuleIds.forEach((id: string) => next.add(id));
          return next;
        });
      }
      setSelectedBundleId(bundleId);
    }
  };

  // Price calculations
  const selectedModulesList = modules.filter((m: any) => selectedModuleIds.has(m.id));
  const totalFixed = selectedModulesList
    .filter((m: any) => m.pricing_model === 'fixed')
    .reduce((sum: number, m: any) => sum + (priceOverrides[m.id] ?? m.price_fixed ?? 0), 0);
  const totalMonthly = selectedModulesList
    .filter((m: any) => m.pricing_model === 'monthly')
    .reduce((sum: number, m: any) => sum + (priceOverrides[m.id] ?? m.price_monthly ?? 0), 0);
  const totalHourly = selectedModulesList
    .filter((m: any) => m.pricing_model === 'hourly')
    .reduce((sum: number, m: any) => sum + (priceOverrides[m.id] ?? m.price_hourly ?? 0), 0);

  const selectedBundle = bundles.find((b: any) => b.id === selectedBundleId);
  const bundleSavings = selectedBundle?.savings_amount || 0;

  const bundleModuleIdSet = useMemo(() => {
    if (!selectedBundle) return new Set<string>();
    return new Set((selectedBundle.bundle_modules || []).map((bm: any) => bm.module_id));
  }, [selectedBundle]);
  const addonCount = selectedModulesList.filter((m: any) => !bundleModuleIdSet.has(m.id)).length;

  const hasClient = selectedClient || newClientName.trim();
  const hasServices = selectedModuleIds.size > 0;
  const canBuild = hasClient && hasServices;

  const totalStr = (() => {
    const parts: string[] = [];
    if (totalFixed > 0) parts.push(`${currencySymbol}${totalFixed.toLocaleString()}`);
    if (totalMonthly > 0) parts.push(`${currencySymbol}${totalMonthly.toLocaleString()}/mo`);
    if (totalFixed === 0 && totalMonthly === 0 && totalHourly > 0) parts.push(`${currencySymbol}${totalHourly.toLocaleString()}/hr`);
    return parts.join(' + ');
  })();

  const footerLabel = (() => {
    const clientDisplayName = selectedClient?.company_name || newClientName;
    if (!hasServices) return 'Select services to build a proposal';
    if (selectedBundle) {
      const base = `${selectedBundle.name} bundle`;
      return addonCount > 0 ? `${base} + ${addonCount} add-on${addonCount !== 1 ? 's' : ''} for ${clientDisplayName}` : `${base} for ${clientDisplayName}`;
    }
    return `${selectedModuleIds.size} service${selectedModuleIds.size !== 1 ? 's' : ''} for ${clientDisplayName}`;
  })();

  const phaseSummary = useMemo(() => {
    if (timelinePhases.length === 0) return null;
    const names = timelinePhases.map((p: any) => p.name.split(' ')[0]).join(' → ');
    const totalWeeks = timelinePhases.reduce((sum: number, p: any) => {
      const match = p.default_duration?.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 2);
    }, 0);
    return { names, totalWeeks };
  }, [timelinePhases]);

  const estimatedDuration = useMemo(() => {
    if (selectedModulesList.length === 0) return null;
    let totalWeeks = 0;
    selectedModulesList.forEach((m: any) => {
      const match = m.default_timeline?.match(/(\d+)/);
      totalWeeks += match ? parseInt(match[1]) : 2;
    });
    return `~${totalWeeks} weeks`;
  }, [selectedModulesList]);

  // === Build / Save Logic ===

  const createProposal = async (navigateToEditor: boolean) => {
    if (!agency || !canBuild) return;

    try {
      let clientId = selectedClient?.id;
      if (!clientId && newClientName.trim()) {
        const { data: newC, error } = await supabase.from('clients').insert({
          agency_id: agency.id,
          company_name: newClientName.trim(),
          contact_name: newContactName || null,
          website: newClientWebsite || null,
          notes: clientContext || null,
        } as any).select('id').single();
        if (error) throw error;
        clientId = newC.id;
      }

      const counter = (agency.proposal_counter || 0) + 1;
      const prefix = agency.proposal_prefix || 'PRO';
      const refNum = `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(4, '0')}`;

      const { data: realModules } = await supabase
        .from('service_modules').select('id, name, service_type, ai_context, group_id').eq('agency_id', agency.id);

      const selectedModsList = Array.from(selectedModuleIds).map(id => modules.find((m: any) => m.id === id)).filter(Boolean);

      let totalDurationWeeks = 0;
      selectedModsList.forEach((m: any) => {
        const match = m.default_timeline?.match(/(\d+)/);
        totalDurationWeeks += match ? parseInt(match[1]) : 2;
      });
      totalDurationWeeks = Math.max(totalDurationWeeks, 4);
      const durationStr = `${totalDurationWeeks} weeks`;

      const clientDisplayName = selectedClient?.company_name || newClientName;

      const selectedWithGroups = selectedModsList.map((mod: any) => {
        const group = groups.find((g: any) => g.id === mod.group_id);
        return { name: mod.name, groupName: group?.name || '' };
      });
      const generatedTitle = generateProposalTitle(selectedWithGroups, clientDisplayName, groups, {});

      // Generate executive summary
      let executiveSummary: string | null = null;
      const resolvedChallenge = clientChallenge === 'Other' ? clientChallengeOther : clientChallenge;
      const resolvedGoal = clientGoal === 'Other' ? clientGoalOther : clientGoal;
      try {
        const realSelectedModules = selectedModsList.map((m: any) => {
          const rm = realModules?.find((rm: any) => rm.name === m.name);
          return rm || m;
        });
        const { data: summaryData } = await supabase.functions.invoke('generate-executive-summary', {
          body: {
            agencyName: agency.name,
            clientName: clientDisplayName,
            serviceNames: realSelectedModules.map((m: any) => m.name),
            serviceContexts: realSelectedModules.map((m: any) => m.ai_context).filter(Boolean),
            clientChallenge: resolvedChallenge || null,
            clientGoal: resolvedGoal || null,
            clientContextNote: clientContextNote || null,
          },
        });
        if (summaryData?.summary) executiveSummary = summaryData.summary;
      } catch (e) {
        console.warn('Executive summary generation failed', e);
      }

      // Generate timeline
      let generatedPhases: any[] = [];
      try {
        const { data: timelineData } = await supabase.functions.invoke('generate-timeline', {
          body: {
            services: selectedModsList.map((m: any) => ({ name: m.name })),
            clientName: clientDisplayName,
            totalWeeks: totalDurationWeeks,
            customPhases: timelinePhases.length > 0 ? timelinePhases.map((p: any) => ({ name: p.name })) : null,
          },
        });
        if (timelineData?.phases) generatedPhases = timelineData.phases;
      } catch (e) {
        console.warn('Timeline generation failed, using defaults', e);
      }

      if (generatedPhases.length === 0) {
        const defaultNames = ['Discovery & Research', 'Strategy & Architecture', 'Creative Development', 'Build & Produce', 'Launch & Optimize'];
        const pcts = [0.12, 0.12, 0.31, 0.25, 0.20];
        let weekStart = 1;
        generatedPhases = defaultNames.map((name, i) => {
          const weeks = Math.max(1, Math.round(pcts[i] * totalDurationWeeks));
          const weekEnd = weekStart + weeks - 1;
          const duration = weekStart === weekEnd ? `WEEK ${weekStart}` : `WEEKS ${weekStart}–${weekEnd}`;
          const phase = { name, duration, description: '' };
          weekStart = weekEnd + 1;
          return phase;
        });
      }

      const startDateObj = new Date(startDate);
      const launchDate = new Date(startDateObj.getTime() + totalDurationWeeks * 7 * 86400000);

      const { data: proposal, error: pError } = await supabase.from('proposals').insert({
        agency_id: agency.id,
        client_id: clientId,
        reference_number: refNum,
        title: generatedTitle,
        subtitle: null,
        status: 'draft',
        total_fixed: totalFixed,
        total_monthly: totalMonthly,
        grand_total: totalFixed + totalMonthly,
        created_by: userProfile?.id,
        project_start_date: startDate,
        estimated_duration: durationStr,
        validity_days: agency.default_validity_days || 30,
        revision_rounds: agency.default_revision_rounds ?? 2,
        notice_period: agency.default_notice_period || '30 days',
        bundle_savings: bundleSavings,
        phases: generatedPhases,
        executive_summary: executiveSummary,
        client_challenge: resolvedChallenge || null,
        client_goal: resolvedGoal || null,
        client_context_note: clientContextNote || null,
        template_id: (agency as any).default_template || 'classic',
        custom_colors: agency.brand_color ? { primaryAccent: agency.brand_color } : null,
      } as any).select('id').single();
      if (pError) throw pError;

      const services = selectedModsList.map((mod: any, i: number) => {
        const realMod = realModules?.find((rm: any) => rm.name === mod.name);
        const override = priceOverrides[mod.id];
        return {
          proposal_id: proposal.id,
          module_id: realMod?.id || null,
          display_order: i,
          price_override: override !== undefined ? override : null,
          pricing_model_override: null,
          is_addon: (realMod?.service_type || mod.service_type) === 'addon',
          bundle_id: bundleModuleIdSet.has(mod.id) ? selectedBundleId : null,
        };
      }).filter((s: any) => s.module_id);

      if (services.length > 0) {
        await supabase.from('proposal_services').insert(services);
      }

      await supabase.from('agencies').update({ proposal_counter: counter }).eq('id', agency.id);

      toast.success(navigateToEditor ? 'Proposal created!' : 'Draft saved!');
      if (navigateToEditor) {
        navigate(`/proposals/${proposal.id}`);
      } else {
        navigate('/proposals');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save proposal');
    }
  };

  const handleBuild = async () => {
    if (isGuestMode && !user) {
      const selectedMods = modules.filter((m: any) => selectedModuleIds.has(m.id));
      const clientDisplayName = selectedClient?.company_name || newClientName || 'Client';
      const agencyName = guestOnboarding?.agencyIdentity?.name || 'Your Agency';

      setShowGenerating(true);
      setSaving(true);

      let executiveSummary: string | null = null;
      const resolvedChallenge = clientChallenge === 'Other' ? clientChallengeOther : clientChallenge;
      const resolvedGoal = clientGoal === 'Other' ? clientGoalOther : clientGoal;
      try {
        const { data: summaryData } = await supabase.functions.invoke('generate-executive-summary', {
          body: {
            agencyName,
            clientName: clientDisplayName,
            serviceNames: selectedMods.map((m: any) => m.name),
            serviceContexts: selectedMods.map((m: any) => m.ai_context).filter(Boolean),
            clientChallenge: resolvedChallenge || null,
            clientGoal: resolvedGoal || null,
            clientContextNote: clientContextNote || null,
          },
        });
        if (summaryData?.summary) executiveSummary = summaryData.summary;
      } catch (e) {
        console.warn('Guest executive summary generation failed', e);
      }

      const selectedWithGroups = selectedMods.map((mod: any) => {
        const group = groups.find((g: any) => g.id === mod.group_id);
        return { name: mod.name, groupName: group?.name || '' };
      });
      const generatedTitle = generateProposalTitle(selectedWithGroups, clientDisplayName, groups, {});

      const guestProposal = {
        clientName: clientDisplayName,
        contactName: selectedClient?.contact_name || newContactName || '',
        clientWebsite: newClientWebsite || '',
        clientContext: clientContext || '',
        services: selectedMods.map((m: any) => ({
          ...m,
          priceOverride: priceOverrides[m.id] ?? null,
        })),
        startDate,
        totalFixed,
        totalMonthly,
        currencySymbol,
        executiveSummary,
        title: generatedTitle,
        clientChallenge: resolvedChallenge || null,
        clientGoal: resolvedGoal || null,
        clientContextNote: clientContextNote || null,
      };
      localStorage.setItem('propopad_guest_proposal', JSON.stringify(guestProposal));

      await new Promise(r => setTimeout(r, 3500));
      setSaving(false);
      setShowGenerating(false);
      navigate('/proposals/preview');
      return;
    }
    setShowGenerating(true);
    setSaving(true);
    setTimeout(() => {
      createProposal(true).finally(() => {
        setSaving(false);
        setShowGenerating(false);
      });
    }, 3500);
  };

  const handleSaveDraft = () => {
    if (isGuestMode && !user) {
      handleBuild();
      return;
    }
    setSaving(true);
    createProposal(false).finally(() => setSaving(false));
  };

  // Post-signup migration
  const handlePostSignupBuild = async () => {
    setShowSignupGate(false);
    setSaving(true);

    try {
      let retries = 0;
      const waitForAgency = async (): Promise<any> => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return null;
        const { data: profile } = await supabase.from('users').select('agency_id').eq('id', currentUser.id).single();
        if (profile?.agency_id) {
          const { data: ag } = await supabase.from('agencies').select('*').eq('id', profile.agency_id).single();
          return ag;
        }
        if (retries < 15) {
          retries++;
          await new Promise(r => setTimeout(r, 500));
          return waitForAgency();
        }
        return null;
      };

      const freshAgency = await waitForAgency();
      if (!freshAgency) {
        toast.error('Could not set up your agency. Please try again.');
        setSaving(false);
        return;
      }

      if (guestOnboarding) {
        const { getDefaultModulesForGroup } = await import('@/lib/defaultModules');
        const identity = guestOnboarding.agencyIdentity || {};
        const groupNameMap = guestOnboarding.groupNameMap || {};
        const selectedKeys = new Set<string>(guestOnboarding.selectedModuleKeys || []);

        await supabase.from('agencies').update({
          name: identity.name || freshAgency.name,
          email: identity.email || null,
          phone: identity.phone || null,
          logo_url: identity.logo_url || null,
          brand_color: identity.brand_color || '#E8825C',
          tagline: identity.tagline || null,
          address_line1: identity.address || null,
          about_text: identity.about_text || null,
          scraped_data: guestOnboarding.scrapeData || null,
          scrape_status: guestOnboarding.scrapeData ? 'complete' : 'manual',
          scraped_at: guestOnboarding.scrapeData ? new Date().toISOString() : null,
          currency: guestOnboarding.scrapeData?.detected_currency?.code || 'USD',
          currency_symbol: guestOnboarding.scrapeData?.detected_currency?.symbol || '$',
          default_validity_days: 30,
          default_revision_rounds: 2,
          default_notice_period: '30 days',
          proposal_prefix: (identity.name || freshAgency.name || 'AGY').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
          onboarding_complete: true,
          onboarding_step: 7,
        } as any).eq('id', freshAgency.id);

        const matchedGroupNames = [...new Set(
          [...selectedKeys].map(key => key.replace(/-\d+$/, ''))
        )];
        const modulesToInsert = matchedGroupNames.flatMap(groupName => {
          const groupId = Object.entries(groupNameMap).find(([_, name]) => name === groupName)?.[0];
          if (!groupId) return [];
          return getDefaultModulesForGroup(groupName)
            .filter((_, i) => selectedKeys.has(`${groupName}-${i}`))
            .map((mod, i) => ({
              agency_id: freshAgency.id,
              group_id: groupId,
              name: mod.name,
              description: mod.description || null,
              short_description: mod.shortDesc,
              pricing_model: mod.pricingModel,
              price_fixed: mod.pricingModel === 'fixed' ? mod.price : null,
              price_monthly: mod.pricingModel === 'monthly' ? mod.price : null,
              price_hourly: mod.pricingModel === 'hourly' ? mod.price : null,
              service_type: mod.serviceType || 'core',
              deliverables: mod.deliverables || [],
              client_responsibilities: mod.clientResponsibilities || [],
              out_of_scope: mod.outOfScope || [],
              default_timeline: mod.defaultTimeline || null,
              suggested_kpis: mod.suggestedKpis || [],
              common_tools: mod.commonTools || [],
              is_active: true,
              display_order: i,
            }));
        });
        if (modulesToInsert.length > 0) {
          await supabase.from('service_modules').delete().eq('agency_id', freshAgency.id);
          await supabase.from('service_modules').insert(modulesToInsert);
        }

        const testimonials = guestOnboarding.testimonials || [];
        if (testimonials.length > 0) {
          await supabase.from('testimonials').insert(testimonials.map((t: any) => ({
            agency_id: freshAgency.id,
            quote: t.quote,
            client_name: t.client_name || 'Client',
            client_title: t.client_title || null,
            client_company: t.client_company || null,
            metric_value: t.metric_value || null,
            metric_label: t.metric_label || null,
            source: 'scraped',
          })));
        }

        const differentiators = guestOnboarding.differentiators || [];
        if (differentiators.length > 0) {
          await supabase.from('differentiators').delete().eq('agency_id', freshAgency.id);
          await supabase.from('differentiators').insert(differentiators.map((d: any, i: number) => ({
            agency_id: freshAgency.id,
            title: d.title,
            description: d.description,
            stat_value: d.stat_value,
            stat_label: d.stat_label,
            icon: d.icon || 'Target',
            display_order: i + 1,
            source: d.source || 'generated',
          })));
        }

        const { data: existingTerms } = await supabase.from('terms_clauses').select('id').eq('agency_id', freshAgency.id);
        if (!existingTerms?.length) {
          await supabase.from('terms_clauses').insert([
            { title: 'Payment Terms', content: 'All fees are due according to the payment schedule outlined in the Investment section of this proposal.', display_order: 1 },
            { title: 'Project Timeline & Milestones', content: 'The project timeline outlined in this proposal is an estimate based on the defined scope of work.', display_order: 2 },
            { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable.', display_order: 3 },
            { title: 'Intellectual Property', content: 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables.', display_order: 4 },
            { title: 'Confidentiality', content: 'Both parties agree to keep confidential any proprietary or sensitive information shared during this engagement.', display_order: 5 },
            { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified in the notice period above.', display_order: 6 },
            { title: 'Liability', content: "The agency's total liability shall not exceed the total fees paid by the client.", display_order: 7 },
            { title: 'Governing Law', content: 'This agreement shall be governed by the laws of the jurisdiction where the agency is registered.', display_order: 8 },
          ].map(t => ({ ...t, agency_id: freshAgency.id, is_default: true })));
        }

        const { data: existingPT } = await supabase.from('payment_templates').select('id').eq('agency_id', freshAgency.id);
        if (!existingPT?.length) {
          await supabase.from('payment_templates').insert([
            { agency_id: freshAgency.id, name: 'Equal Thirds', milestones: [{ label: 'Start', percentage: 33 }, { label: 'Midpoint', percentage: 33 }, { label: 'Delivery', percentage: 34 }], is_default: true },
            { agency_id: freshAgency.id, name: '50/50', milestones: [{ label: 'Upfront', percentage: 50 }, { label: 'Completion', percentage: 50 }], is_default: false },
          ]);
        }

        const { data: existingPhases } = await supabase.from('timeline_phases').select('id').eq('agency_id', freshAgency.id);
        if (!existingPhases?.length) {
          await supabase.from('timeline_phases').insert([
            { agency_id: freshAgency.id, name: 'Discovery & Research', default_duration: '1-2 weeks', description: 'Understanding your business, audience, and goals.', display_order: 1 },
            { agency_id: freshAgency.id, name: 'Strategy & Architecture', default_duration: '2-3 weeks', description: 'Defining the roadmap and project architecture.', display_order: 2 },
            { agency_id: freshAgency.id, name: 'Creative Development', default_duration: '3-4 weeks', description: 'Design concepts, content creation, and iteration.', display_order: 3 },
            { agency_id: freshAgency.id, name: 'Build & Produce', default_duration: '2-3 weeks', description: 'Development, production, and quality assurance.', display_order: 4 },
            { agency_id: freshAgency.id, name: 'Launch & Optimize', default_duration: '1-2 weeks', description: 'Go live, monitor, and optimize performance.', display_order: 5 },
          ]);
        }

        localStorage.removeItem('propopad_guest_onboarding');
      }

      toast.success('Account created! Building your proposal...');
      window.location.href = '/proposals/new';
    } catch (e: any) {
      console.error('Post-signup error:', e);
      toast.error('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  if (showGenerating) {
    return <GenerationScreen clientName={selectedClient?.company_name || newClientName || 'Client'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-display text-base font-semibold text-foreground">New Proposal</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving || !hasClient}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={handleBuild}
            disabled={!canBuild || saving}
            className="flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? 'Building...' : 'Build Proposal'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-8">
        <ClientZone
          isGuestMode={isGuestMode}
          clients={clients}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          newClientName={newClientName}
          setNewClientName={setNewClientName}
          newContactName={newContactName}
          setNewContactName={setNewContactName}
          newClientWebsite={newClientWebsite}
          setNewClientWebsite={setNewClientWebsite}
          clientChallenge={clientChallenge}
          setClientChallenge={setClientChallenge}
          clientChallengeOther={clientChallengeOther}
          setClientChallengeOther={setClientChallengeOther}
          clientGoal={clientGoal}
          setClientGoal={setClientGoal}
          clientGoalOther={clientGoalOther}
          setClientGoalOther={setClientGoalOther}
          clientContextNote={clientContextNote}
          setClientContextNote={setClientContextNote}
        />

        <ServiceZone
          modules={modules}
          groups={groups}
          bundles={bundles}
          selectedModuleIds={selectedModuleIds}
          toggleModule={toggleModule}
          selectedBundleId={selectedBundleId}
          handleBundleSelect={handleBundleSelect}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          priceOverrides={priceOverrides}
          setPriceOverrides={setPriceOverrides}
          currencySymbol={currencySymbol}
          bundleModuleIdSet={bundleModuleIdSet}
          selectedBundle={selectedBundle}
          totalStr={totalStr}
          bundleSavings={bundleSavings}
          addonCount={addonCount}
        />

        <TimelineZone
          showTimeline={showTimeline}
          setShowTimeline={setShowTimeline}
          startDate={startDate}
          setStartDate={setStartDate}
          hasServices={hasServices}
          estimatedDuration={estimatedDuration}
          phaseSummary={phaseSummary}
          timelinePhases={timelinePhases}
        />
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 border-t border-parchment bg-card/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{footerLabel}</p>
            {hasServices && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold tabular-nums text-foreground">{totalStr}</p>
                {bundleSavings > 0 && (
                  <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-[10px] font-medium text-status-success">
                    Save {currencySymbol}{bundleSavings.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleBuild}
            disabled={!canBuild || saving}
            className="flex items-center gap-2 rounded-[10px] bg-primary px-7 py-3 text-[14px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? 'Building...' : 'Build Proposal'}
          </button>
        </div>
      </div>

      {/* Signup Gate Modal for guest users */}
      {showSignupGate && (
        <SignupGate
          onAuthenticated={handlePostSignupBuild}
          onCancel={() => setShowSignupGate(false)}
        />
      )}
    </div>
  );
}
