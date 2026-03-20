import React from 'react';
import { MotionConfig } from 'motion/react';
import { Layers } from 'lucide-react';
import {
  BrandProvider, HeroCover, SectionHeader, ServiceCard, PricingSummary,
  WhyUsCard, TestimonialCard, TermsSection, SignatureBlock,
  TextContent, PageWrapper, HighlightPanel, TimelineStep, TeamMemberCard, PortfolioCard, BundleCard,
} from '@/components/proposal-template';
import { TemplateProvider } from '@/components/proposal-template/TemplateProvider';
import { calculateTimeline, getObjectivesStat, getKpiBarItems } from '@/lib/proposalStats';

interface ProposalPDFRendererProps {
  proposal: any;
  agency: any;
  client: any;
  services: any[];
  differentiators: any[];
  testimonials: any[];
  termsClauses: any[];
  portfolioItems: any[];
  proposalTeam: any[];
  deletedSections: Set<number>;
  sectionOrder: number[];
  templateId: string;
  customColors: Record<string, string> | null;
  currencySymbol: string;
}

export const ProposalPDFRenderer = React.forwardRef<HTMLDivElement, ProposalPDFRendererProps>(
  function ProposalPDFRenderer({
    proposal, agency, client, services, differentiators, testimonials,
    termsClauses, portfolioItems, proposalTeam, deletedSections, sectionOrder,
    templateId, customColors, currencySymbol,
  }, ref) {

    const brandColor = agency?.brand_color || '#fc956e';
    const activePrimary = customColors?.primaryAccent || brandColor;
    const activeSecondary = customColors?.secondaryAccent || undefined;

    const brandData = {
      agencyName: (agency?.name || 'Agency').toUpperCase(),
      agencyFullName: agency?.name || 'Agency',
      primaryColor: activePrimary,
      darkColor: agency?.dark_color || '#0A0A0A',
      logoUrl: agency?.logo_url || null,
      logoInitial: (agency?.name || 'A').charAt(0).toUpperCase(),
      contactEmail: agency?.email || '',
      contactWebsite: agency?.website || '',
      contactPhone: agency?.phone || '',
      currency: currencySymbol,
    };

    const getPrice = (s: any) => s.price_override ?? getModulePriceByModel(s.module || {});
    const formatPrice = (n: number) => `${currencySymbol}${n.toLocaleString()}`;

    const pricingItems = services.map((s: any) => {
      const model = s.module?.pricing_model || 'fixed';
      const price = getPrice(s);
      const suffix = model === 'monthly' ? '/mo' : model === 'hourly' ? '/hr' : '';
      return {
        service: s.module?.name || 'Service',
        price: `${formatPrice(price)}${suffix}`,
        model: model as 'fixed' | 'monthly' | 'hourly',
        isAddon: s.is_addon || s.module?.service_type === 'addon',
        isBundled: !!s.bundle_id,
      };
    });

    const totalFixed = services.filter((s: any) => (s.module?.pricing_model || 'fixed') === 'fixed').reduce((sum: number, s: any) => sum + getPrice(s), 0);
    const totalMonthly = services.filter((s: any) => s.module?.pricing_model === 'monthly').reduce((sum: number, s: any) => sum + getPrice(s), 0);

    const parts: string[] = [];
    if (totalFixed > 0) parts.push(formatPrice(totalFixed));
    if (totalMonthly > 0) parts.push(`${formatPrice(totalMonthly)}/mo`);
    const totalStr = parts.join(' + ') || formatPrice(0);

    const totalBreakdown = parts.length > 1
      ? `${totalFixed > 0 ? `${formatPrice(totalFixed)} one-time` : ''}${totalFixed > 0 && totalMonthly > 0 ? ' + ' : ''}${totalMonthly > 0 ? `${formatPrice(totalMonthly)}/mo recurring` : ''}`
      : undefined;

    const validUntil = proposal.validity_days
      ? new Date(new Date(proposal.created_at).getTime() + proposal.validity_days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : undefined;

    const bundleSavings = (proposal.bundle_savings ?? 0) > 0
      ? {
          bundleName: 'Bundle',
          individualTotal: formatPrice((proposal.grand_total || 0) + (proposal.bundle_savings || 0)),
          bundlePrice: formatPrice(proposal.grand_total || 0),
          savings: `-${formatPrice(proposal.bundle_savings || 0)}`,
        }
      : undefined;

    const phases = proposal.phases && Array.isArray(proposal.phases) && proposal.phases.length > 0
      ? proposal.phases as any[]
      : [];

    const proposalDate = proposal.project_start_date || new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const summaryHighlights = [
      { label: 'Investment', value: totalStr, accent: true },
      { label: 'Timeline', value: calculateTimeline(phases) || proposal.estimated_duration || `${services.length * 2} weeks est.` },
      { label: 'Objectives', value: getObjectivesStat(proposal.goals, proposal.client_goal, services.length) },
    ];

    const renderSection = (sectionIdx: number) => {
      switch (sectionIdx) {
        case 0: // Cover
          return (
            <div className="pdf-section" data-section="cover">
              <HeroCover
                proposalTitle={proposal.title || `Proposal for ${client?.company_name || 'Client'}`}
                subtitle={proposal.subtitle || undefined}
                clientName={client?.company_name || 'Client'}
                date={proposalDate}
                proposalNumber={proposal.reference_number}
              />
            </div>
          );

        case 1: // Executive Summary
          if (!proposal.executive_summary) return null;
          return (
            <div className="pdf-section" data-section="executive-summary">
              <PageWrapper pageNumber="02">
                <SectionHeader number="01" title="Executive Summary" subtitle="Our understanding and approach" />
                <TextContent dropCap>{proposal.executive_summary}</TextContent>
                <div className="mt-12 space-y-4">
                  <HighlightPanel items={summaryHighlights} />
                  {(() => {
                    const kpiItems = getKpiBarItems(proposal.goals);
                    if (!kpiItems) return null;
                    const hasNumbers = kpiItems.some((k: any) => /\d/.test(k.value));
                    return (
                      <HighlightPanel variant="dark" items={kpiItems.map((k: any) => ({
                        label: k.label, value: k.value, accent: hasNumbers && /\d/.test(k.value),
                      }))} />
                    );
                  })()}
                </div>
              </PageWrapper>
            </div>
          );

        case 2: // Scope of Services
          if (services.length === 0) return null;
          return (
            <div className="pdf-section" data-section="scope">
              <PageWrapper pageNumber="03">
                <SectionHeader number="02" title="Scope of Services" subtitle="What we'll deliver for you" />
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
                <div className="grid grid-cols-2 gap-6">
                  {services.map((svc: any, idx: number) => (
                    <ServiceCard
                      key={svc.id}
                      icon={<Layers size={22} />}
                      name={svc.module?.name || 'Service'}
                      price={`${formatPrice(getPrice(svc))}`}
                      pricingModel={svc.module?.pricing_model || 'fixed'}
                      description={svc.module?.description || svc.module?.short_description || ''}
                      deliverables={svc.custom_deliverables || svc.module?.deliverables || []}
                      clientResponsibilities={
                        (proposal.show_client_responsibilities ?? false) && (svc.show_responsibilities !== false)
                          ? (svc.client_responsibilities || svc.module?.client_responsibilities || [])
                          : []
                      }
                      outOfScope={
                        (proposal.show_out_of_scope ?? false) && (svc.show_out_of_scope !== false)
                          ? (svc.out_of_scope || svc.module?.out_of_scope || [])
                          : []
                      }
                      isAddon={svc.is_addon || svc.module?.service_type === 'addon'}
                      delay={0}
                    />
                  ))}
                </div>
              </PageWrapper>
            </div>
          );

        case 3: // Timeline
          if (phases.length === 0) return null;
          return (
            <div className="pdf-section" data-section="timeline">
              <PageWrapper pageNumber="04">
                <SectionHeader number="03" title="Timeline" subtitle="How we'll get there" />
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
                      variant="accent"
                    />
                  );
                })()}
                <div className="mt-10">
                  {phases.map((phase: any, idx: number) => (
                    <TimelineStep
                      key={idx}
                      number={idx + 1}
                      name={phase.name || `Phase ${idx + 1}`}
                      duration={phase.duration || phase.default_duration || '2 weeks'}
                      description={phase.description}
                      isLast={idx === phases.length - 1}
                      delay={0}
                    />
                  ))}
                </div>
              </PageWrapper>
            </div>
          );

        case 4: // Investment
          if (services.length === 0) return null;
          return (
            <div className="pdf-section" data-section="investment">
              <PageWrapper pageNumber="05">
                <SectionHeader number="04" title="Investment" subtitle="Transparent pricing for every deliverable" />
                <PricingSummary
                  items={pricingItems}
                  total={totalStr}
                  totalBreakdown={totalBreakdown}
                  validUntil={validUntil}
                  brandColor={brandColor}
                  bundleSavings={bundleSavings}
                />
              </PageWrapper>
            </div>
          );

        case 5: // Why Us
          if (differentiators.length === 0 && proposalTeam.length === 0) return null;
          return (
            <div className="pdf-section" data-section="why-us">
              <PageWrapper pageNumber="06">
                <SectionHeader number="05" title={`Why ${agency?.name || 'Us'}`} subtitle="What sets us apart" />
                {agency?.about_text && (
                  <div className="mb-10"><TextContent>{agency.about_text}</TextContent></div>
                )}
                {differentiators.length > 0 && (
                  <div className="grid grid-cols-3 gap-6">
                    {differentiators.map((d: any, idx: number) => (
                      <WhyUsCard key={d.id} title={d.title} description={d.description || ''} statValue={d.stat_value} statLabel={d.stat_label} icon={d.icon} delay={0} />
                    ))}
                  </div>
                )}
                {proposalTeam.length > 0 && (
                  <div className="mt-12">
                    <p className="mb-6 text-center" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999' }}>
                      The Team Behind Your Project
                    </p>
                    <div className={`grid gap-6 justify-center ${proposalTeam.length <= 2 ? 'grid-cols-2 max-w-md mx-auto' : proposalTeam.length === 3 ? 'grid-cols-3 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-4'}`}>
                      {proposalTeam.slice(0, 4).map((member: any, i: number) => (
                        <TeamMemberCard key={member.member_id} name={member.name} title={member.title} photoUrl={member.photo_url} roleOnProject={member.role_on_project} delay={0} />
                      ))}
                    </div>
                  </div>
                )}
              </PageWrapper>
            </div>
          );

        case 6: // Portfolio
          if (portfolioItems.length === 0 || !(proposal as any).portfolio_section_visible) return null;
          return (
            <div className="pdf-section" data-section="portfolio">
              <PageWrapper pageNumber="07">
                <SectionHeader number="06" title={(proposal as any).portfolio_section_title || 'Our Work'} subtitle="Selected projects from our portfolio" />
                <div className="grid grid-cols-2 gap-6">
                  {portfolioItems.map((item: any, idx: number) => (
                    <PortfolioCard key={item.id} title={item.title} category={item.category} description={item.description} results={item.results} imageUrl={item.images?.[0]?.url} imageAlt={item.images?.[0]?.alt_text} delay={0} />
                  ))}
                </div>
              </PageWrapper>
            </div>
          );

        case 7: // Testimonials
          if (testimonials.length === 0) return null;
          return (
            <div className="pdf-section" data-section="testimonials">
              <PageWrapper pageNumber="08">
                <SectionHeader number="07" title="What Our Clients Say" subtitle="Real results from real partnerships." />
                <div className="space-y-6">
                  {testimonials.slice(0, 4).map((t: any, idx: number) => (
                    <TestimonialCard key={t.id} clientName={t.client_name} clientTitle={t.client_title} clientCompany={t.client_company} quote={t.quote} metricValue={t.metric_value} metricLabel={t.metric_label} avatarUrl={t.avatar_url} featured={idx === 0} delay={0} />
                  ))}
                </div>
              </PageWrapper>
            </div>
          );

        case 8: // Terms
          if (termsClauses.length === 0) return null;
          return (
            <div className="pdf-section" data-section="terms">
              <PageWrapper pageNumber="09">
                <SectionHeader number="08" title="Terms & Conditions" subtitle="The fine print" />
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
            </div>
          );

        case 9: // Signature
          return (
            <div className="pdf-section" data-section="signature">
              <PageWrapper pageNumber="10">
                <SignatureBlock
                  client={{
                    role: 'Client',
                    companyName: client?.company_name || 'Client',
                    personName: client?.contact_name || undefined,
                    title: client?.contact_title || undefined,
                  }}
                />
              </PageWrapper>
            </div>
          );

        default:
          return null;
      }
    };

    const visibleSections = sectionOrder.filter(idx => !deletedSections.has(idx));

    return (
      <MotionConfig reducedMotion="always">
        <TemplateProvider templateId={templateId} isPDFMode={true} customColors={{ primaryAccent: activePrimary, secondaryAccent: activeSecondary, ...(customColors || {}) }}>
          <BrandProvider brand={brandData}>
            <div
              ref={ref}
              id="pdf-render-container"
              style={{
                width: '794px',
                background: 'white',
                position: 'absolute',
                left: '-9999px',
                top: 0,
                fontFamily: "'Satoshi', system-ui, sans-serif",
              }}
            >
              {visibleSections.map(sectionIdx => {
                const content = renderSection(sectionIdx);
                if (!content) return null;
                return <React.Fragment key={sectionIdx}>{content}</React.Fragment>;
              })}
            </div>
          </BrandProvider>
        </TemplateProvider>
      </MotionConfig>
    );
  }
);
