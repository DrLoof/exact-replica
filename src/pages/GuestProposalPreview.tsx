import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, FileText } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SignupGate } from '@/components/onboarding/SignupGate';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';
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
import { AIContentNotice } from '@/components/AIContentNotice';

function getDefaultAboutText(yearsExperience?: number | null): string {
  const yearsPart = yearsExperience ? `Over the past ${yearsExperience} years` : 'Over the past years';
  return `${yearsPart}, we've helped ambitious brands transform their market position through the intersection of strategy, design, and technology. We're not the biggest agency — and that's by design. Our deliberately lean structure means faster decisions, fewer layers, and more senior attention on every engagement.`;
}

function SectionWrapper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div id={`section-${label}`} className="scroll-mt-20">
      {children}
    </div>
  );
}

export default function GuestProposalPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [localServices, setLocalServices] = useState<any[]>([]);

  const guestOnboarding = useMemo(() => {
    try {
      const raw = localStorage.getItem('propopad_guest_onboarding');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  if (!guestProposal) {
    navigate('/');
    return null;
  }

  const identity = guestOnboarding?.agencyIdentity || {};
  const currencySymbol = guestProposal.currencySymbol || '$';
  const services = guestProposal.services || [];
  const differentiators = guestOnboarding?.differentiators || [];
  const testimonials = (guestOnboarding?.testimonials || []).filter((t: any) => t.approved);
  const clientName = guestProposal.clientName || 'Client';
  const agencyName = identity.name || 'Your Agency';
  const brandColor = identity.brand_color || '#E8825C';

  const totalFixed = guestProposal.totalFixed || 0;
  const totalMonthly = guestProposal.totalMonthly || 0;

  const totalStr = (() => {
    const parts: string[] = [];
    if (totalFixed > 0) parts.push(`${currencySymbol}${totalFixed.toLocaleString()}`);
    if (totalMonthly > 0) parts.push(`${currencySymbol}${totalMonthly.toLocaleString()}/mo`);
    return parts.join(' + ') || `${currencySymbol}0`;
  })();

  const pricingItems = services.map((s: any) => {
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

  const requireSignup = () => {
    setShowSignupGate(true);
  };

  // After signup, persist everything and create the real proposal
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
      if (!freshAgency) { toast.error('Could not set up your agency. Please try again.'); setSaving(false); return; }

      // Persist onboarding data
      if (guestOnboarding) {
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
          default_validity_days: 30, default_revision_rounds: 2, default_notice_period: '30 days',
          proposal_prefix: (identity.name || freshAgency.name || 'AGY').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
          onboarding_complete: true, onboarding_step: 7,
        } as any).eq('id', freshAgency.id);

        // Save modules
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
              service_type: mod.serviceType || 'core',
              deliverables: mod.deliverables || [], client_responsibilities: mod.clientResponsibilities || [],
              out_of_scope: mod.outOfScope || [], default_timeline: mod.defaultTimeline || null,
              suggested_kpis: mod.suggestedKpis || [], common_tools: mod.commonTools || [],
              is_active: true, display_order: i,
            }));
        });
        if (modulesToInsert.length > 0) {
          await supabase.from('service_modules').delete().eq('agency_id', freshAgency.id);
          await supabase.from('service_modules').insert(modulesToInsert);
        }

        // Save testimonials
        const allTestimonials = guestOnboarding.testimonials || [];
        if (allTestimonials.length > 0) {
          await supabase.from('testimonials').insert(allTestimonials.map((t: any) => ({
            agency_id: freshAgency.id, quote: t.quote, client_name: t.client_name || 'Client',
            client_title: t.client_title || null, client_company: t.client_company || null,
            metric_value: t.metric_value || null, metric_label: t.metric_label || null, source: 'scraped',
          })));
        }

        // Save differentiators
        if (differentiators.length > 0) {
          await supabase.from('differentiators').delete().eq('agency_id', freshAgency.id);
          await supabase.from('differentiators').insert(differentiators.map((d: any, i: number) => ({
            agency_id: freshAgency.id, title: d.title, description: d.description,
            stat_value: d.stat_value, stat_label: d.stat_label, icon: d.icon || 'Target',
            display_order: i + 1, source: d.source || 'generated',
          })));
        }

        // Save defaults (terms, payment templates, timeline phases)
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

      // Now create the actual proposal
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('id, agency_id').eq('id', currentUser.user!.id).single();
      const agencyId = profile!.agency_id!;

      // Refresh agency
      const { data: ag } = await supabase.from('agencies').select('*').eq('id', agencyId).single();
      if (!ag) { toast.error('Agency not found'); setSaving(false); return; }

      // Create client
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

      // Match guest services to real DB modules by name
      const { data: realModules } = await supabase.from('service_modules').select('id, name, service_type').eq('agency_id', agencyId);

      const { data: proposal } = await supabase.from('proposals').insert({
        agency_id: agencyId, client_id: clientId, reference_number: refNum,
        title: `Proposal for ${clientName}`, status: 'draft',
        total_fixed: totalFixed, total_monthly: totalMonthly, grand_total: totalFixed + totalMonthly,
        created_by: profile!.id, project_start_date: guestProposal.startDate,
        validity_days: 30, revision_rounds: 2, notice_period: '30 days',
      }).select('id').single();

      if (proposal) {
        const svcInserts = services.map((s: any, i: number) => {
          const realMod = realModules?.find((rm: any) => rm.name === s.name);
          return {
            proposal_id: proposal.id, module_id: realMod?.id || null,
            display_order: i, price_override: s.priceOverride,
            is_addon: (realMod?.service_type || s.service_type) === 'addon',
          };
        }).filter((s: any) => s.module_id);
        if (svcInserts.length > 0) await supabase.from('proposal_services').insert(svcInserts);
        await supabase.from('agencies').update({ proposal_counter: counter }).eq('id', agencyId);

        // Clean up localStorage
        localStorage.removeItem('propopad_guest_proposal');
        localStorage.removeItem('propopad_guest_onboarding');

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
    { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable. Additional revision rounds will be billed at our standard hourly rate.' },
    { title: 'Intellectual Property', content: 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project.' },
    { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified in the notice period above.' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/proposals/new?guest=true')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to editing
          </button>
          <span className="text-sm font-medium text-foreground">Proposal for {clientName}</span>
          <span className="rounded-full bg-status-draft/15 px-2.5 py-0.5 text-xs font-medium text-status-draft">Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={requireSignup}
            disabled={saving}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Download className="inline h-4 w-4 mr-1.5" />
            Export PDF
          </button>
          <button
            onClick={requireSignup}
            disabled={saving}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={requireSignup}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" /> {saving ? 'Saving...' : 'Share & Send'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
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
            <AIContentNotice />

            {/* Cover */}
            <SectionWrapper label="Cover">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <HeroCover
                  proposalTitle={`Proposal for ${clientName}`}
                  clientName={clientName}
                  date={proposalDate}
                  proposalNumber="DRAFT-001"
                />
              </div>
            </SectionWrapper>

            {/* Executive Summary */}
            <SectionWrapper label="Executive Summary">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <PageWrapper pageNumber="02">
                  <SectionHeader number="01" title="Executive Summary" subtitle="Our understanding and approach" />
                  <TextContent dropCap>
                    <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444' }}>
                      Click to add an executive summary for this proposal. Describe the project goals, your approach, and expected outcomes.
                    </p>
                  </TextContent>
                  <div className="mt-12">
                    <HighlightPanel items={[
                      { label: 'Investment', value: totalStr, accent: true },
                      { label: 'Timeline', value: `${Math.max(services.length * 2, 4)} weeks est.` },
                      { label: 'Services', value: `${services.length} included` },
                    ]} />
                  </div>
                </PageWrapper>
              </div>
            </SectionWrapper>

            {/* Scope of Services */}
            <SectionWrapper label="Scope of Services">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <PageWrapper pageNumber="03">
                  <SectionHeader number="02" title="Scope of Services" subtitle="What we'll deliver for you" />
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {services.map((svc: any, i: number) => {
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
                        />
                      );
                    })}
                  </div>
                </PageWrapper>
              </div>
            </SectionWrapper>

            {/* Investment */}
            <SectionWrapper label="Investment">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <PageWrapper pageNumber="04">
                  <SectionHeader number="03" title="Investment" subtitle="Transparent pricing for every deliverable" />
                  <PricingSummary
                    items={pricingItems}
                    total={totalStr}
                    brandColor={brandColor}
                  />
                </PageWrapper>
              </div>
            </SectionWrapper>

            {/* Why Us */}
            {differentiators.length > 0 && (
              <SectionWrapper label="Why Us">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="05">
                    <SectionHeader number="04" title="Why Us" subtitle="What sets us apart" />
                    <div className="mb-10">
                      <TextContent>
                        <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#444' }}>
                          {identity.about_text || getDefaultAboutText()}
                        </p>
                      </TextContent>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {differentiators.map((d: any, i: number) => (
                        <WhyUsCard key={i} title={d.title} description={d.description || ''} statValue={d.stat_value} statLabel={d.stat_label} icon={d.icon} delay={i * 0.1} />
                      ))}
                    </div>
                  </PageWrapper>
                </div>
              </SectionWrapper>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <SectionWrapper label="Testimonials">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="06">
                    <SectionHeader number="05" title="What Our Clients Say" subtitle="Proof of impact" />
                    <div className="space-y-6">
                      {testimonials.slice(0, 4).map((t: any, i: number) => (
                        <TestimonialCard key={i} clientName={t.client_name} clientTitle={t.client_title} clientCompany={t.client_company} quote={t.quote} metricValue={t.metric_value} metricLabel={t.metric_label} featured={i === 0} delay={i * 0.1} />
                      ))}
                    </div>
                  </PageWrapper>
                </div>
              </SectionWrapper>
            )}

            {/* Terms */}
            <SectionWrapper label="Terms">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <PageWrapper pageNumber="07">
                  <SectionHeader number="06" title="Terms & Conditions" />
                  <TermsSection clauses={defaultTerms} />
                </PageWrapper>
              </div>
            </SectionWrapper>

            {/* Signature */}
            <SectionWrapper label="Signature">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <PageWrapper pageNumber="08">
                  <SignatureBlock
                    client={{ role: 'Client', companyName: clientName }}
                    agency={{ role: 'Agency', companyName: agencyName }}
                  />
                </PageWrapper>
              </div>
            </SectionWrapper>
          </div>
        </BrandProvider>
      </div>

      {/* Signup Gate Modal */}
      {showSignupGate && (
        <SignupGate
          onAuthenticated={handlePostSignup}
          onCancel={() => setShowSignupGate(false)}
        />
      )}
    </div>
  );
}
