import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, FileText, EyeOff, Check, RefreshCw, Loader2, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SignupGate, type SignupTrigger } from '@/components/onboarding/SignupGate';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';
import {
  BrandProvider, HeroCover, SectionHeader, ServiceCard, PricingSummary,
  WhyUsCard, TestimonialCard, TermsSection, SignatureBlock,
  TextContent, PageWrapper, HighlightPanel, EditableText, TimelineStep,
} from '@/components/proposal-template';


function getDefaultAboutText(yearsExperience?: number | null): string {
  const yearsPart = yearsExperience ? `Over the past ${yearsExperience} years` : 'Over the past years';
  return `${yearsPart}, we've helped ambitious brands transform their market position through the intersection of strategy, design, and technology. We're not the biggest agency — and that's by design. Our deliberately lean structure means faster decisions, fewer layers, and more senior attention on every engagement.`;
}

const sectionNames = [
  'Cover', 'Executive Summary', 'Scope of Services', 'Timeline',
  'Investment', 'Why Us', 'Testimonials', 'Terms', 'Signature',
];

export default function GuestProposalPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [signupTrigger, setSignupTrigger] = useState<SignupTrigger>('share');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [hiddenSections, setHiddenSections] = useState<Set<number>>(new Set());
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => !!localStorage.getItem('propopad_nudge_dismissed'));
  const [regenerating, setRegenerating] = useState(false);
  const editCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Editable local state
  const [proposalTitle, setProposalTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [localServices, setLocalServices] = useState<any[]>([]);
  const [localPhases, setLocalPhases] = useState<any[]>([]);
  const [localAboutText, setLocalAboutText] = useState('');

  const guestProposal = useMemo(() => {
    try {
      const raw = localStorage.getItem('propopad_guest_proposal');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const guestOnboarding = useMemo(() => {
    try {
      const raw = localStorage.getItem('propopad_guest_onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    if (guestProposal) {
      setProposalTitle(guestProposal.title || `Proposal for ${guestProposal.clientName || 'Client'}`);
      setExecutiveSummary(guestProposal.executiveSummary || '');
      setLocalServices(guestProposal.services || []);
      setLocalPhases(guestProposal.phases || []);
      setLocalAboutText(guestProposal.aboutText || guestOnboarding?.agencyIdentity?.about_text || '');
    }
  }, []);

  // Conversion nudge: show after 2 min or 3+ edits
  useEffect(() => {
    if (nudgeDismissed) return;
    const timer = setTimeout(() => {
      if (!nudgeDismissed) setShowNudge(true);
    }, 120000); // 2 minutes
    return () => clearTimeout(timer);
  }, [nudgeDismissed]);

  const trackEdit = useCallback(() => {
    editCountRef.current += 1;
    if (editCountRef.current >= 3 && !nudgeDismissed) {
      setShowNudge(true);
    }
  }, [nudgeDismissed]);

  // Auto-save helper
  const saveToLocalStorage = useCallback((updates: Record<string, any>) => {
    try {
      const raw = localStorage.getItem('propopad_guest_proposal');
      const current = raw ? JSON.parse(raw) : {};
      const updated = { ...current, ...updates };
      localStorage.setItem('propopad_guest_proposal', JSON.stringify(updated));
      setShowAutoSaved(true);
      setTimeout(() => setShowAutoSaved(false), 2000);
      trackEdit();
    } catch {}
  }, [trackEdit]);

  if (!guestProposal) {
    navigate('/');
    return null;
  }

  const identity = guestOnboarding?.agencyIdentity || {};
  const currencySymbol = guestProposal.currencySymbol || '$';
  const differentiators = guestOnboarding?.differentiators || [];
  const testimonials = (guestOnboarding?.testimonials || []).filter((t: any) => t.approved);
  const clientName = guestProposal.clientName || 'Client';
  const agencyName = identity.name || 'Your Agency';
  const brandColor = identity.brand_color || '#E8825C';

  const totalFixed = localServices.reduce((sum: number, s: any) => {
    if (s.pricing_model === 'fixed' || !s.pricing_model) return sum + (s.priceOverride ?? s.price_fixed ?? 0);
    return sum;
  }, 0);
  const totalMonthly = localServices.reduce((sum: number, s: any) => {
    if (s.pricing_model === 'monthly') return sum + (s.priceOverride ?? s.price_monthly ?? 0);
    return sum;
  }, 0);

  const totalStr = (() => {
    const parts: string[] = [];
    if (totalFixed > 0) parts.push(`${currencySymbol}${totalFixed.toLocaleString()}`);
    if (totalMonthly > 0) parts.push(`${currencySymbol}${totalMonthly.toLocaleString()}/mo`);
    return parts.join(' + ') || `${currencySymbol}0`;
  })();

  const pricingItems = localServices.map((s: any) => {
    const price = s.priceOverride ?? s.price_fixed ?? s.price_monthly ?? s.price_hourly ?? 0;
    const suffix = s.pricing_model === 'monthly' ? '/mo' : s.pricing_model === 'hourly' ? '/hr' : '';
    return {
      service: s.name,
      price: `${currencySymbol}${price.toLocaleString()}${suffix}`,
      model: (s.pricing_model || 'fixed') as 'fixed' | 'monthly' | 'hourly',
      isAddon: s.service_type === 'addon',
    };
  });

  const proposalDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const resolveIcon = (iconName: string | null | undefined) => {
    if (iconName && (LucideIcons as any)[iconName]) {
      const Icon = (LucideIcons as any)[iconName];
      return <Icon size={22} />;
    }
    return <FileText size={22} />;
  };

  const toggleSection = (idx: number) => {
    setHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const requireSignup = (trigger: SignupTrigger) => {
    setSignupTrigger(trigger);
    setShowSignupGate(true);
  };

  // Edit handlers that auto-save
  const handleTitleEdit = (val: string) => {
    setProposalTitle(val);
    saveToLocalStorage({ title: val });
  };

  const handleSummaryEdit = (val: string) => {
    setExecutiveSummary(val);
    saveToLocalStorage({ executiveSummary: val });
  };

  const handleServiceEdit = (index: number, field: string, value: any) => {
    setLocalServices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      saveToLocalStorage({ services: updated });
      return updated;
    });
  };

  const handlePhaseEdit = (index: number, field: string, value: string) => {
    setLocalPhases(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      saveToLocalStorage({ phases: updated });
      return updated;
    });
  };

  const handleAboutEdit = (val: string) => {
    setLocalAboutText(val);
    saveToLocalStorage({ aboutText: val });
  };

  const handleSaveDraft = () => {
    saveToLocalStorage({
      title: proposalTitle,
      executiveSummary,
      services: localServices,
      phases: localPhases,
      aboutText: localAboutText,
    });
    toast.success('Draft saved');
  };

  // Regenerate executive summary
  const handleRegenerateSummary = async () => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-executive-summary', {
        body: {
          agencyName,
          clientName,
          serviceNames: localServices.map((s: any) => s.name),
          serviceContexts: localServices.map((s: any) => s.ai_context).filter(Boolean),
          clientChallenge: guestProposal.clientChallenge || '',
          clientGoal: guestProposal.clientGoal || '',
          clientContextNote: guestProposal.clientContextNote || '',
        },
      });
      if (data?.summary) {
        setExecutiveSummary(data.summary);
        saveToLocalStorage({ executiveSummary: data.summary });
        toast.success('Summary regenerated');
      }
    } catch {
      toast.error('Failed to regenerate summary');
    }
    setRegenerating(false);
  };

  const dismissNudge = () => {
    setShowNudge(false);
    setNudgeDismissed(true);
    localStorage.setItem('propopad_nudge_dismissed', 'true');
  };

  // Post-signup: persist all data and create real proposal
  const handlePostSignup = async () => {
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
        if (retries < 15) { retries++; await new Promise(r => setTimeout(r, 500)); return waitForAgency(); }
        return null;
      };

      const freshAgency = await waitForAgency();
      if (!freshAgency) { toast.error('Could not set up your agency.'); setSaving(false); return; }

      if (guestOnboarding) {
        const groupNameMap = guestOnboarding.groupNameMap || {};
        const selectedKeys = new Set<string>(guestOnboarding.selectedModuleKeys || []);

        await supabase.from('agencies').update({
          name: identity.name || freshAgency.name, email: identity.email || null,
          phone: identity.phone || null, logo_url: identity.logo_url || null,
          brand_color: identity.brand_color || '#E8825C', tagline: identity.tagline || null,
          address_line1: identity.address || null, about_text: localAboutText || identity.about_text || null,
          scraped_data: guestOnboarding.scrapeData || null,
          scrape_status: guestOnboarding.scrapeData ? 'complete' : 'manual',
          scraped_at: guestOnboarding.scrapeData ? new Date().toISOString() : null,
          currency: guestOnboarding.scrapeData?.detected_currency?.code || 'USD',
          currency_symbol: guestOnboarding.scrapeData?.detected_currency?.symbol || '$',
          default_validity_days: 30, default_revision_rounds: 2, default_notice_period: '30 days',
          proposal_prefix: (identity.name || freshAgency.name || 'AGY').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
          onboarding_complete: true, onboarding_step: 7,
        } as any).eq('id', freshAgency.id);

        const matchedGroupNames = [...new Set([...selectedKeys].map(key => key.replace(/-\d+$/, '')))];
        const modulesToInsert = matchedGroupNames.flatMap(groupName => {
          const groupId = Object.entries(groupNameMap).find(([_, name]) => name === groupName)?.[0];
          if (!groupId) return [];
          return getDefaultModulesForGroup(groupName)
            .filter((_, i) => selectedKeys.has(`${groupName}-${i}`))
            .map((mod, i) => ({
              agency_id: freshAgency.id, group_id: groupId, name: mod.name,
              description: mod.description || null, short_description: mod.shortDesc,
              pricing_model: mod.pricingModel,
              price_fixed: mod.pricingModel === 'fixed' ? mod.price : null,
              price_monthly: mod.pricingModel === 'monthly' ? mod.price : null,
              price_hourly: mod.pricingModel === 'hourly' ? mod.price : null,
              service_type: mod.serviceType || 'core', deliverables: mod.deliverables || [],
              client_responsibilities: mod.clientResponsibilities || [],
              out_of_scope: mod.outOfScope || [], default_timeline: mod.defaultTimeline || null,
              suggested_kpis: mod.suggestedKpis || [], common_tools: mod.commonTools || [],
              is_active: true, display_order: i,
            }));
        });
        if (modulesToInsert.length > 0) {
          await supabase.from('service_modules').delete().eq('agency_id', freshAgency.id);
          await supabase.from('service_modules').insert(modulesToInsert);
        }

        const allTestimonials = guestOnboarding.testimonials || [];
        if (allTestimonials.length > 0) {
          await supabase.from('testimonials').insert(allTestimonials.map((t: any) => ({
            agency_id: freshAgency.id, quote: t.quote, client_name: t.client_name || 'Client',
            client_title: t.client_title || null, client_company: t.client_company || null,
            metric_value: t.metric_value || null, metric_label: t.metric_label || null, source: 'scraped',
          })));
        }

        if (differentiators.length > 0) {
          await supabase.from('differentiators').delete().eq('agency_id', freshAgency.id);
          await supabase.from('differentiators').insert(differentiators.map((d: any, i: number) => ({
            agency_id: freshAgency.id, title: d.title, description: d.description,
            stat_value: d.stat_value, stat_label: d.stat_label, icon: d.icon || 'Target',
            display_order: i + 1, source: d.source || 'generated',
          })));
        }

        const { data: et } = await supabase.from('terms_clauses').select('id').eq('agency_id', freshAgency.id);
        if (!et?.length) {
          await supabase.from('terms_clauses').insert([
            { title: 'Payment Terms', content: 'All fees are due according to the payment schedule outlined in the Investment section.', display_order: 1 },
            { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable.', display_order: 2 },
            { title: 'Intellectual Property', content: 'Upon receipt of full payment, the client receives full ownership of all final deliverables.', display_order: 3 },
            { title: 'Termination', content: 'Either party may terminate with written notice as specified in the notice period.', display_order: 4 },
          ].map(t => ({ ...t, agency_id: freshAgency.id, is_default: true })));
        }
        const { data: ep } = await supabase.from('payment_templates').select('id').eq('agency_id', freshAgency.id);
        if (!ep?.length) {
          await supabase.from('payment_templates').insert([
            { agency_id: freshAgency.id, name: 'Equal Thirds', milestones: [{ label: 'Start', percentage: 33 }, { label: 'Midpoint', percentage: 33 }, { label: 'Delivery', percentage: 34 }], is_default: true },
          ]);
        }
        const { data: eph } = await supabase.from('timeline_phases').select('id').eq('agency_id', freshAgency.id);
        if (!eph?.length) {
          await supabase.from('timeline_phases').insert([
            { agency_id: freshAgency.id, name: 'Discovery & Research', default_duration: '1-2 weeks', display_order: 1 },
            { agency_id: freshAgency.id, name: 'Strategy & Architecture', default_duration: '2-3 weeks', display_order: 2 },
            { agency_id: freshAgency.id, name: 'Creative Development', default_duration: '3-4 weeks', display_order: 3 },
            { agency_id: freshAgency.id, name: 'Build & Produce', default_duration: '2-3 weeks', display_order: 4 },
            { agency_id: freshAgency.id, name: 'Launch & Optimize', default_duration: '1-2 weeks', display_order: 5 },
          ]);
        }
      }

      // Create proposal
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('id, agency_id').eq('id', currentUser.user!.id).single();
      const agencyId = profile!.agency_id!;
      const { data: ag } = await supabase.from('agencies').select('*').eq('id', agencyId).single();
      if (!ag) { toast.error('Agency not found'); setSaving(false); return; }

      let clientId: string | null = null;
      if (clientName.trim()) {
        const { data: newC } = await supabase.from('clients').insert({
          agency_id: agencyId, company_name: clientName.trim(),
          contact_name: guestProposal.contactName || null,
          website: guestProposal.clientWebsite || null,
          notes: guestProposal.clientContext || null,
        }).select('id').single();
        clientId = newC?.id || null;
      }

      const counter = (ag.proposal_counter || 0) + 1;
      const prefix = ag.proposal_prefix || 'PRO';
      const refNum = `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(4, '0')}`;
      const { data: realModules } = await supabase.from('service_modules').select('id, name, service_type').eq('agency_id', agencyId);

      const { data: proposal } = await supabase.from('proposals').insert({
        agency_id: agencyId, client_id: clientId, reference_number: refNum,
        title: proposalTitle || `Proposal for ${clientName}`,
        executive_summary: executiveSummary || null,
        status: 'draft', total_fixed: totalFixed, total_monthly: totalMonthly,
        grand_total: totalFixed + totalMonthly, created_by: profile!.id,
        project_start_date: guestProposal.startDate,
        phases: localPhases.length > 0 ? localPhases : null,
        validity_days: 30, revision_rounds: 2, notice_period: '30 days',
      }).select('id').single();

      if (proposal) {
        const svcInserts = localServices.map((s: any, i: number) => {
          const realMod = realModules?.find((rm: any) => rm.name === s.name);
          return {
            proposal_id: proposal.id, module_id: realMod?.id || null,
            display_order: i, price_override: s.priceOverride,
            is_addon: (realMod?.service_type || s.service_type) === 'addon',
            custom_deliverables: s.deliverables || null,
            custom_description: s.customDescription || null,
          };
        }).filter((s: any) => s.module_id);
        if (svcInserts.length > 0) await supabase.from('proposal_services').insert(svcInserts);
        await supabase.from('agencies').update({ proposal_counter: counter }).eq('id', agencyId);

        localStorage.removeItem('propopad_guest_proposal');
        localStorage.removeItem('propopad_guest_onboarding');
        localStorage.removeItem('propopad_nudge_dismissed');
        toast.success('Proposal created!');
        window.location.href = `/proposals/${proposal.id}`;
      }
    } catch (e: any) {
      console.error('Post-signup error:', e);
      toast.error('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const defaultTerms = [
    { title: 'Payment Terms', content: 'All fees are due according to the payment schedule outlined in the Investment section of this proposal.' },
    { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable.' },
    { title: 'Intellectual Property', content: 'Upon receipt of full payment, the client receives full ownership of all final deliverables.' },
    { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified in the notice period.' },
  ];

  const defaultPhases = [
    { name: 'Discovery & Research', duration: '1-2 weeks', description: 'Understanding your brand, audience, and competitive landscape.' },
    { name: 'Strategy & Planning', duration: '2-3 weeks', description: 'Defining the roadmap, KPIs, and creative direction.' },
    { name: 'Creative Development', duration: '3-4 weeks', description: 'Designing and developing all core deliverables.' },
    { name: 'Launch & Optimize', duration: '1-2 weeks', description: 'Going live with monitoring, optimization, and performance tracking.' },
  ];

  const phases = localPhases.length > 0 ? localPhases : defaultPhases;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-3 print:hidden">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </button>
          <EditableText
            value={proposalTitle || `Proposal for ${clientName}`}
            onSave={handleTitleEdit}
            as="span"
            className="text-sm font-medium text-foreground truncate"
          />
          <span className="rounded-full bg-status-draft/15 px-2.5 py-0.5 text-xs font-medium text-status-draft shrink-0">Preview</span>
          {/* Auto-save indicator */}
          <span className={cn(
            'flex items-center gap-1 text-xs text-muted-foreground transition-opacity shrink-0',
            showAutoSaved ? 'opacity-100' : 'opacity-0'
          )}>
            <Check className="h-3 w-3" /> Saved
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button onClick={handleSaveDraft} disabled={saving} className="rounded-lg border border-border px-3 sm:px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50">
            <span className="hidden sm:inline">Save Draft</span>
            <Check className="h-4 w-4 sm:hidden" />
          </button>
          <button onClick={() => requireSignup('download')} disabled={saving} className="hidden sm:flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => requireSignup('share')} disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
            <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">{saving ? 'Saving...' : 'Share & Send'}</span>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Section Nav */}
        <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-48 flex-col gap-1 overflow-y-auto border-r border-border bg-background p-3 lg:flex print:hidden">
          {sectionNames.map((name, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveSection(idx);
                document.getElementById(`guest-section-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors text-left',
                activeSection === idx ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                hiddenSections.has(idx) && 'opacity-40'
              )}
            >
              {hiddenSections.has(idx) && <EyeOff className="h-3 w-3" />}
              {name}
            </button>
          ))}
        </div>

        {/* Proposal Content */}
        <div className="flex-1">
          <BrandProvider brand={{
            agencyName: agencyName.toUpperCase(),
            agencyFullName: agencyName,
            primaryColor: brandColor,
            darkColor: '#0A0A0A',
            logoUrl: identity.logo_url || null,
            logoInitial: (agencyName || 'A').charAt(0).toUpperCase(),
            contactEmail: identity.email || '',
            contactWebsite: '',
            contactPhone: identity.phone || '',
            currency: currencySymbol,
          }}>
            <div className="mx-auto max-w-[900px] py-8 px-4 space-y-6">

              {/* Section 0: Cover */}
              {!hiddenSections.has(0) && (
                <div id="guest-section-0" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg">
                  <HeroCover
                    proposalTitle={proposalTitle}
                    clientName={clientName}
                    date={proposalDate}
                    proposalNumber="DRAFT-001"
                    onTitleEdit={handleTitleEdit}
                  />
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 1: Executive Summary */}
              {!hiddenSections.has(1) && (
                <div id="guest-section-1" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="02">
                    <div className="flex items-center justify-between mb-2">
                      <SectionHeader number="01" title="Executive Summary" subtitle="Our understanding and approach" />
                      <button
                        onClick={handleRegenerateSummary}
                        disabled={regenerating}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 shrink-0 print:hidden"
                      >
                        {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Write new version
                      </button>
                    </div>
                    <TextContent dropCap>
                      <EditableText
                        value={executiveSummary}
                        placeholder="Click to add an executive summary for this proposal. Describe the project goals, your approach, and expected outcomes."
                        onSave={handleSummaryEdit}
                        as="p"
                        className="min-h-[80px]"
                      />
                    </TextContent>
                    <div className="mt-12">
                      <HighlightPanel items={[
                        { label: 'Investment', value: totalStr, accent: true },
                        { label: 'Timeline', value: phases.length > 0 ? `${phases.length} phases` : `${Math.max(localServices.length * 2, 4)} weeks est.` },
                        { label: 'Goal', value: guestProposal.clientGoal || `${localServices.length} services` },
                      ]} />
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 2: Scope of Services */}
              {!hiddenSections.has(2) && (
                <div id="guest-section-2" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="03">
                    <SectionHeader number="02" title="Scope of Services" subtitle="What we'll deliver for you" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {localServices.map((svc: any, i: number) => {
                        const price = svc.priceOverride ?? svc.price_fixed ?? svc.price_monthly ?? svc.price_hourly ?? 0;
                        const suffix = svc.pricing_model === 'monthly' ? '/mo' : svc.pricing_model === 'hourly' ? '/hr' : '';
                        return (
                          <ServiceCard
                            key={i}
                            icon={resolveIcon(svc.icon)}
                            name={svc.name}
                            price={`${currencySymbol}${price.toLocaleString()}${suffix}`}
                            pricingModel={(svc.pricing_model || 'fixed') as any}
                            description={svc.description || svc.short_description || ''}
                            deliverables={svc.deliverables || []}
                            isAddon={svc.service_type === 'addon'}
                            delay={i * 0.1}
                            onDeliverablesEdit={(dels) => handleServiceEdit(i, 'deliverables', dels)}
                          />
                        );
                      })}
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 3: Timeline */}
              {!hiddenSections.has(3) && (
                <div id="guest-section-3" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="04">
                    <SectionHeader number="03" title="Project Timeline" subtitle="Key phases and milestones" />
                    <div className="mt-6">
                      {phases.map((phase: any, i: number) => (
                        <TimelineStep
                          key={i}
                          number={i + 1}
                          name={phase.name}
                          duration={phase.duration || phase.default_duration || ''}
                          description={phase.description}
                          isLast={i === phases.length - 1}
                          delay={i * 0.15}
                          onNameEdit={(val) => handlePhaseEdit(i, 'name', val)}
                          onDurationEdit={(val) => handlePhaseEdit(i, 'duration', val)}
                          onDescriptionEdit={(val) => handlePhaseEdit(i, 'description', val)}
                        />
                      ))}
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 4: Investment */}
              {!hiddenSections.has(4) && (
                <div id="guest-section-4" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="05">
                    <SectionHeader number="04" title="Investment" subtitle="Transparent pricing for every deliverable" />
                    <PricingSummary items={pricingItems} total={totalStr} brandColor={brandColor} />
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 5: Why Us */}
              {!hiddenSections.has(5) && differentiators.length > 0 && (
                <div id="guest-section-5" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="06">
                    <SectionHeader number="05" title="Why Us" subtitle="What sets us apart" />
                    <div className="mb-10">
                      <TextContent>
                        <EditableText
                          value={localAboutText || getDefaultAboutText()}
                          placeholder="Tell your story..."
                          onSave={handleAboutEdit}
                          as="p"
                          style={{ fontSize: '15px', lineHeight: 1.8, color: '#444' }}
                        />
                      </TextContent>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {differentiators.map((d: any, i: number) => (
                        <WhyUsCard key={i} title={d.title} description={d.description || ''} statValue={d.stat_value} statLabel={d.stat_label} icon={d.icon} delay={i * 0.1} />
                      ))}
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 6: Testimonials */}
              {!hiddenSections.has(6) && testimonials.length > 0 && (
                <div id="guest-section-6" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="07">
                    <SectionHeader number="06" title="What Our Clients Say" subtitle="Proof of impact" />
                    <div className="space-y-6">
                      {testimonials.slice(0, 4).map((t: any, i: number) => (
                        <TestimonialCard key={i} clientName={t.client_name} clientTitle={t.client_title} clientCompany={t.client_company} quote={t.quote} metricValue={t.metric_value} metricLabel={t.metric_label} featured={i === 0} delay={i * 0.1} />
                      ))}
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 7: Terms */}
              {!hiddenSections.has(7) && (
                <div id="guest-section-7" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="08">
                    <SectionHeader number="07" title="Terms & Conditions" />
                    <TermsSection clauses={defaultTerms} />
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 8: Signature */}
              {!hiddenSections.has(8) && (
                <div id="guest-section-8" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="09">
                    <SignatureBlock
                      client={{ role: 'Client', companyName: clientName }}
                      agency={{ role: 'Agency', companyName: agencyName }}
                    />
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}
            </div>
          </BrandProvider>
        </div>
      </div>

      {/* Conversion nudge bar */}
      {showNudge && !nudgeDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-3 print:hidden" style={{ backgroundColor: '#2A2118' }}>
          <p className="text-sm text-[#E8DDD0]">
            Looking good. Create a free account to share this with your client.
          </p>
          <button
            onClick={() => requireSignup('share')}
            className="text-sm font-semibold text-brass hover:underline"
          >
            Sign up →
          </button>
          <button onClick={dismissNudge} className="ml-2 text-[#E8DDD0]/60 hover:text-[#E8DDD0]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showSignupGate && (
        <SignupGate
          trigger={signupTrigger}
          clientName={clientName}
          onAuthenticated={handlePostSignup}
          onCancel={() => setShowSignupGate(false)}
        />
      )}
    </div>
  );
}

/** Small watermark in bottom-right of each section — guest mode only */
function PreviewWatermark() {
  return (
    <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground/40 select-none pointer-events-none print:hidden">
      Preview — Powered by Propopad
    </div>
  );
}
