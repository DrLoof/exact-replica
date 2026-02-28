import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, X, Check, ChevronDown, ChevronUp, CalendarDays, Sparkles, RotateCcw, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useClients, useServiceModules, useServiceGroups, useBundles, useTimelinePhases } from '@/hooks/useAgencyData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SignupGate } from '@/components/onboarding/SignupGate';
import { defaultModulesByGroup, type DefaultModule } from '@/lib/defaultModules';
import { defaultBundles, calculateBundlePricing } from '@/lib/defaultBundles';

function InlinePrice({ value, onChange, currencySymbol, suffix, isOverridden, onReset }: {
  value: number;
  onChange: (v: number) => void;
  currencySymbol: string;
  suffix: string;
  isOverridden: boolean;
  onReset: () => void;
}) {
  // ... keep existing code (InlinePrice component)
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = parseFloat(draft);
          if (!isNaN(num) && num >= 0) onChange(num);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-20 rounded border border-brand bg-background px-1.5 py-0.5 text-right text-sm tabular-nums text-foreground focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className="relative cursor-pointer text-sm font-medium tabular-nums text-foreground hover:text-brand"
      onClick={(e) => {
        e.stopPropagation();
        setDraft(String(value));
        setEditing(true);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isOverridden) onReset();
      }}
      title={isOverridden ? 'Double-click to reset to default' : 'Click to edit price'}
    >
      {isOverridden && (
        <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-status-warning" />
      )}
      {currencySymbol}{value.toLocaleString()}{suffix}
    </span>
  );
}

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
  
  // Load guest onboarding data from localStorage
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

  // Zone 1: Client
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [clientContext, setClientContext] = useState('');
  const [showClientContext, setShowClientContext] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [scraping, setScraping] = useState(false);

  const handleAutoFill = async () => {
    if (!newClientWebsite.trim()) return;
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url: newClientWebsite.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setScraping(false); return; }
      if (data?.name && !newClientName) {
        setNewClientName(data.name);
        setClientSearch(data.name);
      }
      if (data?.email && !newContactName) {
        // Use contact info if available
      }
      const contextParts: string[] = [];
      if (data?.tagline) contextParts.push(data.tagline);
      if (data?.detected_services?.length > 0) contextParts.push(`Services detected: ${data.detected_services.join(', ')}`);
      if (contextParts.length > 0 && !clientContext) {
        setClientContext(contextParts.join('\n'));
        setShowClientContext(true);
      }
      toast.success(`Auto-filled ${data?.fields_found || 0} fields from website`);
    } catch (e: any) {
      toast.error('Failed to scan website');
    }
    setScraping(false);
  };

  // Zone 2: Services - pre-fill from query params or guest data
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(() => {
    if (isGuestMode && guestData) {
      return new Set(guestData.virtualModules.map((m: any) => m.id));
    }
    const servicesParam = searchParams.get('services');
    return servicesParam ? new Set(servicesParam.split(',').filter(Boolean)) : new Set();
  });
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(() => searchParams.get('bundle'));
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  // Zone 3: Timeline
  const [showTimeline, setShowTimeline] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    return d.toISOString().split('T')[0];
  });

  const [saving, setSaving] = useState(false);
  const [showSignupGate, setShowSignupGate] = useState(false);

  // Pre-fill client from query param
  const prefilledClientId = searchParams.get('client');
  const repeatMode = searchParams.get('repeat') === 'true';

  useEffect(() => {
    if (prefilledClientId && clients.length > 0 && !selectedClient) {
      const found = clients.find((c: any) => c.id === prefilledClientId);
      if (found) {
        setSelectedClient(found);
        if (repeatMode) {
          loadLastProposalServices(prefilledClientId);
        }
      }
    }
  }, [prefilledClientId, clients.length]);

  const loadLastProposalServices = async (clientId: string) => {
    const { data: lastProposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!lastProposal) return;
    const { data: svcData } = await supabase
      .from('proposal_services')
      .select('module_id, price_override')
      .eq('proposal_id', lastProposal.id);
    if (svcData && svcData.length > 0) {
      const ids = new Set(svcData.filter((s: any) => s.module_id).map((s: any) => s.module_id as string));
      setSelectedModuleIds(ids);
      const overrides: Record<string, number> = {};
      svcData.forEach((s: any) => { if (s.module_id && s.price_override != null) overrides[s.module_id] = s.price_override; });
      if (Object.keys(overrides).length > 0) setPriceOverrides(overrides);
      toast.success(`Pre-filled ${ids.size} services from last proposal`);
    }
  };

  // Client search filtering
  const filteredClients = clientSearch.length > 0
    ? clients.filter((c: any) => c.company_name.toLowerCase().includes(clientSearch.toLowerCase()))
    : [];

  // Group modules by service group
  const groupedModules = useMemo(() =>
    groups.map((g: any) => ({
      ...g,
      modules: modules.filter((m: any) => m.group_id === g.id),
    })).filter((g: any) => g.modules.length > 0),
  [groups, modules]);

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

  const hasClient = selectedClient || newClientName.trim();
  const hasServices = selectedModuleIds.size > 0;
  const canBuild = hasClient && hasServices;

  const getModulePrice = (m: any) => priceOverrides[m.id] ?? m.price_fixed ?? m.price_monthly ?? m.price_hourly ?? 0;
  const getModuleDefaultPrice = (m: any) => m.price_fixed ?? m.price_monthly ?? m.price_hourly ?? 0;
  const priceSuffix: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

  // Phase summary for timeline
  const phaseSummary = useMemo(() => {
    if (timelinePhases.length === 0) return null;
    const names = timelinePhases.map((p: any) => p.name.split(' ')[0]).join(' → ');
    const totalWeeks = timelinePhases.reduce((sum: number, p: any) => {
      const match = p.default_duration?.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 2);
    }, 0);
    return { names, totalWeeks };
  }, [timelinePhases]);

  // Get bundle included modules
  const getBundleModuleNames = (bundle: any) => {
    const moduleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id);
    return modules
      .filter((m: any) => moduleIds.includes(m.id))
      .map((m: any) => m.name);
  };

  const createProposal = async (navigateToEditor: boolean) => {
    if (!agency || !canBuild) return;
    setSaving(true);

    try {
      let clientId = selectedClient?.id;
      if (!clientId && newClientName.trim()) {
        const { data: newC, error } = await supabase.from('clients').insert({
          agency_id: agency.id,
          company_name: newClientName.trim(),
          contact_name: newContactName || null,
          website: newClientWebsite || null,
          notes: clientContext || null,
        }).select('id').single();
        if (error) throw error;
        clientId = newC.id;
      }

      const counter = (agency.proposal_counter || 0) + 1;
      const prefix = agency.proposal_prefix || 'PRO';
      const refNum = `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(4, '0')}`;

      // Get real module IDs (for guest mode, we need to match by name)
      const { data: realModules } = await supabase
        .from('service_modules')
        .select('id, name, service_type')
        .eq('agency_id', agency.id);

      const selectedModsList = Array.from(selectedModuleIds).map(id => modules.find((m: any) => m.id === id)).filter(Boolean);

      const { data: proposal, error: pError } = await supabase.from('proposals').insert({
        agency_id: agency.id,
        client_id: clientId,
        reference_number: refNum,
        title: `Proposal for ${selectedClient?.company_name || newClientName}`,
        status: 'draft',
        total_fixed: totalFixed,
        total_monthly: totalMonthly,
        grand_total: totalFixed + totalMonthly,
        created_by: userProfile?.id,
        project_start_date: startDate,
        validity_days: agency.default_validity_days || 30,
        revision_rounds: agency.default_revision_rounds ?? 2,
        notice_period: agency.default_notice_period || '30 days',
      }).select('id').single();
      if (pError) throw pError;

      const services = selectedModsList.map((mod: any, i: number) => {
        // Match guest virtual module to real DB module by name
        const realMod = realModules?.find((rm: any) => rm.name === mod.name);
        const override = priceOverrides[mod.id];
        return {
          proposal_id: proposal.id,
          module_id: realMod?.id || null,
          display_order: i,
          price_override: override !== undefined ? override : null,
          pricing_model_override: null,
          is_addon: (realMod?.service_type || mod.service_type) === 'addon',
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
    setSaving(false);
  };

  const handleBuild = () => {
    // Guest mode: require signup before building
    if (isGuestMode && !user) {
      setShowSignupGate(true);
      return;
    }
    createProposal(true);
  };

  const handleSaveDraft = () => {
    if (isGuestMode && !user) {
      setShowSignupGate(true);
      return;
    }
    createProposal(false);
  };

  // After signup in guest mode, persist onboarding data then create proposal
  const handlePostSignupBuild = async () => {
    setShowSignupGate(false);
    setSaving(true);

    try {
      // Wait for agency to be created by signup trigger
      let retries = 0;
      const waitForAgency = async (): Promise<any> => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return null;
        const { data: profile } = await supabase
          .from('users')
          .select('agency_id')
          .eq('id', currentUser.id)
          .single();
        if (profile?.agency_id) {
          const { data: ag } = await supabase
            .from('agencies')
            .select('*')
            .eq('id', profile.agency_id)
            .single();
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

      // Now persist all onboarding data (same logic as OnboardingWizard.handleFinishWithAgency)
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

        // Save modules
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

        // Save testimonials
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

        // Save differentiators
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

        // Save default terms, payment templates, timeline phases
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

        // Clear guest data
        localStorage.removeItem('propopad_guest_onboarding');
      }

      // Now reload and navigate to proposals/new as authenticated user
      toast.success('Account created! Building your proposal...');
      window.location.href = '/proposals/new';
    } catch (e: any) {
      console.error('Post-signup error:', e);
      toast.error('Failed to save. Please try again.');
      setSaving(false);
    }
  };

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
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? 'Building...' : 'Build Proposal'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-8">
        {/* Zone 1: Client */}
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">Who is this proposal for?</p>

          {selectedClient ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {selectedClient.company_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{selectedClient.company_name}</p>
                {selectedClient.contact_name && (
                  <p className="text-xs text-muted-foreground">{selectedClient.contact_name}{selectedClient.contact_email ? ` · ${selectedClient.contact_email}` : ''}</p>
                )}
              </div>
              <button onClick={() => { setSelectedClient(null); setClientSearch(''); }} className="text-xs text-brand hover:text-brand-hover">Change</button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isGuestMode ? "Type the company name for your first proposal..." : "Search existing clients or type a new company name..."}
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setNewClientName(e.target.value); setShowClientDropdown(true); }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {showClientDropdown && clientSearch.length > 0 && filteredClients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                    {filteredClients.slice(0, 5).map((c: any) => (
                      <button
                        key={c.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setSelectedClient(c); setShowClientDropdown(false); setClientSearch(''); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                          {c.company_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.company_name}</p>
                          {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-border px-4 py-2">
                      <button onMouseDown={(e) => e.preventDefault()} onClick={() => setShowClientDropdown(false)} className="text-xs text-brand hover:text-brand-hover">
                        Create "{clientSearch}" as new client
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* New client fields — always visible when typing */}
              {clientSearch && !selectedClient && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Contact Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                    />
                    <div className="relative">
                      <input
                        placeholder="Client Website URL"
                        value={newClientWebsite}
                        onChange={(e) => setNewClientWebsite(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                      />
                      {newClientWebsite.trim() && (
                        <button
                          type="button"
                          onClick={handleAutoFill}
                          disabled={scraping}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md bg-brand/10 px-2 py-1 text-[10px] font-medium text-brand hover:bg-brand/20 disabled:opacity-50"
                        >
                          {scraping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                          {scraping ? 'Scanning...' : 'Auto-fill'}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClientContext(!showClientContext)}
                    className="text-xs text-brand hover:text-brand-hover"
                  >
                    {showClientContext ? '− Hide context' : '+ Add context about this client'}
                  </button>
                  {showClientContext && (
                    <textarea
                      placeholder="E.g., B2B SaaS company, 50 employees, looking to rebrand and increase inbound leads..."
                      value={clientContext}
                      onChange={(e) => setClientContext(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none resize-none"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Zone 2: Services */}
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">What are you proposing?</p>

          {/* Bundle cards */}
          {bundles.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Packages</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {bundles.map((b: any) => {
                  const bundleModuleNames = getBundleModuleNames(b);
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBundleId(selectedBundleId === b.id ? null : b.id)}
                      className={cn(
                        'rounded-xl border-2 p-4 text-left transition-all',
                        selectedBundleId === b.id
                          ? 'border-brand bg-accent'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{b.name}</p>
                        {selectedBundleId === b.id && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      {b.tagline && <p className="mt-1 text-xs text-muted-foreground">{b.tagline}</p>}
                      {/* Included services as pills */}
                      {bundleModuleNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {bundleModuleNames.slice(0, 5).map((name: string) => (
                            <span key={name} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {name}
                            </span>
                          ))}
                          {bundleModuleNames.length > 5 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              +{bundleModuleNames.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold tabular-nums text-foreground">{currencySymbol}{(b.bundle_price || 0).toLocaleString()}</span>
                        {b.individual_total > b.bundle_price && (
                          <span className="text-xs text-muted-foreground line-through">{currencySymbol}{b.individual_total.toLocaleString()}</span>
                        )}
                        {b.savings_amount > 0 && (
                          <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-[10px] font-medium text-status-success">
                            Save {currencySymbol}{b.savings_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual services */}
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {bundles.length > 0 ? 'Add Individual Services' : 'Select Services'}
          </p>
          <div className="space-y-2">
            {groupedModules.map((group: any) => {
              const isOpen = expandedGroups[group.id] !== false;
              const selectedInGroup = group.modules.filter((m: any) => selectedModuleIds.has(m.id)).length;
              return (
                <div key={group.id} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-foreground">{group.name}</span>
                    <div className="flex items-center gap-2">
                      {selectedInGroup > 0 && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium text-brand">{selectedInGroup}</span>
                      )}
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-border">
                      {group.modules.map((mod: any) => {
                        const isSelected = selectedModuleIds.has(mod.id);
                        const price = getModulePrice(mod);
                        const defaultPrice = getModuleDefaultPrice(mod);
                        const isOverridden = priceOverrides[mod.id] !== undefined;
                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            className={cn(
                              'group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
                              isSelected ? 'bg-accent/50' : 'hover:bg-muted/30'
                            )}
                          >
                            <div className={cn(
                              'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors',
                              isSelected ? 'border-brand bg-brand' : 'border-muted-foreground/30'
                            )}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{mod.name}</p>
                              {mod.short_description && (
                                <p className="hidden text-xs text-muted-foreground group-hover:block">{mod.short_description}</p>
                              )}
                            </div>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider',
                              mod.pricing_model === 'fixed' ? 'bg-status-info/10 text-status-info' :
                              mod.pricing_model === 'monthly' ? 'bg-status-success/10 text-status-success' :
                              'bg-status-warning/10 text-status-warning'
                            )}>
                              {mod.pricing_model}
                            </span>
                            <InlinePrice
                              value={price}
                              onChange={(newPrice) => {
                                setPriceOverrides(prev => ({ ...prev, [mod.id]: newPrice }));
                              }}
                              currencySymbol={currencySymbol}
                              suffix={priceSuffix[mod.pricing_model] || ''}
                              isOverridden={isOverridden}
                              onReset={() => {
                                setPriceOverrides(prev => {
                                  const next = { ...prev };
                                  delete next[mod.id];
                                  return next;
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Running total */}
          {selectedModuleIds.size > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{selectedModuleIds.size} service{selectedModuleIds.size !== 1 ? 's' : ''} selected</span>
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {totalFixed > 0 && `${currencySymbol}${totalFixed.toLocaleString()}`}
                    {totalFixed > 0 && totalMonthly > 0 && ' + '}
                    {totalMonthly > 0 && `${currencySymbol}${totalMonthly.toLocaleString()}/mo`}
                    {totalFixed === 0 && totalMonthly === 0 && totalHourly > 0 && `${currencySymbol}${totalHourly.toLocaleString()}/hr`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Zone 3: Timeline */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex w-full items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <span className="text-sm font-semibold text-foreground">When does this start?</span>
                {phaseSummary && !showTimeline && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ~{phaseSummary.totalWeeks} weeks: {phaseSummary.names}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {showTimeline ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
          {showTimeline && (
            <div className="border-t border-border px-6 py-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Project Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none"
                />
              </div>
              {/* Phase breakdown */}
              {timelinePhases.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Project Phases</p>
                  <div className="space-y-2">
                    {timelinePhases.map((phase: any, i: number) => (
                      <div key={phase.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{phase.name}</p>
                          {phase.description && <p className="text-[10px] text-muted-foreground truncate">{phase.description}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{phase.default_duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Sticky bottom action bar */}
      {canBuild && (
        <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur px-6 py-4">
          <div className="mx-auto flex max-w-[720px] items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{selectedModuleIds.size} services for {selectedClient?.company_name || newClientName}</p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {totalFixed > 0 && `${currencySymbol}${totalFixed.toLocaleString()}`}
                {totalFixed > 0 && totalMonthly > 0 && ' + '}
                {totalMonthly > 0 && `${currencySymbol}${totalMonthly.toLocaleString()}/mo`}
              </p>
            </div>
            <button
              onClick={handleBuild}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {saving ? 'Building...' : 'Build Proposal'}
            </button>
          </div>
        </div>
      )}

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
