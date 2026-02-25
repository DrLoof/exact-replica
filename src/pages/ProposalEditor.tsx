import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Share2, Download, Send, LinkIcon,
  ChevronDown, ChevronUp, Clock, FileText, Check, DollarSign,
  Shield, Star, Calendar, Pen, RefreshCw, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';

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
}

interface ProposalService {
  id: string;
  module_id: string | null;
  bundle_id: string | null;
  price_override: number | null;
  display_order: number | null;
  is_addon: boolean | null;
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
  'Investment', 'Why Us', 'Testimonials', 'Terms', 'Signature',
];

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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const currencySymbol = agency?.currency_symbol || '$';

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

    // Load client
    if (propRes.data.client_id) {
      const { data: cl } = await supabase.from('clients').select('*').eq('id', propRes.data.client_id).single();
      setClient(cl);
    }

    // Map services
    const mapped = (svcRes.data || []).map((s: any) => ({
      ...s,
      module: s.service_modules,
    }));
    setServices(mapped);

    // Load agency content
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

  const updateField = async (field: string, value: any) => {
    if (!proposal) return;
    await supabase.from('proposals').update({ [field]: value }).eq('id', proposal.id);
    setProposal(prev => prev ? { ...prev, [field]: value } : prev);
    setEditingField(null);
  };

  const toggleSection = (idx: number) => {
    setHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
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

  // Pricing scenario detection
  const fixedServices = services.filter(s => s.module?.pricing_model === 'fixed');
  const monthlyServices = services.filter(s => s.module?.pricing_model === 'monthly');
  const hourlyServices = services.filter(s => s.module?.pricing_model === 'hourly');
  const isMixed = (fixedServices.length > 0 ? 1 : 0) + (monthlyServices.length > 0 ? 1 : 0) + (hourlyServices.length > 0 ? 1 : 0) > 1;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!proposal) return null;

  const sc = statusConfig[proposal.status || 'draft'] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/proposals')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium text-foreground">{proposal.title || 'Untitled Proposal'}</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', sc.className)}>{sc.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{proposal.reference_number}</span>
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
        <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-48 flex-col gap-1 overflow-y-auto border-r border-border p-3 lg:flex">
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

        {/* Proposal Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8">

            {/* Section 0: Cover */}
            <SectionWrapper idx={0} hidden={hiddenSections.has(0)} onToggle={toggleSection} label="Cover">
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                {agency?.logo_url && <img src={agency.logo_url} alt="Agency logo" className="mx-auto mb-6 h-12 object-contain" />}
                <h2
                  className="font-display text-3xl font-bold text-foreground cursor-text"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateField('title', e.currentTarget.textContent)}
                >
                  {proposal.title || 'Proposal Title'}
                </h2>
                <p
                  className="mt-2 text-lg text-muted-foreground cursor-text"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateField('subtitle', e.currentTarget.textContent)}
                >
                  {proposal.subtitle || 'Add a subtitle...'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <span>Prepared for <strong className="text-foreground">{client?.company_name || 'Client'}</strong></span>
                  <span>•</span>
                  <span>{new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </SectionWrapper>

            {/* Section 1: Executive Summary */}
            <SectionWrapper idx={1} hidden={hiddenSections.has(1)} onToggle={toggleSection} label="Executive Summary">
              <div className="rounded-xl border border-border bg-card p-6">
                <p
                  className="text-sm leading-relaxed text-foreground whitespace-pre-wrap cursor-text min-h-[80px]"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateField('executive_summary', e.currentTarget.textContent)}
                >
                  {proposal.executive_summary || 'Click to add an executive summary for this proposal. Describe the project goals, your approach, and expected outcomes.'}
                </p>
              </div>
            </SectionWrapper>

            {/* Section 2: Scope of Services */}
            <SectionWrapper idx={2} hidden={hiddenSections.has(2)} onToggle={toggleSection} label="Scope of Services">
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">No services added yet.</p>
                    <Link to={`/proposals/new`} className="mt-2 inline-block text-sm text-brand hover:text-brand-hover">
                      ← Go back to add services
                    </Link>
                  </div>
                ) : (
                  services.map((svc) => (
                    <div key={svc.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">{svc.module?.name || 'Service'}</h4>
                          <p className="mt-1 text-xs text-muted-foreground">{svc.module?.description || svc.module?.short_description || ''}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold tabular-nums text-foreground">
                            {currencySymbol}{getServicePrice(svc).toLocaleString()}{pricingSuffix(svc.module?.pricing_model)}
                          </span>
                          <span className={cn(
                            'ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium',
                            svc.module?.pricing_model === 'fixed' ? 'bg-status-info/15 text-status-info' :
                            svc.module?.pricing_model === 'monthly' ? 'bg-status-viewed/15 text-status-viewed' :
                            'bg-status-warning/15 text-status-warning'
                          )}>
                            {svc.module?.pricing_model || 'fixed'}
                          </span>
                        </div>
                      </div>
                      {svc.module?.deliverables && svc.module.deliverables.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {svc.module.deliverables.map((d, i) => (
                            <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SectionWrapper>

            {/* Section 3: Timeline */}
            <SectionWrapper idx={3} hidden={hiddenSections.has(3)} onToggle={toggleSection} label="Timeline">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Start: <strong className="text-foreground">{proposal.project_start_date ? new Date(proposal.project_start_date).toLocaleDateString() : 'TBD'}</strong></span>
                  {proposal.estimated_duration && (
                    <>
                      <span>•</span>
                      <span>Duration: <strong className="text-foreground">{proposal.estimated_duration}</strong></span>
                    </>
                  )}
                </div>
                {proposal.phases && Array.isArray(proposal.phases) && (
                  <div className="mt-4 space-y-2">
                    {(proposal.phases as any[]).map((phase: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">{i + 1}</div>
                        <span className="text-sm text-foreground">{phase.name}</span>
                        {phase.duration && <span className="ml-auto text-xs text-muted-foreground">{phase.duration}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionWrapper>

            {/* Section 4: Investment */}
            <SectionWrapper idx={4} hidden={hiddenSections.has(4)} onToggle={toggleSection} label="Investment">
              <div className="rounded-xl border border-border bg-card p-6">
                {isMixed ? (
                  <>
                    {fixedServices.length > 0 && (
                      <div className="mb-4">
                        <p className="label-overline mb-2">Project Fees</p>
                        {fixedServices.map(s => (
                          <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <span className="text-sm text-foreground">{s.module?.name}</span>
                            <span className="text-sm font-semibold tabular-nums text-foreground">{currencySymbol}{getServicePrice(s).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2 font-semibold">
                          <span className="text-sm text-muted-foreground">Subtotal</span>
                          <span className="text-sm tabular-nums text-foreground">{currencySymbol}{fixedServices.reduce((sum, s) => sum + getServicePrice(s), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {monthlyServices.length > 0 && (
                      <div className="mb-4">
                        <p className="label-overline mb-2">Monthly Retainers</p>
                        {monthlyServices.map(s => (
                          <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <span className="text-sm text-foreground">{s.module?.name}</span>
                            <span className="text-sm font-semibold tabular-nums text-foreground">{currencySymbol}{getServicePrice(s).toLocaleString()}/mo</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2 font-semibold">
                          <span className="text-sm text-muted-foreground">Subtotal</span>
                          <span className="text-sm tabular-nums text-foreground">{currencySymbol}{monthlyServices.reduce((sum, s) => sum + getServicePrice(s), 0).toLocaleString()}/mo</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mb-4">
                    {services.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm text-foreground">{s.module?.name}</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {currencySymbol}{getServicePrice(s).toLocaleString()}{pricingSuffix(s.module?.pricing_model)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {(proposal.bundle_savings ?? 0) > 0 && (
                  <div className="flex items-center justify-between py-2 text-status-success">
                    <span className="text-sm font-medium">Bundle Savings</span>
                    <span className="text-sm font-semibold tabular-nums">-{currencySymbol}{(proposal.bundle_savings || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t-2 border-foreground pt-3">
                  <span className="text-base font-bold text-foreground">Total Investment</span>
                  <span className="font-display text-xl font-bold tabular-nums text-foreground">
                    {(proposal.total_fixed ?? 0) > 0 && `${currencySymbol}${(proposal.total_fixed || 0).toLocaleString()}`}
                    {(proposal.total_fixed ?? 0) > 0 && (proposal.total_monthly ?? 0) > 0 && ' + '}
                    {(proposal.total_monthly ?? 0) > 0 && `${currencySymbol}${(proposal.total_monthly || 0).toLocaleString()}/mo`}
                    {(proposal.total_fixed ?? 0) === 0 && (proposal.total_monthly ?? 0) === 0 && `${currencySymbol}0`}
                  </span>
                </div>
              </div>
            </SectionWrapper>

            {/* Section 5: Why Us */}
            <SectionWrapper idx={5} hidden={hiddenSections.has(5)} onToggle={toggleSection} label="Why Us">
              <div className="rounded-xl border border-border bg-card p-6">
                {differentiators.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Add differentiators in Settings to build trust</p>
                    <Link to="/settings" className="mt-1 inline-block text-sm text-brand hover:text-brand-hover">Settings →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {differentiators.map((d) => (
                      <div key={d.id} className="rounded-lg bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-foreground">{d.title}</p>
                        {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
                        {d.stat_value && (
                          <div className="mt-2">
                            <span className="font-display text-lg font-bold text-brand">{d.stat_value}</span>
                            {d.stat_label && <span className="ml-1 text-xs text-muted-foreground">{d.stat_label}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionWrapper>

            {/* Section 6: Testimonials */}
            <SectionWrapper idx={6} hidden={hiddenSections.has(6)} onToggle={toggleSection} label="Testimonials">
              <div className="rounded-xl border border-border bg-card p-6">
                {testimonials.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Add testimonials in Settings to build credibility</p>
                    <Link to="/settings" className="mt-1 inline-block text-sm text-brand hover:text-brand-hover">Settings →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testimonials.slice(0, 3).map((t) => (
                      <div key={t.id} className="rounded-lg bg-muted/30 p-4">
                        <p className="text-sm italic text-foreground">"{t.quote}"</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
                            {t.client_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{t.client_name}</p>
                            {t.client_title && <p className="text-[10px] text-muted-foreground">{t.client_title}{t.client_company ? `, ${t.client_company}` : ''}</p>}
                          </div>
                          {t.metric_value && (
                            <div className="ml-auto text-right">
                              <p className="font-display text-sm font-bold text-brand">{t.metric_value}</p>
                              {t.metric_label && <p className="text-[10px] text-muted-foreground">{t.metric_label}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionWrapper>

            {/* Section 7: Terms */}
            <SectionWrapper idx={7} hidden={hiddenSections.has(7)} onToggle={toggleSection} label="Terms & Conditions">
              <div className="rounded-xl border border-border bg-card p-6">
                {termsClauses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No terms & conditions configured. Add them in Settings.</p>
                ) : (
                  <div className="space-y-4">
                    {termsClauses.map((clause) => (
                      <details key={clause.id} className="group">
                        <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
                          {clause.title}
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{clause.content}</p>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </SectionWrapper>

            {/* Section 8: Signature */}
            <SectionWrapper idx={8} hidden={hiddenSections.has(8)} onToggle={toggleSection} label="Signature">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="label-overline mb-3">Agency</p>
                    <p className="text-sm font-semibold text-foreground">{agency?.name || 'Agency'}</p>
                    {agency?.email && <p className="text-xs text-muted-foreground">{agency.email}</p>}
                    {agency?.phone && <p className="text-xs text-muted-foreground">{agency.phone}</p>}
                    <div className="mt-6 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Signature</p>
                    </div>
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground">Date: _______________</p>
                    </div>
                  </div>
                  <div>
                    <p className="label-overline mb-3">Client</p>
                    <p className="text-sm font-semibold text-foreground">{client?.company_name || 'Client'}</p>
                    {client?.contact_name && <p className="text-xs text-muted-foreground">{client.contact_name}</p>}
                    {client?.contact_email && <p className="text-xs text-muted-foreground">{client.contact_email}</p>}
                    <div className="mt-6 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Signature</p>
                    </div>
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground">Date: _______________</p>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Valid for {proposal.validity_days || 30} days from {new Date(proposal.created_at).toLocaleDateString()}
                </p>
              </div>
            </SectionWrapper>

          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Share Proposal</h3>
            <div className="space-y-3">
              <button className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Download className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Download PDF</p>
                  <p className="text-xs text-muted-foreground">Export as PDF document</p>
                </div>
              </button>
              <button className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Send className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Send via Email</p>
                  <p className="text-xs text-muted-foreground">Send to {client?.contact_email || 'client'}</p>
                </div>
              </button>
              <button className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <LinkIcon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Copy Link</p>
                  <p className="text-xs text-muted-foreground">Generate a shareable URL</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Section wrapper with hover toolbar
function SectionWrapper({ idx, hidden, onToggle, label, children }: {
  idx: number; hidden: boolean; onToggle: (idx: number) => void; label: string; children: React.ReactNode;
}) {
  if (hidden) {
    return (
      <div id={`section-${idx}`} className="rounded-xl border border-dashed border-border bg-muted/20 p-4 flex items-center justify-between">
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
      <div className="absolute -top-2 left-4 right-4 flex items-center justify-between rounded-lg bg-card border border-border px-3 py-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 z-10">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(idx)} className="text-muted-foreground hover:text-foreground" title="Hide section">
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
