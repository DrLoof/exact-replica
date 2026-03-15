import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  BrandProvider,
  HeroCover,
  SectionHeader,
  TextContent,
  HighlightPanel,
  BundleCard,
  ServiceCard,
  PricingSummary,
  TimelineStep,
  TermsSection,
  WhyUsCard,
  TestimonialCard,
  SignatureBlock,
  PageWrapper,
  TeamMemberCard,
} from '@/components/proposal-template';
import { TemplateProvider } from '@/components/proposal-template/TemplateProvider';

export default function PublicProposal() {
  const { shareId } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [agency, setAgency] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [differentiators, setDifferentiators] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [termsClauses, setTermsClauses] = useState<any[]>([]);
  const [timelinePhases, setTimelinePhases] = useState<any[]>([]);
  const [paymentTemplates, setPaymentTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (shareId) loadProposal();
  }, [shareId]);

  const loadProposal = async () => {
    const { data: share } = await supabase
      .from('proposal_shares')
      .select('*')
      .eq('share_id', shareId!)
      .eq('is_active', true)
      .single();

    if (!share) { setExpired(true); setLoading(false); return; }
    if (share.expires_at && new Date(share.expires_at) < new Date()) { setExpired(true); setLoading(false); return; }

    const { data: prop } = await supabase.from('proposals').select('*').eq('id', share.proposal_id).single();
    if (!prop) { setExpired(true); setLoading(false); return; }
    setProposal(prop);

    if (prop.status === 'sent') {
      await supabase.from('proposals').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', prop.id);
    }
    await supabase.from('proposal_analytics').insert({
      proposal_id: prop.id,
      event_type: 'view',
      user_agent: navigator.userAgent,
    });

    const [agencyRes, clientRes, svcRes, diffRes, testRes, termsRes, phasesRes, ptRes] = await Promise.all([
      prop.agency_id ? supabase.from('agencies').select('*').eq('id', prop.agency_id).single() : { data: null },
      prop.client_id ? supabase.from('clients').select('*').eq('id', prop.client_id).single() : { data: null },
      supabase.from('proposal_services').select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, client_responsibilities, out_of_scope, icon, service_type)').eq('proposal_id', prop.id).order('display_order'),
      prop.agency_id ? supabase.from('differentiators').select('*').eq('agency_id', prop.agency_id).order('display_order') : { data: [] },
      prop.agency_id ? supabase.from('testimonials').select('*').eq('agency_id', prop.agency_id).order('created_at', { ascending: false }) : { data: [] },
      prop.agency_id ? supabase.from('terms_clauses').select('*').eq('agency_id', prop.agency_id).order('display_order') : { data: [] },
      prop.agency_id ? supabase.from('timeline_phases').select('*').eq('agency_id', prop.agency_id).order('display_order') : { data: [] },
      prop.agency_id ? supabase.from('payment_templates').select('*').eq('agency_id', prop.agency_id).eq('is_default', true).limit(1) : { data: [] },
    ]);

    setAgency(agencyRes.data);
    setClient(clientRes.data);
    setServices((svcRes.data || []).map((s: any) => ({ ...s, module: s.service_modules })));
    setDifferentiators(diffRes.data || []);
    setTestimonials(testRes.data || []);
    setTermsClauses(termsRes.data || []);
    setTimelinePhases(phasesRes.data || []);
    setPaymentTemplates(ptRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc956e] border-t-transparent" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-[#f59e0b]" />
          <h1 className="mt-4 text-2xl font-bold text-[#0A0A0A]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Proposal Expired</h1>
          <p className="mt-2 text-sm text-[#888]">This proposal link is no longer active. Please contact the agency for an updated version.</p>
        </div>
      </div>
    );
  }

  const brandColor = agency?.brand_color || '#fc956e';
  const darkColor = agency?.dark_color || '#0A0A0A';
  const currencySymbol = agency?.currency_symbol || '$';

  const brandData = {
    agencyName: agency?.name?.toUpperCase() || 'AGENCY',
    agencyFullName: agency?.name || 'Your Agency',
    primaryColor: brandColor,
    darkColor,
    logoUrl: agency?.logo_url || null,
    logoInitial: (agency?.name || 'A').charAt(0).toUpperCase(),
    contactEmail: agency?.email || '',
    contactWebsite: agency?.website || '',
    contactPhone: agency?.phone || '',
    currency: currencySymbol,
  };

  const getPrice = (s: any) => s.price_override ?? s.module?.price_fixed ?? s.module?.price_monthly ?? s.module?.price_hourly ?? 0;
  const formatPrice = (n: number) => `${currencySymbol}${n.toLocaleString()}`;

  // Build pricing items
  const pricingItems = services.map((s: any) => {
    const model = s.module?.pricing_model || 'fixed';
    const price = getPrice(s);
    const suffix = model === 'monthly' ? '/mo' : model === 'hourly' ? '/hr' : '';
    return {
      service: s.module?.name || 'Service',
      price: `${formatPrice(price)}${suffix}`,
      note: s.module?.short_description || undefined,
      model: model as any,
      isAddon: s.is_addon || s.module?.service_type === 'addon',
      isBundled: !!s.bundle_id,
    };
  });

  // Total display
  const totalFixed = services.filter((s: any) => s.module?.pricing_model === 'fixed').reduce((sum: number, s: any) => sum + getPrice(s), 0);
  const totalMonthly = services.filter((s: any) => s.module?.pricing_model === 'monthly').reduce((sum: number, s: any) => sum + getPrice(s), 0);
  const totalHourly = services.filter((s: any) => s.module?.pricing_model === 'hourly').reduce((sum: number, s: any) => sum + getPrice(s), 0);

  let totalStr = '';
  const parts: string[] = [];
  if (totalFixed > 0) parts.push(formatPrice(totalFixed));
  if (totalMonthly > 0) parts.push(`${formatPrice(totalMonthly)}/mo`);
  if (totalHourly > 0) parts.push(`${formatPrice(totalHourly)}/hr est.`);
  totalStr = parts.join(' + ') || formatPrice(0);

  const totalBreakdown = parts.length > 1
    ? `${totalFixed > 0 ? `${formatPrice(totalFixed)} project fees` : ''}${totalFixed > 0 && totalMonthly > 0 ? ' + ' : ''}${totalMonthly > 0 ? `${formatPrice(totalMonthly)}/mo ongoing retainer` : ''}`
    : undefined;

  // Payment terms
  const defaultPT = paymentTemplates[0];
  const paymentTerms = defaultPT?.milestones
    ? (defaultPT.milestones as any[]).map((m: any) => ({
        label: m.label,
        amount: totalFixed > 0 ? formatPrice(Math.round(totalFixed * (m.percentage / 100))) : undefined,
      }))
    : undefined;

  const validUntil = proposal.validity_days
    ? new Date(new Date(proposal.created_at).getTime() + proposal.validity_days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : undefined;

  // Bundle savings
  const bundleSavings = (proposal.bundle_savings ?? 0) > 0
    ? {
        bundleName: 'Package',
        individualTotal: formatPrice((proposal.grand_total || 0) + (proposal.bundle_savings || 0)),
        bundlePrice: formatPrice(proposal.grand_total || 0),
        savings: `Save ${formatPrice(proposal.bundle_savings || 0)}`,
      }
    : undefined;

  // Timeline phases from proposal or agency defaults
  const phases = proposal.phases && Array.isArray(proposal.phases) && proposal.phases.length > 0
    ? proposal.phases as any[]
    : timelinePhases;

  // Featured testimonial (first one)
  const featuredTestimonial = testimonials[0];
  const otherTestimonials = testimonials.slice(1, 4);

  const proposalDate = new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Highlight panel for executive summary
  const summaryHighlights = [
    { label: 'Services', value: `${services.length} modules` },
    { label: 'Timeline', value: proposal.estimated_duration || `~${phases.length * 2} weeks` },
    { label: 'Investment', value: totalStr, accent: true },
    { label: 'Goal', value: proposal.client_goal || 'Grow the business' },
  ];

  return (
    <TemplateProvider templateId={proposal?.template_id || 'classic'} customColors={proposal?.custom_colors || null}>
    <BrandProvider brand={brandData}>
      <div className="min-h-screen bg-white">
        {/* Section 1: Cover */}
        <HeroCover
          proposalTitle={proposal.title || `Proposal for ${client?.company_name || 'Client'}`}
          subtitle={proposal.subtitle || undefined}
          clientName={client?.company_name || 'Client'}
          date={proposalDate}
          proposalNumber={proposal.reference_number}
        />

        {/* Section 2: Executive Summary */}
        <PageWrapper pageNumber="02">
          <SectionHeader
            number="01"
            title="Executive Summary"
            subtitle="An overview of our recommended approach and expected outcomes."
          />
          <div className="mb-10">
            <TextContent>
              {proposal.executive_summary ||
                `We're excited to present this proposal for ${client?.company_name || 'your organization'}. Based on our understanding of your needs, we've put together a tailored package of services designed to deliver measurable results and support your growth objectives.`}
            </TextContent>
          </div>
          <HighlightPanel items={summaryHighlights} variant="accent" />
        </PageWrapper>

        {/* Section 3: Scope of Services */}
        {services.length > 0 && (
          <PageWrapper pageNumber="03">
            <SectionHeader
              number="02"
              title="Scope of Services"
              subtitle="Each service is designed to work independently or as part of the complete strategy."
            />

            {/* Bundle card if there are bundled services */}
            {services.some((s: any) => s.bundle_id) && bundleSavings && (
              <div className="mb-8">
                <BundleCard
                  name="Service Package"
                  tagline="Combined services for maximum impact"
                  includedServices={services.filter((s: any) => s.bundle_id).map((s: any) => s.module?.name || 'Service')}
                  bundlePrice={bundleSavings.bundlePrice}
                  individualPrice={bundleSavings.individualTotal}
                  savings={bundleSavings.savings}
                  brandColor={brandColor}
                />
              </div>
            )}

            {/* Service cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((svc: any, idx: number) => (
                <ServiceCard
                  key={svc.id}
                  icon={<Layers size={22} />}
                  name={svc.module?.name || 'Service'}
                  price={formatPrice(getPrice(svc))}
                  pricingModel={svc.module?.pricing_model || 'fixed'}
                  description={svc.module?.description || svc.module?.short_description || ''}
                  deliverables={svc.module?.deliverables || []}
                  clientResponsibilities={svc.module?.client_responsibilities || []}
                  outOfScope={svc.module?.out_of_scope || []}
                  isAddon={svc.is_addon || svc.module?.service_type === 'addon'}
                  delay={idx * 0.08}
                />
              ))}
            </div>
          </PageWrapper>
        )}

        {/* Section 4: Timeline */}
        {phases.length > 0 && (
          <PageWrapper pageNumber="04">
            <SectionHeader
              number="03"
              title="Timeline"
              subtitle="A phased approach ensuring quality delivery at every stage."
            />
            {(() => {
              const startDateStr = proposal.project_start_date
                ? new Date(proposal.project_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'TBD';
              const durationMatch = (proposal.estimated_duration || '16 weeks').match(/(\d+)/);
              const tw = durationMatch ? parseInt(durationMatch[1]) : phases.length * 3;
              const launchDate = proposal.project_start_date
                ? new Date(new Date(proposal.project_start_date).getTime() + tw * 7 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'TBD';
              return (
                <HighlightPanel
                  items={[
                    { label: 'Project Start', value: startDateStr },
                    { label: 'Total Duration', value: `${tw} Weeks` },
                    { label: 'Projected Launch', value: launchDate, accent: true },
                  ]}
                  variant="default"
                />
              );
            })()}
            <div className="mt-10">
              {phases.map((phase: any, idx: number) => (
                <TimelineStep
                  key={idx}
                  number={idx + 1}
                  name={phase.name}
                  duration={phase.duration || phase.default_duration || '2 weeks'}
                  description={phase.description}
                  isLast={idx === phases.length - 1}
                  delay={idx * 0.1}
                />
              ))}
            </div>
          </PageWrapper>
        )}

        {/* Section 5: Investment */}
        {services.length > 0 && (
          <PageWrapper pageNumber="05">
            <SectionHeader
              number="04"
              title="Investment"
              subtitle="Transparent pricing for every phase of the engagement."
            />
            <PricingSummary
              items={pricingItems}
              total={totalStr}
              totalBreakdown={totalBreakdown}
              paymentTerms={paymentTerms}
              validUntil={validUntil}
              bundleSavings={bundleSavings}
              brandColor={brandColor}
            />
          </PageWrapper>
        )}

        {/* Section 6: Terms & Conditions */}
        {termsClauses.length > 0 && (
          <PageWrapper pageNumber="06">
            <SectionHeader
              number="05"
              title="Terms & Conditions"
              subtitle="The legal framework governing our engagement."
            />
            <HighlightPanel
              items={[
                { label: 'Validity', value: `${proposal.validity_days || 30} days` },
                { label: 'Revisions', value: `${proposal.revision_rounds ?? 2} rounds` },
                { label: 'Notice Period', value: proposal.notice_period || '30 days' },
              ]}
              variant="dark"
            />
            <div className="mt-10">
              <TermsSection clauses={termsClauses.map((c: any) => ({ title: c.title, content: c.content }))} />
            </div>
          </PageWrapper>
        )}

        {/* Section 7: Why Us */}
        {differentiators.length > 0 && (
          <PageWrapper pageNumber="07">
            <SectionHeader
              number="06"
              title={`Why ${agency?.name || 'Us'}`}
              subtitle="What sets us apart and drives results for our clients."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {differentiators.map((d: any, idx: number) => (
                <WhyUsCard
                  key={d.id}
                  title={d.title}
                  description={d.description || ''}
                  statValue={d.stat_value}
                  statLabel={d.stat_label}
                  icon={d.icon}
                  delay={idx * 0.08}
                />
              ))}
            </div>

            {/* Your Team */}
            {(() => {
              const proposalTeam = Array.isArray((proposal as any)?.team) ? (proposal as any).team : [];
              if (proposalTeam.length === 0) return null;
              return (
                <div className="mt-12">
                  <p className="mb-6 text-center" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999' }}>
                    The Team Behind Your Project
                  </p>
                  <div className={`grid gap-6 justify-center ${proposalTeam.length <= 2 ? 'grid-cols-2 max-w-md mx-auto' : proposalTeam.length === 3 ? 'grid-cols-3 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    {proposalTeam.slice(0, 4).map((member: any, i: number) => (
                      <TeamMemberCard key={member.member_id} name={member.name} title={member.title} photoUrl={member.photo_url} roleOnProject={member.role_on_project} delay={i * 0.1} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </PageWrapper>
        )}

        {/* Section 8: Testimonials */}
        {testimonials.length > 0 && (
          <PageWrapper pageNumber="08">
            <SectionHeader
              number="07"
              title="What Our Clients Say"
              subtitle="Real results from real partnerships."
            />
            {featuredTestimonial && (
              <div className="mb-8">
                <TestimonialCard
                  clientName={featuredTestimonial.client_name}
                  clientTitle={featuredTestimonial.client_title}
                  clientCompany={featuredTestimonial.client_company}
                  quote={featuredTestimonial.quote}
                  metricValue={featuredTestimonial.metric_value}
                  metricLabel={featuredTestimonial.metric_label}
                  avatarUrl={featuredTestimonial.avatar_url}
                  featured
                />
              </div>
            )}
            {otherTestimonials.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherTestimonials.map((t: any, idx: number) => (
                  <TestimonialCard
                    key={t.id}
                    clientName={t.client_name}
                    clientTitle={t.client_title}
                    clientCompany={t.client_company}
                    quote={t.quote}
                    metricValue={t.metric_value}
                    metricLabel={t.metric_label}
                    avatarUrl={t.avatar_url}
                    delay={idx * 0.1}
                  />
                ))}
              </div>
            )}
          </PageWrapper>
        )}

        {/* Section 9: Signature + Accept/Decline */}
        <PageWrapper pageNumber="09">
          <SignatureBlock
            client={{
              role: 'Client',
              companyName: client?.company_name || 'Client',
              personName: client?.contact_name || undefined,
              title: client?.contact_title || undefined,
            }}
          />

          {/* Accept / Decline Actions */}
          {(proposal.status === 'sent' || proposal.status === 'viewed') && (
            <ProposalActions proposalId={proposal.id} onStatusChange={(status) => setProposal((prev: any) => prev ? { ...prev, status } : prev)} />
          )}
          {proposal.status === 'accepted' && (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-6">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <p className="text-lg font-semibold text-green-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>This proposal has been accepted</p>
            </div>
          )}
          {proposal.status === 'declined' && (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-6">
              <XCircle className="h-6 w-6 text-red-600" />
              <p className="text-lg font-semibold text-red-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>This proposal has been declined</p>
            </div>
          )}
        </PageWrapper>

        {/* Analytics notice */}
        <p className="mt-16 text-center text-[10px]" style={{ color: '#B8B0A5' }}>
          Viewing activity is tracked to help {agency?.name || 'the agency'} follow up.
        </p>

        {/* Footer */}
        <div className="text-center py-6 bg-white">
          <p className="text-[#CCC]" style={{ fontSize: "12px", fontFamily: "'Space Grotesk', sans-serif" }}>
            Powered by <span style={{ fontWeight: 600 }}>Propopad</span>
          </p>
        </div>
      </div>
    </BrandProvider>
    </TemplateProvider>
  );
}

function ProposalActions({ proposalId, onStatusChange }: { proposalId: string; onStatusChange: (status: string) => void }) {
  const [acting, setActing] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const handleAction = async (action: 'accepted' | 'declined') => {
    if (confirmed && confirmed !== action) return;
    if (!confirmed) {
      setConfirmed(action);
      return;
    }
    setActing(true);
    const updates: any = { status: action };
    if (action === 'accepted') updates.accepted_at = new Date().toISOString();
    if (action === 'declined') updates.declined_at = new Date().toISOString();
    await supabase.from('proposals').update(updates).eq('id', proposalId);
    onStatusChange(action);
    toast.success(action === 'accepted' ? 'Proposal accepted!' : 'Proposal declined');
    setActing(false);
  };

  return (
    <div className="mt-10 border-t border-[#EEE] pt-8">
      <p className="text-center text-[15px] text-[#666] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Ready to move forward?
      </p>
      <div className="flex items-center justify-center gap-4">
        {(!confirmed || confirmed === 'accepted') && (
          <button
            onClick={() => handleAction('accepted')}
            disabled={acting}
            className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: '#22c55e', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <CheckCircle2 className="h-5 w-5" />
            {confirmed === 'accepted' ? (acting ? 'Confirming...' : 'Click again to confirm') : 'Accept Proposal'}
          </button>
        )}
        {(!confirmed || confirmed === 'declined') && (
          <button
            onClick={() => handleAction('declined')}
            disabled={acting}
            className="flex items-center gap-2 rounded-xl border-2 border-[#E5E5E5] px-8 py-3 text-sm font-semibold text-[#666] transition-all hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <XCircle className="h-5 w-5" />
            {confirmed === 'declined' ? (acting ? 'Confirming...' : 'Click again to confirm') : 'Decline'}
          </button>
        )}
        {confirmed && (
          <button
            onClick={() => setConfirmed(null)}
            className="text-sm text-[#999] hover:text-[#666]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
