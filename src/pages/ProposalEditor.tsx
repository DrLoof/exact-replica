import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Share2, Download, Send, LinkIcon,
  ChevronDown, FileText, Check, DollarSign, Clock,
  RefreshCw, MoreHorizontal,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
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
} from '@/components/proposal-template';

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

  const updateField = async (field: string, value: any) => {
    if (!proposal) return;
    await supabase.from('proposals').update({ [field]: value }).eq('id', proposal.id);
    setProposal(prev => prev ? { ...prev, [field]: value } : prev);
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
                  />
                </div>
              </SectionWrapper>

              {/* Section 1: Executive Summary */}
              <SectionWrapper idx={1} hidden={hiddenSections.has(1)} onToggle={toggleSection} label="Executive Summary">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="02">
                    <SectionHeader number="01" title="Executive Summary" subtitle="Our understanding and approach" />
                    <TextContent dropCap>
                      <p
                        className="cursor-text min-h-[80px] outline-none"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('executive_summary', e.currentTarget.textContent)}
                      >
                        {proposal.executive_summary || 'Click to add an executive summary for this proposal. Describe the project goals, your approach, and expected outcomes.'}
                      </p>
                    </TextContent>

                    {/* Key highlights */}
                    <div className="mt-12">
                      <HighlightPanel
                        items={[
                          { label: 'Investment', value: totalStr, accent: true },
                          { label: 'Timeline', value: proposal.estimated_duration || `${services.length * 2} weeks est.` },
                          { label: 'Services', value: `${services.length} included` },
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
                        <Link to="/proposals/new" className="mt-2 inline-block text-sm" style={{ color: agency?.brand_color || '#fc956e' }}>
                          ← Go back to add services
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {services.map((svc, i) => (
                          <ServiceCard
                            key={svc.id}
                            icon={resolveIcon(svc.module?.icon)}
                            name={svc.module?.name || 'Service'}
                            price={`${currencySymbol}${getServicePrice(svc).toLocaleString()}`}
                            pricingModel={(svc.module?.pricing_model || 'fixed') as any}
                            description={svc.module?.description || svc.module?.short_description || ''}
                            deliverables={svc.module?.deliverables || []}
                            isAddon={svc.is_addon || false}
                            delay={i * 0.1}
                          />
                        ))}
                      </div>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 3: Timeline */}
              <SectionWrapper idx={3} hidden={hiddenSections.has(3)} onToggle={toggleSection} label="Timeline">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="04">
                    <SectionHeader number="03" title="Timeline" subtitle="How we'll get there" />
                    {proposal.phases && Array.isArray(proposal.phases) && (proposal.phases as any[]).length > 0 ? (
                      <div>
                        {(proposal.phases as any[]).map((phase: any, i: number) => (
                          <TimelineStep
                            key={i}
                            number={i + 1}
                            name={phase.name || `Phase ${i + 1}`}
                            duration={phase.duration || 'TBD'}
                            description={phase.description}
                            isLast={i === (proposal.phases as any[]).length - 1}
                            delay={i * 0.1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-10">
                        <HighlightPanel
                          items={[
                            { label: 'Start Date', value: proposal.project_start_date ? new Date(proposal.project_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD' },
                            { label: 'Duration', value: proposal.estimated_duration || `~${Math.max(services.length * 2, 4)} weeks` },
                            { label: 'Revisions', value: `${proposal.revision_rounds ?? 2} rounds` },
                          ]}
                        />
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
                    />
                  </PageWrapper>
                </div>
              </SectionWrapper>

              {/* Section 5: Why Us */}
              <SectionWrapper idx={5} hidden={hiddenSections.has(5)} onToggle={toggleSection} label="Why Us">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="06">
                    <SectionHeader number="05" title="Why Us" subtitle="What sets us apart" />
                    {differentiators.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-[#999]" style={{ fontSize: '15px' }}>Add differentiators in Settings to build trust.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm" style={{ color: agency?.brand_color || '#fc956e' }}>Settings →</Link>
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

              {/* Section 6: Testimonials */}
              <SectionWrapper idx={6} hidden={hiddenSections.has(6)} onToggle={toggleSection} label="Testimonials">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="07">
                    <SectionHeader number="06" title="What Our Clients Say" subtitle="Proof of impact" />
                    {testimonials.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-[#999]" style={{ fontSize: '15px' }}>Add testimonials in Settings to build credibility.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm" style={{ color: agency?.brand_color || '#fc956e' }}>Settings →</Link>
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

              {/* Section 7: Terms */}
              <SectionWrapper idx={7} hidden={hiddenSections.has(7)} onToggle={toggleSection} label="Terms & Conditions">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="08">
                    <SectionHeader number="07" title="Terms & Conditions" />
                    {termsClauses.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-[#999]" style={{ fontSize: '15px' }}>No terms & conditions configured.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm" style={{ color: agency?.brand_color || '#fc956e' }}>Add in Settings →</Link>
                      </div>
                    ) : (
                      <TermsSection clauses={termsClauses.map(c => ({ title: c.title, content: c.content }))} />
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
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          proposal={proposal}
          client={client}
          onClose={() => setShowShareModal(false)}
          onStatusUpdate={(status) => setProposal(prev => prev ? { ...prev, status } : prev)}
        />
      )}
    </div>
  );
}

// Share Modal Component
function ShareModal({ proposal, client, onClose, onStatusUpdate }: {
  proposal: ProposalData; client: any; onClose: () => void; onStatusUpdate: (status: string) => void;
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    setGenerating(true);
    const shareId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (proposal.validity_days || 30));

    const { error } = await supabase.from('proposal_shares').insert({
      proposal_id: proposal.id,
      share_id: shareId,
      share_type: 'link',
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error('Failed to generate link');
    } else {
      const url = `${window.location.origin}/p/${shareId}`;
      setShareUrl(url);
      if (proposal.status === 'draft') {
        await supabase.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', proposal.id);
        onStatusUpdate('sent');
      }
    }
    setGenerating(false);
  };

  const sendViaEmail = async () => {
    // Generate link first if needed
    let url = shareUrl;
    if (!url) {
      setGenerating(true);
      const shareId = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (proposal.validity_days || 30));
      const { error } = await supabase.from('proposal_shares').insert({
        proposal_id: proposal.id,
        share_id: shareId,
        share_type: 'email',
        recipient_email: client?.contact_email || null,
        expires_at: expiresAt.toISOString(),
      });
      if (error) { toast.error('Failed to generate link'); setGenerating(false); return; }
      url = `${window.location.origin}/p/${shareId}`;
      setShareUrl(url);
      if (proposal.status === 'draft') {
        await supabase.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', proposal.id);
        onStatusUpdate('sent');
      }
      setGenerating(false);
    }

    const subject = encodeURIComponent(`${proposal.title || 'Proposal'} — ${proposal.reference_number}`);
    const body = encodeURIComponent(
      `Hi${client?.contact_name ? ' ' + client.contact_name : ''},\n\nPlease find your proposal here:\n${url}\n\nLooking forward to hearing from you.\n\nBest regards`
    );
    const to = client?.contact_email || '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

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
          <button onClick={sendViaEmail} disabled={generating} className="flex w-full items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-brand/30 hover:shadow-sm disabled:opacity-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Send className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{generating ? 'Preparing...' : 'Send via Email'}</p>
              <p className="text-xs text-muted-foreground">Send to {client?.contact_email || 'client'}</p>
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
              onClick={generateShareLink}
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
