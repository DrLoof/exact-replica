import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useBeforeUnload } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Share2, Download, Send, LinkIcon,
  ChevronDown, FileText, Check, DollarSign, Clock,
  RefreshCw, MoreHorizontal, Plus, X, Search, RotateCcw, Loader2,
  Lock, Palette,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { templates } from '@/lib/proposalTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  BrandProvider,
  HeroCover,
  SectionHeader,
  ServiceCard,
  PricingSummary,
  TimelineStep,
  WhyUsCard,
  TestimonialCard,
  TermsSection,
  SignatureBlock,
  TextContent,
  PageWrapper,
  HighlightPanel,
  EditableText,
} from '@/components/proposal-template';
import { TemplateProvider } from '@/components/proposal-template/TemplateProvider';


interface ProposalData {
  id: string;
  reference_number: string;
  title: string | null;
  subtitle: string | null;
  status: string | null;
  executive_summary: string | null;
  total_fixed: number | null;
  total_monthly: number | null;
  grand_total: number | null;
  bundle_savings: number | null;
  project_start_date: string | null;
  estimated_duration: string | null;
  validity_days: number | null;
  revision_rounds: number | null;
  notice_period: string | null;
  phases: any;
  created_at: string;
  client_id: string | null;
  agency_id: string | null;
  client_challenge: string | null;
  client_goal: string | null;
  client_context_note: string | null;
}

interface ProposalService {
  id: string;
  module_id: string | null;
  bundle_id: string | null;
  price_override: number | null;
  display_order: number | null;
  is_addon: boolean | null;
  custom_deliverables: string[] | null;
  module?: {
    name: string;
    description: string | null;
    short_description: string | null;
    pricing_model: string | null;
    price_fixed: number | null;
    price_monthly: number | null;
    price_hourly: number | null;
    deliverables: string[] | null;
    icon: string | null;
  };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-status-draft/15 text-status-draft' },
  sent: { label: 'Sent', className: 'bg-status-sent/15 text-status-sent' },
  viewed: { label: 'Viewed', className: 'bg-status-viewed/15 text-status-viewed' },
  accepted: { label: 'Accepted', className: 'bg-status-accepted/15 text-status-accepted' },
  declined: { label: 'Declined', className: 'bg-status-declined/15 text-status-declined' },
};

const sectionNames = [
  'Cover', 'Executive Summary', 'Scope of Services', 'Timeline',
  'Investment', 'Terms', 'Why Us', 'Testimonials', 'Signature',
];

function getDefaultAboutText(yearsExperience?: number | null): string {
  const yearsPart = yearsExperience ? `Over the past ${yearsExperience} years` : 'Over the past years';
  return `${yearsPart}, we've helped ambitious brands transform their market position through the intersection of strategy, design, and technology. We're not the biggest agency — and that's by design. Our deliberately lean structure means faster decisions, fewer layers, and more senior attention on every engagement.`;
}

export default function ProposalEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agency } = useAuth();

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [client, setClient] = useState<any>(null);
  const [services, setServices] = useState<ProposalService[]>([]);
  const [differentiators, setDifferentiators] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [termsClauses, setTermsClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenSections, setHiddenSections] = useState<Set<number>>(new Set());
  const [activeSection, setActiveSection] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [addServiceSearch, setAddServiceSearch] = useState('');
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [templateId, setTemplateId] = useState<string>('classic');
  const [customColors, setCustomColors] = useState<Record<string, string> | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [hexInput, setHexInput] = useState('');
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const currencySymbol = agency?.currency_symbol || '$';

  // Warn user before leaving if an editable field is focused (unsaved inline edit)
  useBeforeUnload(
    useCallback((e) => {
      const active = document.activeElement;
      if (active && active.getAttribute('contenteditable') === 'true') {
        e.preventDefault();
      }
    }, [])
  );

  useEffect(() => {
    if (id) loadProposal();
  }, [id]);

  const loadProposal = async () => {
    if (!id) return;
    setLoading(true);

    const [propRes, svcRes] = await Promise.all([
      supabase.from('proposals').select('*').eq('id', id).single(),
      supabase.from('proposal_services')
        .select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, icon)')
        .eq('proposal_id', id)
        .order('display_order'),
    ]);

    if (propRes.error || !propRes.data) {
      toast.error('Proposal not found');
      navigate('/proposals');
      return;
    }

    setProposal(propRes.data as ProposalData);
    setTemplateId((propRes.data as any).template_id || 'classic');
    if (propRes.data.client_id) {
      const { data: cl } = await supabase.from('clients').select('*').eq('id', propRes.data.client_id).single();
      setClient(cl);
    }

    const mapped = (svcRes.data || []).map((s: any) => ({
      ...s,
      module: s.service_modules,
    }));
    setServices(mapped);

    if (propRes.data.agency_id) {
      const [diffRes, testRes, termsRes] = await Promise.all([
        supabase.from('differentiators').select('*').eq('agency_id', propRes.data.agency_id).order('display_order'),
        supabase.from('testimonials').select('*').eq('agency_id', propRes.data.agency_id).order('created_at', { ascending: false }),
        supabase.from('terms_clauses').select('*').eq('agency_id', propRes.data.agency_id).order('display_order'),
      ]);
      setDifferentiators(diffRes.data || []);
      setTestimonials(testRes.data || []);
      setTermsClauses(termsRes.data || []);
    }

    setLoading(false);
  };

  // Load available modules for add-service picker
  useEffect(() => {
    if (agency?.id) {
      supabase.from('service_modules').select('*').eq('agency_id', agency.id).eq('is_active', true).order('display_order')
        .then(({ data }) => setAvailableModules(data || []));
    }
  }, [agency?.id]);

  const removeService = async (serviceId: string) => {
    if (!proposal) return;
    const removedService = services.find(s => s.id === serviceId);
    if (!removedService) return;

    // Optimistically remove from UI
    const updated = services.filter(s => s.id !== serviceId);
    setServices(updated);
    const newFixed = updated.filter(s => s.module?.pricing_model === 'fixed').reduce((sum, s) => sum + getServicePrice(s), 0);
    const newMonthly = updated.filter(s => s.module?.pricing_model === 'monthly').reduce((sum, s) => sum + getServicePrice(s), 0);
    setProposal(prev => prev ? { ...prev, total_fixed: newFixed, total_monthly: newMonthly, grand_total: newFixed + newMonthly } : prev);

    // Delete from DB
    await supabase.from('proposal_services').delete().eq('id', serviceId);
    await supabase.from('proposals').update({ total_fixed: newFixed, total_monthly: newMonthly, grand_total: newFixed + newMonthly }).eq('id', proposal.id);

    // Undo toast
    toast.success(`${removedService.module?.name || 'Service'} removed`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          // Re-insert the service
          const { data: restored } = await supabase.from('proposal_services').insert({
            proposal_id: proposal.id,
            module_id: removedService.module_id,
            display_order: removedService.display_order,
            is_addon: removedService.is_addon,
            price_override: removedService.price_override,
            custom_deliverables: removedService.custom_deliverables,
            bundle_id: removedService.bundle_id,
          }).select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, icon)').single();
          if (restored) {
            const mapped = { ...restored, module: restored.service_modules };
            setServices(prev => [...prev, mapped].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
            // Recalculate totals
            const restoredServices = [...updated, mapped];
            const rFixed = restoredServices.filter(s => s.module?.pricing_model === 'fixed').reduce((sum, s) => sum + getServicePrice(s), 0);
            const rMonthly = restoredServices.filter(s => s.module?.pricing_model === 'monthly').reduce((sum, s) => sum + getServicePrice(s), 0);
            await supabase.from('proposals').update({ total_fixed: rFixed, total_monthly: rMonthly, grand_total: rFixed + rMonthly }).eq('id', proposal.id);
            setProposal(prev => prev ? { ...prev, total_fixed: rFixed, total_monthly: rMonthly, grand_total: rFixed + rMonthly } : prev);
            toast.success(`${removedService.module?.name || 'Service'} restored`);
          }
        },
      },
      duration: 6000,
    });
  };

  const addService = async (mod: any) => {
    if (!proposal) return;
    const { data: newSvc, error } = await supabase.from('proposal_services').insert({
      proposal_id: proposal.id,
      module_id: mod.id,
      display_order: services.length,
      is_addon: mod.service_type === 'addon',
    }).select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, icon)').single();
    if (error) { toast.error('Failed to add service'); return; }
    const mapped = { ...newSvc, module: newSvc.service_modules };
    const updated = [...services, mapped];
    setServices(updated);
    // Recalculate totals
    const price = mod.price_fixed ?? mod.price_monthly ?? mod.price_hourly ?? 0;
    const newFixed = (proposal.total_fixed || 0) + (mod.pricing_model === 'fixed' ? price : 0);
    const newMonthly = (proposal.total_monthly || 0) + (mod.pricing_model === 'monthly' ? price : 0);
    await supabase.from('proposals').update({ total_fixed: newFixed, total_monthly: newMonthly, grand_total: newFixed + newMonthly }).eq('id', proposal.id);
    setProposal(prev => prev ? { ...prev, total_fixed: newFixed, total_monthly: newMonthly, grand_total: newFixed + newMonthly } : prev);
    setShowAddService(false);
    setAddServiceSearch('');
    toast.success(`Added ${mod.name}`);
  };

  const updateField = async (field: string, value: any) => {
    if (!proposal) return;
    await supabase.from('proposals').update({ [field]: value }).eq('id', proposal.id);
    setProposal(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const regenerateExecutiveSummary = async () => {
    if (!proposal || !agency) return;
    setRegenerating(true);
    try {
      // Get service names and ai_context from modules
      const moduleIds = services.map(s => s.module_id).filter(Boolean);
      const { data: modulesData } = await supabase
        .from('service_modules')
        .select('name, ai_context')
        .in('id', moduleIds);
      
      const { data: summaryData } = await supabase.functions.invoke('generate-executive-summary', {
        body: {
          agencyName: agency.name,
          clientName: client?.company_name || 'Client',
          serviceNames: (modulesData || []).map((m: any) => m.name),
          serviceContexts: (modulesData || []).map((m: any) => m.ai_context).filter(Boolean),
          clientChallenge: (proposal as any).client_challenge || null,
          clientGoal: (proposal as any).client_goal || null,
          clientContextNote: (proposal as any).client_context_note || null,
        },
      });
      if (summaryData?.summary) {
        await updateField('executive_summary', summaryData.summary);
        toast.success('Executive summary regenerated');
      } else {
        toast.error('Failed to generate summary');
      }
    } catch {
      toast.error('Failed to regenerate summary');
    }
    setRegenerating(false);
  };

  const toggleSection = (idx: number) => {
    setHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const switchTemplate = async (newId: string) => {
    const tmpl = templates[newId];
    if (!tmpl) return;
    if (tmpl.isPro) {
      toast.error('This template is available on the Pro plan. Upgrade to unlock all templates.');
      return;
    }
    setTemplateId(newId);
    if (proposal) {
      await supabase.from('proposals').update({ template_id: newId }).eq('id', proposal.id);
    }
  };

  const getServicePrice = (s: ProposalService) => {
    if (s.price_override != null) return s.price_override;
    const mod = s.module;
    if (!mod) return 0;
    return mod.price_fixed ?? mod.price_monthly ?? mod.price_hourly ?? 0;
  };

  const pricingSuffix = (model: string | null | undefined) => {
    if (model === 'monthly') return '/mo';
    if (model === 'hourly') return '/hr';
    return '';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc956e] border-t-transparent" />
      </div>
    );
  }

  if (!proposal) return null;

  const sc = statusConfig[proposal.status || 'draft'] || statusConfig.draft;

  // Build pricing items for PricingSummary
  const pricingItems = services.map(s => ({
    service: s.module?.name || 'Service',
    price: `${currencySymbol}${getServicePrice(s).toLocaleString()}${pricingSuffix(s.module?.pricing_model)}`,
    model: (s.module?.pricing_model || 'fixed') as 'fixed' | 'monthly' | 'hourly',
    isAddon: s.is_addon || false,
  }));

  const totalStr = (() => {
    const parts: string[] = [];
    if ((proposal.total_fixed ?? 0) > 0) parts.push(`${currencySymbol}${(proposal.total_fixed || 0).toLocaleString()}`);
    if ((proposal.total_monthly ?? 0) > 0) parts.push(`${currencySymbol}${(proposal.total_monthly || 0).toLocaleString()}/mo`);
    return parts.join(' + ') || `${currencySymbol}0`;
  })();

  const totalBreakdown = (proposal.total_fixed ?? 0) > 0 && (proposal.total_monthly ?? 0) > 0
    ? `${currencySymbol}${(proposal.total_fixed || 0).toLocaleString()} one-time + ${currencySymbol}${(proposal.total_monthly || 0).toLocaleString()}/mo recurring`
    : undefined;

  const validUntil = proposal.validity_days
    ? new Date(new Date(proposal.created_at).getTime() + proposal.validity_days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : undefined;

  // Resolve icon for services
  const resolveIcon = (iconName: string | null | undefined) => {
    if (iconName && (LucideIcons as any)[iconName]) {
      const Icon = (LucideIcons as any)[iconName];
      return <Icon size={22} />;
    }
    return <FileText size={22} />;
  };

  const proposalDate = new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/proposals')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <EditableText
            value={proposal.title || 'Untitled Proposal'}
            onSave={(val) => updateField('title', val)}
            as="span"
            className="text-sm font-medium text-foreground"
          />
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', sc.className)}>{sc.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{proposal.reference_number}</span>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Dashboard
          </button>
          <span className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5" />
            Auto-saved
          </span>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover"
          >
            <Share2 className="h-4 w-4" /> Share
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
                document.getElementById(`section-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
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

        {/* Proposal Content — rendered with template components */}
         <div className="flex-1 overflow-y-auto">
          <TemplateProvider templateId={(proposal as any).template_id || 'classic'}>
          <BrandProvider brand={{
            agencyName: (agency?.name || 'Agency').toUpperCase(),
            agencyFullName: agency?.name || 'Agency',
            primaryColor: agency?.brand_color || '#fc956e',
            darkColor: agency?.dark_color || '#0A0A0A',
            logoUrl: agency?.logo_url || null,
            logoInitial: (agency?.name || 'A').charAt(0).toUpperCase(),
            contactEmail: agency?.email || '',
            contactWebsite: agency?.website || '',
            contactPhone: agency?.phone || '',
            currency: agency?.currency_symbol || '$',
          }}>
            <div className="mx-auto max-w-[900px] py-8 px-4 space-y-6 print:max-w-none print:p-0 print:space-y-0">
              

              {/* Section 0: Cover */}
              <SectionWrapper idx={0} hidden={hiddenSections.has(0)} onToggle={toggleSection} label="Cover">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <HeroCover
                    proposalTitle={proposal.title || 'Proposal Title'}
                    subtitle={proposal.subtitle || undefined}
                    clientName={client?.company_name || 'Client'}
                    date={proposalDate}
                    proposalNumber={proposal.reference_number}
                    onTitleEdit={(val) => updateField('title', val)}
                    onSubtitleEdit={(val) => updateField('subtitle', val)}
                  />
                </div>
              </SectionWrapper>

              {/* Section 1: Executive Summary */}
              <SectionWrapper idx={1} hidden={hiddenSections.has(1)} onToggle={toggleSection} label="Executive Summary">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="02">
                    <SectionHeader number="01" title="Executive Summary" subtitle="Our understanding and approach" />
                    <TextContent dropCap>
                      <EditableText
                        value={proposal.executive_summary || ''}
                        placeholder="Click to add an executive summary for this proposal. Describe the project goals, your approach, and expected outcomes."
                        onSave={(val) => updateField('executive_summary', val)}
                        as="p"
                        className="min-h-[80px]"
                      />
                    </TextContent>

                    {/* Regenerate button */}
                    <div className="mt-4 flex items-center gap-3 print:hidden">
                      <button
                        onClick={regenerateExecutiveSummary}
                        disabled={regenerating}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-50"
                      >
                        {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        {regenerating ? 'Regenerating...' : 'Regenerate'}
                      </button>
                      {!proposal.executive_summary && (
                        <span className="text-[11px] text-muted-foreground">Add client context on the creation page to make this more specific →</span>
                      )}
                    </div>

                    {/* Key highlights with GOAL stat */}
                    <div className="mt-12">
                      <HighlightPanel
                        items={[
                          { label: 'Investment', value: totalStr, accent: true },
                          { label: 'Timeline', value: proposal.estimated_duration || `${services.length * 2} weeks est.` },
                          { label: 'Services', value: `${services.length} included` },
                          { label: 'Goal', value: (proposal as any).client_goal || 'Grow the business' },
                        ]}
                      />
                    </div>
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 2: Scope of Services */}
              <SectionWrapper idx={2} hidden={hiddenSections.has(2)} onToggle={toggleSection} label="Scope of Services">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="03">
                    <SectionHeader number="02" title="Scope of Services" subtitle="What we'll deliver for you" />
                    {services.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-[#999]" style={{ fontSize: '15px' }}>No services added yet.</p>
                        <button onClick={() => setShowAddService(true)} className="mt-2 inline-block text-sm font-medium" style={{ color: agency?.brand_color || '#fc956e' }}>
                          + Add a service
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          {services.map((svc, i) => (
                            <div key={svc.id} className="group/svc relative">
                              <button
                                onClick={() => removeService(svc.id)}
                                className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover/svc:opacity-100 print:hidden"
                                title="Remove service"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <ServiceCard
                                icon={resolveIcon(svc.module?.icon)}
                                name={svc.module?.name || 'Service'}
                                price={`${currencySymbol}${getServicePrice(svc).toLocaleString()}`}
                                pricingModel={(svc.module?.pricing_model || 'fixed') as any}
                                description={svc.module?.description || svc.module?.short_description || ''}
                                deliverables={svc.custom_deliverables || svc.module?.deliverables || []}
                                isAddon={svc.is_addon || false}
                                delay={i * 0.1}
                                onDescriptionEdit={async (val) => {
                                  await supabase.from('proposal_services').update({ custom_description: val }).eq('id', svc.id);
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, module: s.module ? { ...s.module, description: val } : s.module } : s));
                                }}
                                onDeliverablesEdit={async (dels) => {
                                  await supabase.from('proposal_services').update({ custom_deliverables: dels }).eq('id', svc.id);
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, custom_deliverables: dels } : s));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 text-center print:hidden">
                          <button
                            onClick={() => setShowAddService(true)}
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#DDD] px-5 py-2.5 text-sm font-medium text-[#999] transition-colors hover:border-[#BBB] hover:text-[#666]"
                          >
                            <Plus className="h-4 w-4" /> Add Service
                          </button>
                        </div>
                      </>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 3: Timeline */}
              <SectionWrapper idx={3} hidden={hiddenSections.has(3)} onToggle={toggleSection} label="Timeline">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="04">
                    <SectionHeader number="03" title="Timeline" subtitle="How we'll get there" />
                    
                    {/* Stat bar */}
                    {(() => {
                      const startDateStr = proposal.project_start_date
                        ? new Date(proposal.project_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'TBD';
                      const durationStr = proposal.estimated_duration || `~${Math.max(services.length * 2, 4)} weeks`;
                      const durationMatch = durationStr.match(/(\d+)/);
                      const totalWeeks = durationMatch ? parseInt(durationMatch[1]) : 16;
                      const launchDate = proposal.project_start_date
                        ? new Date(new Date(proposal.project_start_date).getTime() + totalWeeks * 7 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'TBD';
                      return (
                        <HighlightPanel
                          items={[
                            { label: 'Project Start', value: startDateStr },
                            { label: 'Total Duration', value: `${totalWeeks} Weeks` },
                            { label: 'Projected Launch', value: launchDate, accent: true },
                          ]}
                        />
                      );
                    })()}

                    {/* Phase timeline */}
                    {proposal.phases && Array.isArray(proposal.phases) && (proposal.phases as any[]).length > 0 ? (
                      <div className="mt-10">
                        {(proposal.phases as any[]).map((phase: any, i: number) => (
                          <TimelineStep
                            key={i}
                            number={i + 1}
                            name={phase.name || `Phase ${i + 1}`}
                            duration={phase.duration || 'TBD'}
                            description={phase.description}
                            isLast={i === (proposal.phases as any[]).length - 1}
                            delay={i * 0.1}
                            onNameEdit={(val) => {
                              const updated = [...(proposal.phases as any[])];
                              updated[i] = { ...updated[i], name: val };
                              updateField('phases', updated);
                            }}
                            onDurationEdit={(val) => {
                              const updated = [...(proposal.phases as any[])];
                              updated[i] = { ...updated[i], duration: val };
                              updateField('phases', updated);
                            }}
                            onDescriptionEdit={(val) => {
                              const updated = [...(proposal.phases as any[])];
                              updated[i] = { ...updated[i], description: val };
                              updateField('phases', updated);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-10 text-center py-12">
                        <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                        <p className="text-[#999]" style={{ fontSize: '15px' }}>No timeline generated yet</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Generate project phases based on your selected services.</p>
                        <button
                          onClick={async () => {
                            try {
                              const serviceNames = services.map(s => ({ name: s.module?.name || 'Service' }));
                              const durationMatch = (proposal.estimated_duration || '16 weeks').match(/(\d+)/);
                              const totalWeeks = durationMatch ? parseInt(durationMatch[1]) : 16;
                              const { data } = await supabase.functions.invoke('generate-timeline', {
                                body: {
                                  services: serviceNames,
                                  clientName: client?.company_name || 'Client',
                                  totalWeeks,
                                },
                              });
                              if (data?.phases) {
                                await updateField('phases', data.phases);
                                toast.success('Timeline generated!');
                              }
                            } catch {
                              toast.error('Failed to generate timeline');
                            }
                          }}
                          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white"
                          style={{ backgroundColor: '#2A2118' }}
                        >
                          Generate Timeline
                        </button>
                      </div>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 4: Investment */}
              <SectionWrapper idx={4} hidden={hiddenSections.has(4)} onToggle={toggleSection} label="Investment">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="05">
                    <SectionHeader number="04" title="Investment" subtitle="Transparent pricing for every deliverable" />
                    <PricingSummary
                      items={pricingItems}
                      total={totalStr}
                      totalBreakdown={totalBreakdown}
                      validUntil={validUntil}
                      brandColor={agency?.brand_color || '#fc956e'}
                      bundleSavings={(proposal.bundle_savings ?? 0) > 0 ? {
                        bundleName: 'Bundle',
                        individualTotal: `${currencySymbol}${((proposal.grand_total || 0) + (proposal.bundle_savings || 0)).toLocaleString()}`,
                        bundlePrice: `${currencySymbol}${(proposal.grand_total || 0).toLocaleString()}`,
                        savings: `-${currencySymbol}${(proposal.bundle_savings || 0).toLocaleString()}`,
                      } : undefined}
                      onPriceEdit={async (index, newPrice) => {
                        const svc = services[index];
                        if (!svc || !proposal) return;
                        await supabase.from('proposal_services').update({ price_override: newPrice }).eq('id', svc.id);
                        const updated = services.map((s, i) => i === index ? { ...s, price_override: newPrice } : s);
                        setServices(updated);
                        const newFixed = updated.filter(s => s.module?.pricing_model === 'fixed').reduce((sum, s) => sum + getServicePrice(s), 0);
                        const newMonthly = updated.filter(s => s.module?.pricing_model === 'monthly').reduce((sum, s) => sum + getServicePrice(s), 0);
                        await supabase.from('proposals').update({ total_fixed: newFixed, total_monthly: newMonthly, grand_total: newFixed + newMonthly }).eq('id', proposal.id);
                        setProposal(prev => prev ? { ...prev, total_fixed: newFixed, total_monthly: newMonthly, grand_total: newFixed + newMonthly } : prev);
                        toast.success('Price updated');
                      }}
                    />
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 5: Terms */}
              <SectionWrapper idx={5} hidden={hiddenSections.has(5)} onToggle={toggleSection} label="Terms & Conditions">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="06">
                    <SectionHeader number="05" title="Terms & Conditions" />
                    {termsClauses.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-muted-foreground" style={{ fontSize: '15px' }}>No terms & conditions configured.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm text-brand hover:text-brand-hover">Add in Settings →</Link>
                      </div>
                    ) : (
                      <TermsSection clauses={termsClauses.map(c => ({ title: c.title, content: c.content }))} />
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 6: Why Us */}
              <SectionWrapper idx={6} hidden={hiddenSections.has(6)} onToggle={toggleSection} label="Why Us">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="07">
                    <SectionHeader number="06" title="Why Us" subtitle="What sets us apart" />
                    
                    {/* About text — editable, shared across proposals */}
                    <div className="mb-10">
                      <TextContent>
                        <EditableText
                          value={agency?.about_text || ''}
                          placeholder={getDefaultAboutText(agency?.years_experience)}
                          onSave={(val) => {
                            if (agency?.id) {
                              supabase.from('agencies').update({ about_text: val }).eq('id', agency.id);
                            }
                          }}
                          as="p"
                          className="min-h-[60px]"
                        />
                      </TextContent>
                      <p className="mt-2 text-[10px] text-muted-foreground print:hidden">
                        This text is shared across all proposals. <Link to="/settings/agency" className="underline hover:text-foreground">Edit in Settings</Link> to change it globally.
                      </p>
                    </div>

                    {differentiators.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-muted-foreground" style={{ fontSize: '15px' }}>Add differentiators in Settings to build trust.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm text-brand hover:text-brand-hover">Settings →</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {differentiators.map((d, i) => (
                          <WhyUsCard
                            key={d.id}
                            title={d.title}
                            description={d.description || ''}
                            statValue={d.stat_value}
                            statLabel={d.stat_label}
                            icon={d.icon}
                            delay={i * 0.1}
                          />
                        ))}
                      </div>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 7: Testimonials */}
              <SectionWrapper idx={7} hidden={hiddenSections.has(7)} onToggle={toggleSection} label="Testimonials">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="08">
                    <SectionHeader number="07" title="What Our Clients Say" subtitle="Proof of impact" />
                    {testimonials.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-muted-foreground" style={{ fontSize: '15px' }}>Add testimonials in Settings to build credibility.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm text-brand hover:text-brand-hover">Settings →</Link>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {testimonials.slice(0, 4).map((t, i) => (
                          <TestimonialCard
                            key={t.id}
                            clientName={t.client_name}
                            clientTitle={t.client_title}
                            clientCompany={t.client_company}
                            quote={t.quote}
                            metricValue={t.metric_value}
                            metricLabel={t.metric_label}
                            avatarUrl={t.avatar_url}
                            featured={i === 0}
                            delay={i * 0.1}
                          />
                        ))}
                      </div>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 8: Signature */}
              <SectionWrapper idx={8} hidden={hiddenSections.has(8)} onToggle={toggleSection} label="Signature">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="09">
                    <SignatureBlock
                      client={{
                        role: 'Client',
                        companyName: client?.company_name || 'Client',
                        personName: client?.contact_name,
                        title: client?.contact_title,
                      }}
                      agency={{
                        role: 'Agency',
                        companyName: agency?.name || 'Agency',
                      }}
                    />
                  </PageWrapper>
                </div>
              </SectionWrapper>

            </div>
          </BrandProvider>
          </TemplateProvider>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm print:hidden" onClick={() => { setShowAddService(false); setAddServiceSearch(''); }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-base font-bold text-foreground">Add Service</h3>
              <button onClick={() => { setShowAddService(false); setAddServiceSearch(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search services..." value={addServiceSearch} onChange={e => setAddServiceSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1">
              {availableModules
                .filter(m => !services.some(s => s.module_id === m.id))
                .filter(m => !addServiceSearch || m.name.toLowerCase().includes(addServiceSearch.toLowerCase()))
                .map(mod => (
                  <button key={mod.id} onClick={() => addService(mod)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium text-foreground">{mod.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.short_description || mod.description?.slice(0, 60) || ''}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {currencySymbol}{(mod.price_fixed ?? mod.price_monthly ?? mod.price_hourly ?? 0).toLocaleString()}
                        {mod.pricing_model === 'monthly' ? '/mo' : mod.pricing_model === 'hourly' ? '/hr' : ''}
                      </p>
                      <span className={cn('text-[10px] uppercase tracking-wider font-medium',
                        mod.pricing_model === 'fixed' ? 'text-status-info' : mod.pricing_model === 'monthly' ? 'text-status-success' : 'text-status-warning'
                      )}>{mod.pricing_model}</span>
                    </div>
                  </button>
                ))}
              {availableModules.filter(m => !services.some(s => s.module_id === m.id)).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">All services are already added</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          proposal={proposal}
          client={client}
          agency={agency}
          onClose={() => setShowShareModal(false)}
          onStatusUpdate={(status) => setProposal(prev => prev ? { ...prev, status } : prev)}
        />
      )}
    </div>
  );
}

// Share Modal Component
function ShareModal({ proposal, client, agency, onClose, onStatusUpdate }: {
  proposal: ProposalData; client: any; agency: any; onClose: () => void; onStatusUpdate: (status: string) => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const contactFirst = client?.contact_name?.split(' ')[0] || 'there';
  const agencyName = agency?.name || 'Our Agency';
  const proposalTitle = proposal.title || 'our proposal';

  const [emailSubject, setEmailSubject] = useState(`${agencyName} — ${proposalTitle}`);
  const [emailBody, setEmailBody] = useState('');

  const ensureShareLink = async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    setGenerating(true);
    setLinkError(false);
    try {
      const shareId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (proposal.validity_days || 30));
      const { error } = await supabase.from('proposal_shares').insert({
        proposal_id: proposal.id,
        share_id: shareId,
        share_type: 'link',
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;
      const url = `${window.location.origin}/p/${shareId}`;
      setShareUrl(url);
      if (proposal.status === 'draft') {
        await supabase.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', proposal.id);
        onStatusUpdate('sent');
      }
      setGenerating(false);
      return url;
    } catch (err) {
      console.error('Share link error:', err);
      setLinkError(true);
      setGenerating(false);
      toast.error('Failed to generate share link. Please try again.');
      return null;
    }
  };

  const openEmailComposer = async () => {
    const url = await ensureShareLink();
    if (!url) return;
    setEmailBody(`Hi ${contactFirst},

Thank you for the opportunity to put this together. Please find our proposal for ${proposalTitle} — we've outlined our recommended approach, timeline, and investment.

You can view the full proposal here: ${url}

Happy to discuss any questions. Looking forward to hearing your thoughts.

Best regards,
${agencyName}`);
    setShowEmailComposer(true);
  };

  const handleSendEmail = () => {
    const mailto = `mailto:${encodeURIComponent(client?.contact_email || '')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_self');
  };

  const copyEmailBody = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
      setCopiedEmail(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const copyLink = async () => {
    const url = await ensureShareLink();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (showEmailComposer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm print:hidden" onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display text-base font-bold text-foreground">Send Proposal</h3>
            <button onClick={() => setShowEmailComposer(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {client?.contact_email || <span className="text-muted-foreground italic">No email on file</span>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cover Message</label>
              <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <button onClick={() => setShowEmailComposer(false)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
            <div className="flex items-center gap-2">
              <button onClick={copyEmailBody}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
                {copiedEmail ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><LinkIcon className="h-3.5 w-3.5" /> Copy Email</>}
              </button>
              <button onClick={handleSendEmail} disabled={!client?.contact_email}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> Open in Email Client
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm print:hidden" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-foreground mb-4">Share Proposal</h3>
        <div className="space-y-3">
          <button onClick={() => window.print()} className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Download className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Download PDF</p>
              <p className="text-xs text-muted-foreground">Print or save as PDF</p>
            </div>
          </button>
          <button onClick={openEmailComposer} disabled={generating} className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm disabled:opacity-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Send className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{generating ? 'Preparing...' : 'Send via Email'}</p>
              <p className="text-xs text-muted-foreground">Compose with cover message template</p>
            </div>
          </button>

          {shareUrl ? (
            <div className="rounded-xl border border-brand/30 bg-accent/50 p-4">
              <p className="text-xs font-medium text-foreground mb-2">Share Link</p>
              <div className="flex items-center gap-2">
                <input readOnly value={shareUrl} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono" />
                <button onClick={copyLink} className="rounded-lg bg-brand px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-brand-hover">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Active until {new Date(Date.now() + (proposal.validity_days || 30) * 86400000).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <button
              onClick={copyLink}
              disabled={generating}
              className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <LinkIcon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{generating ? 'Generating...' : 'Copy Link'}</p>
                <p className="text-xs text-muted-foreground">Generate a shareable URL</p>
              </div>
            </button>
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}

function SectionWrapper({ idx, hidden, onToggle, label, children }: {
  idx: number; hidden: boolean; onToggle: (idx: number) => void; label: string; children: React.ReactNode;
}) {
  if (hidden) {
    return (
      <div id={`section-${idx}`} className="rounded-xl border border-dashed border-border bg-muted/20 p-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-muted-foreground">
          <EyeOff className="h-4 w-4" />
          <span className="text-sm">{label}</span>
          <span className="text-xs">(hidden from PDF)</span>
        </div>
        <button onClick={() => onToggle(idx)} className="text-xs text-brand hover:text-brand-hover">Show</button>
      </div>
    );
  }

  return (
    <div id={`section-${idx}`} className="group relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-card border border-border px-4 py-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 z-20 print:hidden">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="w-px h-4 bg-border" />
        <button onClick={() => onToggle(idx)} className="text-muted-foreground hover:text-foreground" title="Hide section">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}
