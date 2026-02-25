import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { StepProgress } from './StepProgress';
import { Step1Agency } from './Step1Agency';
import { Step2Groups } from './Step2Groups';
import { Step3Modules } from './Step3Modules';
import { Step4Bundles } from './Step4Bundles';
import { Step5Pricing } from './Step5Pricing';
import { Step6Profile } from './Step6Profile';
import { Step7Proposal } from './Step7Proposal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { agency, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Agency info
  const [agencyData, setAgencyData] = useState<any>({});
  // Step 2: Selected service groups
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  // Step 3: Selected modules
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  // Step 5: Pricing data
  const [pricingData, setPricingData] = useState<any>({});
  // Group name lookup
  const [groupNameMap, setGroupNameMap] = useState<Record<string, string>>({});

  // Initialize from existing agency data
  useEffect(() => {
    if (agency) {
      setAgencyData({
        name: agency.name || '',
        email: agency.email || '',
        website: agency.website || '',
        phone: agency.phone || '',
        brand_color: agency.brand_color || '#fc956e',
        address: agency.address_line1 || '',
        tagline: '',
        logo_url: agency.logo_url || '',
        detected_services: [],
        detected_colors: [],
        scraped_data: agency.scraped_data || null,
      });
      setPricingData({
        currency: agency.currency || 'USD',
        currency_symbol: agency.currency_symbol || '$',
        hourly_rate: agency.hourly_rate || '',
        payment_template: '50-50',
        proposal_prefix: agency.proposal_prefix || (agency.name ? agency.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() : ''),
        default_validity_days: agency.default_validity_days || 30,
        default_revision_rounds: agency.default_revision_rounds ?? 2,
        default_notice_period: agency.default_notice_period || '30 days',
      });
      // Resume from saved step
      if (agency.onboarding_step > 1) {
        setStep(agency.onboarding_step);
      }
    }
  }, [agency]);

  // Load service groups for name lookup
  useEffect(() => {
    supabase.from('service_groups').select('id, name').order('display_order').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((g) => { map[g.id] = g.name; });
        setGroupNameMap(map);
      }
    });
  }, []);

  // When Step 1 detects services, auto-select matching groups in Step 2
  useEffect(() => {
    if (agencyData.detected_services?.length > 0 && selectedGroups.length === 0 && Object.keys(groupNameMap).length > 0) {
      const matchedGroupIds = Object.entries(groupNameMap)
        .filter(([_, name]) => agencyData.detected_services.includes(name))
        .map(([id]) => id);
      if (matchedGroupIds.length > 0) {
        setSelectedGroups(matchedGroupIds);
      }
    }
  }, [agencyData.detected_services, groupNameMap]);

  // Derive selected group names for Step 3
  const selectedGroupNames = selectedGroups.map((id) => groupNameMap[id]).filter(Boolean);

  // Auto-generate proposal prefix from agency name
  useEffect(() => {
    if (agencyData.name && !pricingData.proposal_prefix) {
      setPricingData((p: any) => ({
        ...p,
        proposal_prefix: agencyData.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
      }));
    }
  }, [agencyData.name]);

  const canContinue = () => {
    switch (step) {
      case 1: return !!(agencyData.name && agencyData.email);
      case 2: return selectedGroups.length > 0;
      default: return true;
    }
  };

  const saveStep = async (nextStep: number) => {
    if (!agency) return;
    setSaving(true);

    try {
      switch (step) {
        case 1:
          await supabase.from('agencies').update({
            name: agencyData.name,
            email: agencyData.email,
            website: agencyData.website || null,
            phone: agencyData.phone || null,
            brand_color: agencyData.brand_color || '#fc956e',
            logo_url: agencyData.logo_url || null,
            address_line1: agencyData.address || null,
            tagline: agencyData.tagline || null,
            scraped_data: agencyData.scraped_data || null,
            onboarding_step: nextStep,
          } as any).eq('id', agency.id);
          break;

        case 2:
          // Save selected groups to agency scraped_data for reference
          await supabase.from('agencies').update({
            onboarding_step: nextStep,
            scraped_data: {
              ...(agency.scraped_data || {}),
              selected_group_ids: selectedGroups,
            },
          }).eq('id', agency.id);
          break;

        case 3:
          // Save service modules to database
          const modulesToInsert = selectedGroupNames.flatMap((groupName) => {
            const groupId = Object.entries(groupNameMap).find(([_, name]) => name === groupName)?.[0];
            if (!groupId) return [];

            return getDefaultModulesForGroup(groupName)
              .filter((_, i) => selectedModules[`${groupName}-${i}`] !== false)
              .map((mod, i) => ({
                agency_id: agency.id,
                group_id: groupId,
                name: mod.name,
                short_description: mod.shortDesc,
                pricing_model: mod.pricingModel,
                price_fixed: mod.pricingModel === 'fixed' ? mod.price : null,
                price_monthly: mod.pricingModel === 'monthly' ? mod.price : null,
                price_hourly: mod.pricingModel === 'hourly' ? mod.price : null,
                is_active: true,
                display_order: i,
              }));
          });

          if (modulesToInsert.length > 0) {
            // Delete existing modules first (in case of re-run)
            await supabase.from('service_modules').delete().eq('agency_id', agency.id);
            await supabase.from('service_modules').insert(modulesToInsert);
          }

          await supabase.from('agencies').update({ onboarding_step: nextStep }).eq('id', agency.id);
          break;

        case 4:
          await supabase.from('agencies').update({ onboarding_step: nextStep }).eq('id', agency.id);
          break;

        case 5:
          await supabase.from('agencies').update({
            currency: pricingData.currency,
            currency_symbol: pricingData.currency_symbol,
            hourly_rate: pricingData.hourly_rate || null,
            proposal_prefix: pricingData.proposal_prefix || null,
            default_validity_days: pricingData.default_validity_days,
            default_revision_rounds: pricingData.default_revision_rounds,
            default_notice_period: pricingData.default_notice_period,
            onboarding_step: nextStep,
          }).eq('id', agency.id);
          break;

        case 6:
          // Save default differentiators
          const { data: existingDiffs } = await supabase
            .from('differentiators')
            .select('id')
            .eq('agency_id', agency.id);

          if (!existingDiffs?.length) {
            const defaultDiffs = [
              { title: 'Strategy-Led Approach', stat_value: '87%', stat_label: 'Client Retention', icon: 'Target', description: 'Every project starts with strategy, not tactics.', display_order: 1 },
              { title: 'Transparent Reporting', stat_value: 'Weekly', stat_label: 'Updates', icon: 'BarChart3', description: 'Clear dashboards and weekly progress reports.', display_order: 2 },
              { title: 'Dedicated Team', stat_value: '1', stat_label: 'Point of Contact', icon: 'Users', description: 'A single dedicated account manager for your project.', display_order: 3 },
              { title: 'Proven Results', stat_value: '150+', stat_label: 'Projects', icon: 'Trophy', description: 'Track record of delivering measurable outcomes.', display_order: 4 },
              { title: 'Agile Process', stat_value: '2-week', stat_label: 'Sprint Cycles', icon: 'Zap', description: 'Iterative approach with regular check-ins and pivots.', display_order: 5 },
              { title: 'Full-Service Capability', stat_value: 'End-to-end', stat_label: 'Delivery', icon: 'Layers', description: 'From strategy through execution and optimization.', display_order: 6 },
            ].map((d) => ({ ...d, agency_id: agency.id }));

            await supabase.from('differentiators').insert(defaultDiffs);
          }

          // Save default terms
          const { data: existingTerms } = await supabase
            .from('terms_clauses')
            .select('id')
            .eq('agency_id', agency.id);

          if (!existingTerms?.length) {
            const defaultTerms = [
              { title: 'Payment Terms', content: 'Payment is due according to the milestone schedule outlined in this proposal. Late payments may incur a 1.5% monthly charge.', display_order: 1 },
              { title: 'Project Timeline & Milestones', content: 'The project timeline begins upon receipt of the initial payment and signed proposal.', display_order: 2 },
              { title: 'Revision Policy', content: 'This proposal includes the specified number of revision rounds per deliverable. Additional revisions will be billed at the hourly rate.', display_order: 3 },
              { title: 'Intellectual Property', content: 'Upon full payment, all deliverables and intellectual property rights transfer to the client.', display_order: 4 },
              { title: 'Confidentiality', content: 'Both parties agree to keep all project information, strategies, and data confidential.', display_order: 5 },
              { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified.', display_order: 6 },
              { title: 'Liability', content: 'Agency liability is limited to the total fees paid under this agreement.', display_order: 7 },
              { title: 'Governing Law', content: 'This agreement shall be governed by the laws of the jurisdiction where the agency is registered.', display_order: 8 },
            ].map((t) => ({ ...t, agency_id: agency.id, is_default: true }));

            await supabase.from('terms_clauses').insert(defaultTerms);
          }

          // Save default payment templates
          const { data: existingPT } = await supabase
            .from('payment_templates')
            .select('id')
            .eq('agency_id', agency.id);

          if (!existingPT?.length) {
            await supabase.from('payment_templates').insert([
              { agency_id: agency.id, name: '50/50', milestones: [{ label: 'Upfront', percentage: 50 }, { label: 'Completion', percentage: 50 }], is_default: true },
              { agency_id: agency.id, name: 'Equal Thirds', milestones: [{ label: 'Start', percentage: 33 }, { label: 'Midpoint', percentage: 33 }, { label: 'Delivery', percentage: 34 }], is_default: false },
              { agency_id: agency.id, name: 'Quarterly', milestones: [{ label: 'Q1', percentage: 25 }, { label: 'Q2', percentage: 25 }, { label: 'Q3', percentage: 25 }, { label: 'Q4', percentage: 25 }], is_default: false },
            ]);
          }

          // Save default timeline phases
          const { data: existingPhases } = await supabase
            .from('timeline_phases')
            .select('id')
            .eq('agency_id', agency.id);

          if (!existingPhases?.length) {
            await supabase.from('timeline_phases').insert([
              { agency_id: agency.id, name: 'Discovery & Research', default_duration: '1-2 weeks', description: 'Understanding your business, audience, and goals.', display_order: 1 },
              { agency_id: agency.id, name: 'Strategy & Architecture', default_duration: '2-3 weeks', description: 'Defining the roadmap and project architecture.', display_order: 2 },
              { agency_id: agency.id, name: 'Creative Development', default_duration: '3-4 weeks', description: 'Design concepts, content creation, and iteration.', display_order: 3 },
              { agency_id: agency.id, name: 'Build & Produce', default_duration: '2-3 weeks', description: 'Development, production, and quality assurance.', display_order: 4 },
              { agency_id: agency.id, name: 'Launch & Optimize', default_duration: '1-2 weeks', description: 'Go live, monitor, and optimize performance.', display_order: 5 },
            ]);
          }

          await supabase.from('agencies').update({ onboarding_step: nextStep }).eq('id', agency.id);
          break;
      }
    } catch (e) {
      console.error('Error saving onboarding step:', e);
      toast.error('Failed to save. Please try again.');
    }

    setSaving(false);
  };

  const handleContinue = async () => {
    if (step === 7) {
      setSaving(true);
      await supabase.from('agencies').update({
        onboarding_complete: true,
        onboarding_step: 7,
      }).eq('id', agency!.id);
      setSaving(false);
      toast.success('Onboarding complete! Welcome to Propopad.');
      navigate('/dashboard');
      // Force page refresh to update auth context
      window.location.href = '/dashboard';
      return;
    }

    await saveStep(step + 1);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleSkipSetup = async () => {
    await supabase.from('agencies').update({
      onboarding_complete: true,
    }).eq('id', agency!.id);
    window.location.href = '/dashboard';
  };

  const showSkip = step === 4 || step === 6;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold text-foreground">Propopad</span>
        </div>
        <button onClick={handleSkipSetup} className="text-xs text-muted-foreground hover:text-foreground">
          Skip setup →
        </button>
      </div>

      {/* Progress */}
      <div className="border-b border-border px-6 py-5">
        <StepProgress currentStep={step} totalSteps={7} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          {step === 1 && <Step1Agency data={agencyData} onChange={setAgencyData} />}
          {step === 2 && <Step2Groups selectedGroups={selectedGroups} onChange={setSelectedGroups} moduleCounts={Object.fromEntries(Object.entries(groupNameMap).map(([id, name]) => [name, getDefaultModulesForGroup(name).length]))} />}
          {step === 3 && <Step3Modules selectedGroupNames={selectedGroupNames} selectedModules={selectedModules} onChange={setSelectedModules} />}
          {step === 4 && <Step4Bundles />}
          {step === 5 && <Step5Pricing data={pricingData} onChange={setPricingData} />}
          {step === 6 && <Step6Profile />}
          {step === 7 && <Step7Proposal />}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 sm:px-12 lg:px-20">
        <div>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showSkip && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue() || saving}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : step === 7 ? 'Go to Dashboard' : 'Continue'}
            {step < 7 && !saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: default modules per group (matches Step3Modules)
function getDefaultModulesForGroup(groupName: string) {
  const defaults: Record<string, { name: string; shortDesc: string; pricingModel: string; price: number }[]> = {
    'Brand & Creative': [
      { name: 'Brand Identity System', shortDesc: 'Logo, typography, color palette, and brand guidelines', pricingModel: 'fixed', price: 8500 },
      { name: 'Brand Messaging & Voice', shortDesc: 'Brand positioning, messaging framework, and tone of voice', pricingModel: 'fixed', price: 4500 },
      { name: 'Graphic Design Retainer', shortDesc: 'Ongoing design support for marketing materials', pricingModel: 'monthly', price: 2500 },
    ],
    'Website & Digital': [
      { name: 'Website Design & Development', shortDesc: 'Custom website design, development, and launch', pricingModel: 'fixed', price: 15000 },
      { name: 'Website Copywriting', shortDesc: 'Conversion-focused copy for all website pages', pricingModel: 'fixed', price: 3500 },
      { name: 'Website Maintenance', shortDesc: 'Ongoing updates, security, and hosting management', pricingModel: 'monthly', price: 800 },
    ],
    'Content & Copywriting': [
      { name: 'Content Strategy', shortDesc: 'Audience research, content pillars, and editorial calendar', pricingModel: 'fixed', price: 5000 },
      { name: 'Blog Writing', shortDesc: 'SEO-optimized blog posts with keyword research', pricingModel: 'monthly', price: 2000 },
      { name: 'Email Copywriting', shortDesc: 'Email sequences, campaigns, and newsletter content', pricingModel: 'fixed', price: 3000 },
    ],
    'SEO & Organic Growth': [
      { name: 'SEO Strategy & Implementation', shortDesc: 'Technical SEO, on-page optimization, and link building', pricingModel: 'monthly', price: 3500 },
      { name: 'Technical SEO Audit', shortDesc: 'Comprehensive site audit with actionable recommendations', pricingModel: 'fixed', price: 2500 },
    ],
    'Paid Advertising': [
      { name: 'Paid Search (PPC)', shortDesc: 'Google Ads management with keyword strategy', pricingModel: 'monthly', price: 3000 },
      { name: 'Paid Social Advertising', shortDesc: 'Meta, LinkedIn, and TikTok ad campaigns', pricingModel: 'monthly', price: 2500 },
      { name: 'Landing Page Design', shortDesc: 'High-converting landing pages for campaigns', pricingModel: 'fixed', price: 3500 },
    ],
    'Social Media': [
      { name: 'Social Media Management', shortDesc: 'Content creation, scheduling, and community management', pricingModel: 'monthly', price: 3000 },
      { name: 'Short-Form Video', shortDesc: 'Reels, TikToks, and YouTube Shorts production', pricingModel: 'monthly', price: 2500 },
    ],
    'Email Marketing': [
      { name: 'Email Marketing Strategy', shortDesc: 'Full email strategy with segmentation and automation', pricingModel: 'fixed', price: 4000 },
      { name: 'Email Automation', shortDesc: 'Automated sequences for nurture, onboarding, and retention', pricingModel: 'fixed', price: 3500 },
    ],
    'Analytics & Data': [
      { name: 'Analytics Setup', shortDesc: 'GA4, Tag Manager, and conversion tracking implementation', pricingModel: 'fixed', price: 2500 },
      { name: 'Conversion Rate Optimization', shortDesc: 'A/B testing, user research, and funnel optimization', pricingModel: 'monthly', price: 3000 },
    ],
    'Marketing Strategy': [
      { name: 'Marketing Strategy & Consulting', shortDesc: 'Strategic planning, market analysis, and growth roadmap', pricingModel: 'fixed', price: 8000 },
    ],
  };
  return defaults[groupName] || [];
}
