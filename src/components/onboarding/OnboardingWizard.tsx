import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import propopadLogo from '@/assets/propopad-logo.svg';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';
import { defaultBundles, findDefaultModule, calculateBundlePricing } from '@/lib/defaultBundles';
import { ScanScreen } from './ScanScreen';
import { ReviewScreen } from './ReviewScreen';
import { SignupGate } from './SignupGate';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { agency, userProfile, user } = useAuth();
  const [screen, setScreen] = useState<'scan' | 'review'>('scan');
  const [saving, setSaving] = useState(false);
  const [scrapeData, setScrapeData] = useState<any>(null);
  const [showSignupGate, setShowSignupGate] = useState(false);

  // Selected services (module keys that are toggled on)
  const [selectedModuleKeys, setSelectedModuleKeys] = useState<Set<string>>(new Set());
  // Testimonials from scrape
  const [testimonials, setTestimonials] = useState<any[]>([]);
  // Differentiators
  const [differentiators, setDifferentiators] = useState<any[]>([]);
  const [diffIntro, setDiffIntro] = useState('');
  // Agency identity
  const [agencyIdentity, setAgencyIdentity] = useState<any>({});
  // Service group lookup
  const [groupNameMap, setGroupNameMap] = useState<Record<string, string>>({});
  // Selected bundles
  const [addedBundles, setAddedBundles] = useState<Set<string>>(new Set());

  // Load service groups
  useEffect(() => {
    supabase.from('service_groups').select('id, name').order('display_order').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(g => { map[g.id] = g.name; });
        setGroupNameMap(map);
      }
    });
  }, []);

  // Resume if already past scan (authenticated user with existing agency)
  useEffect(() => {
    if (agency?.scrape_status === 'complete' && agency?.scraped_data) {
      handleScrapeComplete(agency.scraped_data);
    }
  }, [agency]);

  const handleScrapeComplete = (data: any) => {
    setScrapeData(data);

    // Set agency identity
    setAgencyIdentity({
      name: data.name || agency?.name || '',
      email: data.email || agency?.email || '',
      phone: data.phone || agency?.phone || '',
      logo_url: data.logo_url || agency?.logo_url || '',
      brand_color: data.brand_color || agency?.brand_color || '#E8825C',
      tagline: data.tagline || agency?.tagline || '',
      about_text: data.about_text || '',
      address: data.address || agency?.address_line1 || '',
    });

    // Auto-select matching services
    const detectedServices = data.detected_services || [];
    const allGroupNames = Object.values(groupNameMap);
    const matchedGroups = detectedServices.filter((s: string) => allGroupNames.includes(s));
    
    // Pre-select modules for matched groups
    const keys = new Set<string>();
    matchedGroups.forEach((groupName: string) => {
      const modules = getDefaultModulesForGroup(groupName);
      modules.forEach((_, i) => keys.add(`${groupName}-${i}`));
    });
    setSelectedModuleKeys(keys);

    // Set testimonials
    setTestimonials(data.testimonials || []);

    // Set differentiators
    const defaultDiffs = [
      { title: 'Measurable Impact', stat_value: '', stat_label: '', description: 'Beautiful work means nothing without results. We embed measurement into every engagement from day one, with clear KPIs, reporting dashboards, and a relentless focus on ROI.', icon: 'Target', source: 'default' },
      { title: 'True Partnership Model', stat_value: '', stat_label: '', description: 'We don\'t operate as a vendor — we operate as an extension of your team. Transparent communication, shared accountability, and a genuine investment in your success.', icon: 'Users', source: 'default' },
      { title: 'Strategy-First Approach', stat_value: '', stat_label: '', description: 'We don\'t start with design — we start with understanding. Every visual decision, every word, every pixel is backed by strategic intent based on your market reality and business goals.', icon: 'Zap', source: 'default' },
    ];

    if (data.differentiators?.cards?.length > 0) {
      const scrapedCards = data.differentiators.cards.map((c: any) => ({
        ...c,
        icon: 'Target',
        source: c.source || 'scraped',
      }));
      const combined = [...scrapedCards];
      let idx = 0;
      while (combined.length < 6 && idx < defaultDiffs.length) {
        if (!combined.find((c: any) => c.title === defaultDiffs[idx].title)) {
          combined.push(defaultDiffs[idx]);
        }
        idx++;
      }
      setDifferentiators(combined.slice(0, 6));
      setDiffIntro(data.differentiators.intro || data.about_text || '');
    } else {
      setDifferentiators(defaultDiffs);
      setDiffIntro(data.about_text || '');
    }

    setScreen('review');
  };

  const handleManualSetup = () => {
    setAgencyIdentity({
      name: agency?.name || '',
      email: agency?.email || '',
      phone: agency?.phone || '',
      logo_url: agency?.logo_url || '',
      brand_color: agency?.brand_color || '#E8825C',
      tagline: agency?.tagline || '',
      about_text: '',
      address: agency?.address_line1 || '',
    });
    setDifferentiators([
      { title: 'Measurable Impact', stat_value: '', stat_label: '', description: 'Beautiful work means nothing without results. We embed measurement into every engagement from day one, with clear KPIs, reporting dashboards, and a relentless focus on ROI.', icon: 'Target', source: 'default' },
      { title: 'True Partnership Model', stat_value: '', stat_label: '', description: 'We don\'t operate as a vendor — we operate as an extension of your team. Transparent communication, shared accountability, and a genuine investment in your success.', icon: 'Users', source: 'default' },
      { title: 'Strategy-First Approach', stat_value: '', stat_label: '', description: 'We don\'t start with design — we start with understanding. Every visual decision, every word, every pixel is backed by strategic intent based on your market reality and business goals.', icon: 'Zap', source: 'default' },
    ]);
    setScreen('review');
  };

  const handleFinishAttempt = () => {
    if (!user) {
      // Guest: save all onboarding data to localStorage so ProposalNew can use it
      const guestData = {
        agencyIdentity,
        selectedModuleKeys: [...selectedModuleKeys],
        testimonials,
        differentiators,
        diffIntro,
        scrapeData,
        groupNameMap,
        addedBundles: [...addedBundles],
        priceOverrides,
      };
      localStorage.setItem('propopad_guest_onboarding', JSON.stringify(guestData));
      toast.success('Your agency profile is ready! Now create your first proposal.');
      navigate('/proposals/new?guest=true');
      return;
    }
    // If authenticated, save directly
    handleFinish();
  };

  const handlePostSignupSave = async () => {
    setShowSignupGate(false);
    // Wait for auth state to propagate and agency to be created
    // The signup trigger should create the user + agency
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
      if (retries < 10) {
        retries++;
        await new Promise(r => setTimeout(r, 500));
        return waitForAgency();
      }
      return null;
    };

    const freshAgency = await waitForAgency();
    if (!freshAgency) {
      toast.error('Could not set up your agency. Please try again.');
      return;
    }
    await handleFinishWithAgency(freshAgency);
  };

  const handleFinish = async () => {
    if (!agency) return;
    await handleFinishWithAgency(agency);
  };

  const handleFinishWithAgency = async (targetAgency: any) => {
    setSaving(true);

    try {
      // 1. Save agency info
      await supabase.from('agencies').update({
        name: agencyIdentity.name || targetAgency.name,
        email: agencyIdentity.email || null,
        phone: agencyIdentity.phone || null,
        logo_url: agencyIdentity.logo_url || null,
        brand_color: agencyIdentity.brand_color || '#E8825C',
        tagline: agencyIdentity.tagline || null,
        address_line1: agencyIdentity.address || null,
        about_text: agencyIdentity.about_text || null,
        scraped_data: scrapeData || null,
        scrape_status: scrapeData ? 'complete' : 'manual',
        scraped_at: scrapeData ? new Date().toISOString() : null,
        currency: scrapeData?.detected_currency?.code || targetAgency.currency || 'USD',
        currency_symbol: scrapeData?.detected_currency?.symbol || targetAgency.currency_symbol || '$',
        default_validity_days: 30,
        default_revision_rounds: 2,
        default_notice_period: '30 days',
        proposal_prefix: (agencyIdentity.name || targetAgency.name || 'AGY').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
        onboarding_complete: true,
        onboarding_step: 7,
      } as any).eq('id', targetAgency.id);

      // 2. Save selected service modules
      const matchedGroupNames = [...new Set(
        [...selectedModuleKeys].map(key => key.replace(/-\d+$/, ''))
      )];
      
      const modulesToInsert = matchedGroupNames.flatMap(groupName => {
        const groupId = Object.entries(groupNameMap).find(([_, name]) => name === groupName)?.[0];
        if (!groupId) return [];
        return getDefaultModulesForGroup(groupName)
          .filter((_, i) => selectedModuleKeys.has(`${groupName}-${i}`))
          .map((mod, i) => ({
            agency_id: targetAgency.id,
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
        await supabase.from('service_modules').delete().eq('agency_id', targetAgency.id);
        await supabase.from('service_modules').insert(modulesToInsert);
      }

      // 3. Save testimonials
      if (testimonials.length > 0) {
        const testimonialsToInsert = testimonials.map(t => ({
          agency_id: targetAgency.id,
          quote: t.quote,
          client_name: t.client_name || 'Client',
          client_title: t.client_title || null,
          client_company: t.client_company || null,
          metric_value: t.metric_value || null,
          metric_label: t.metric_label || null,
          source: 'scraped',
        }));
        await supabase.from('testimonials').insert(testimonialsToInsert as any);
      }

      // 4. Save differentiators
      const diffsToInsert = differentiators.map((d, i) => ({
        agency_id: targetAgency.id,
        title: d.title,
        description: d.description,
        stat_value: d.stat_value,
        stat_label: d.stat_label,
        icon: d.icon || 'Target',
        display_order: i + 1,
        source: d.source || 'generated',
      }));
      await supabase.from('differentiators').delete().eq('agency_id', targetAgency.id);
      await supabase.from('differentiators').insert(diffsToInsert as any);

      // 5. Save default terms
      const { data: existingTerms } = await supabase.from('terms_clauses').select('id').eq('agency_id', targetAgency.id);
      if (!existingTerms?.length) {
        const defaultTerms = [
          { title: 'Payment Terms', content: 'All fees are due according to the payment schedule outlined in the Investment section of this proposal. Invoices will be issued at each milestone and are payable within 14 days of receipt.', display_order: 1 },
          { title: 'Project Timeline & Milestones', content: 'The project timeline outlined in this proposal is an estimate based on the defined scope of work. Actual timelines may vary depending on the timely provision of client feedback, content, assets, and approvals.', display_order: 2 },
          { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable. Additional revision rounds beyond the included allowance will be billed at our standard hourly rate.', display_order: 3 },
          { title: 'Intellectual Property', content: 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project.', display_order: 4 },
          { title: 'Confidentiality', content: 'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement.', display_order: 5 },
          { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified in the notice period above.', display_order: 6 },
          { title: 'Liability', content: 'The agency\'s total liability under this agreement shall not exceed the total fees paid by the client for the services.', display_order: 7 },
          { title: 'Governing Law', content: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the agency is registered.', display_order: 8 },
        ].map(t => ({ ...t, agency_id: targetAgency.id, is_default: true }));
        await supabase.from('terms_clauses').insert(defaultTerms);
      }

      // 6. Save default payment templates
      const { data: existingPT } = await supabase.from('payment_templates').select('id').eq('agency_id', targetAgency.id);
      if (!existingPT?.length) {
        await supabase.from('payment_templates').insert([
          { agency_id: targetAgency.id, name: 'Equal Thirds', milestones: [{ label: 'Start', percentage: 33 }, { label: 'Midpoint', percentage: 33 }, { label: 'Delivery', percentage: 34 }], is_default: true },
          { agency_id: targetAgency.id, name: '50/50', milestones: [{ label: 'Upfront', percentage: 50 }, { label: 'Completion', percentage: 50 }], is_default: false },
          { agency_id: targetAgency.id, name: 'Quarterly', milestones: [{ label: 'Q1', percentage: 25 }, { label: 'Q2', percentage: 25 }, { label: 'Q3', percentage: 25 }, { label: 'Q4', percentage: 25 }], is_default: false },
        ]);
      }

      // 7. Save default timeline phases
      const { data: existingPhases } = await supabase.from('timeline_phases').select('id').eq('agency_id', targetAgency.id);
      if (!existingPhases?.length) {
        await supabase.from('timeline_phases').insert([
          { agency_id: targetAgency.id, name: 'Discovery & Research', default_duration: '1-2 weeks', description: 'Understanding your business, audience, and goals.', display_order: 1 },
          { agency_id: targetAgency.id, name: 'Strategy & Architecture', default_duration: '2-3 weeks', description: 'Defining the roadmap and project architecture.', display_order: 2 },
          { agency_id: targetAgency.id, name: 'Creative Development', default_duration: '3-4 weeks', description: 'Design concepts, content creation, and iteration.', display_order: 3 },
          { agency_id: targetAgency.id, name: 'Build & Produce', default_duration: '2-3 weeks', description: 'Development, production, and quality assurance.', display_order: 4 },
          { agency_id: targetAgency.id, name: 'Launch & Optimize', default_duration: '1-2 weeks', description: 'Go live, monitor, and optimize performance.', display_order: 5 },
        ]);
      }

      // 8. Save selected bundles
      if (addedBundles.size > 0) {
        const { data: insertedModules } = await supabase
          .from('service_modules')
          .select('id, name, price_fixed, price_monthly')
          .eq('agency_id', targetAgency.id)
          .eq('is_active', true);

        for (const bundleName of addedBundles) {
          const template = defaultBundles.find(b => b.name === bundleName);
          if (!template) continue;

          const pricing = calculateBundlePricing(template.serviceNames, template.discountPercentage, insertedModules || []);
          const cs = targetAgency.currency_symbol || '$';

          const { data: newBundle } = await supabase.from('bundles').insert({
            agency_id: targetAgency.id,
            name: template.name,
            tagline: template.tagline,
            description: template.description,
            bundle_price: pricing.bundleFixed + pricing.bundleMonthly,
            individual_total: pricing.totalFixed + pricing.totalMonthly,
            savings_amount: pricing.totalSavings,
            savings_label: pricing.totalSavings > 0 ? `Save ${cs}${pricing.totalSavings.toLocaleString()}` : null,
            is_active: true,
          }).select('id').single();

          if (newBundle) {
            const moduleIds = template.serviceNames
              .map(n => (insertedModules || []).find((m: any) => m.name === n)?.id)
              .filter(Boolean);
            if (moduleIds.length > 0) {
              await supabase.from('bundle_modules').insert(
                moduleIds.map(mid => ({ bundle_id: newBundle.id, module_id: mid }))
              );
            }
          }
        }
      }

      toast.success('Your agency is set up! Create your first proposal.');
      navigate('/proposals/new');
      window.location.href = '/proposals/new';
    } catch (e) {
      console.error('Onboarding save error:', e);
      toast.error('Failed to save. Please try again.');
    }

    setSaving(false);
  };

  const handleSkip = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    if (!agency) return;
    await supabase.from('agencies').update({
      onboarding_complete: true,
    } as any).eq('id', agency.id);
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
            <img src={propopadLogo} alt="Propopad" className="h-4 w-4 invert" />
          </div>
          <span className="font-display text-base font-bold text-foreground">Propopad</span>
        </div>
        <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
          {user ? 'Skip setup →' : '← Back to home'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {screen === 'scan' && (
          <ScanScreen
            onScrapeComplete={handleScrapeComplete}
            onManualSetup={handleManualSetup}
          />
        )}
        {screen === 'review' && (
          <ReviewScreen
            agencyIdentity={agencyIdentity}
            onAgencyChange={setAgencyIdentity}
            selectedModuleKeys={selectedModuleKeys}
            onModuleKeysChange={setSelectedModuleKeys}
            testimonials={testimonials}
            onTestimonialsChange={setTestimonials}
            differentiators={differentiators}
            onDifferentiatorsChange={setDifferentiators}
            diffIntro={diffIntro}
            onDiffIntroChange={setDiffIntro}
            groupNameMap={groupNameMap}
            onFinish={handleFinishAttempt}
            saving={saving}
            addedBundles={addedBundles}
            onAddBundle={(name) => setAddedBundles(prev => new Set([...prev, name]))}
          />
        )}
      </div>

      {/* Signup Gate Modal */}
      {showSignupGate && (
        <SignupGate
          onAuthenticated={handlePostSignupSave}
          onCancel={() => setShowSignupGate(false)}
        />
      )}
    </div>
  );
}
