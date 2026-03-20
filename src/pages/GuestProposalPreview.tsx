import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download, FileText, Eye, EyeOff, Check, RefreshCw, Loader2, X, Lock, Palette, Plus, UserPlus, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SignupGate, type SignupTrigger } from '@/components/onboarding/SignupGate';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';
import { templates } from '@/lib/proposalTemplates';
import { calculateTimeline, getObjectivesStat, getKpiBarItems } from '@/lib/proposalStats';
import {
  BrandProvider, HeroCover, SectionHeader, ServiceCard, PricingSummary,
  WhyUsCard, TestimonialCard, TermsSection, SignatureBlock,
  TextContent, PageWrapper, HighlightPanel, EditableText, TimelineStep, TeamMemberCard, PortfolioCard,
} from '@/components/proposal-template';
import { TemplateProvider } from '@/components/proposal-template/TemplateProvider';

function getDefaultAboutText(yearsExperience?: number | null): string {
  const yearsPart = yearsExperience ? `Over the past ${yearsExperience} years` : 'Over the past years';
  return `${yearsPart}, we've helped ambitious brands transform their market position through the intersection of strategy, design, and technology. We're not the biggest agency — and that's by design. Our deliberately lean structure means faster decisions, fewer layers, and more senior attention on every engagement.`;
}

const sectionNames = [
  'Cover', 'Executive Summary', 'Scope of Services', 'Timeline',
  'Investment', 'Why Us', 'Portfolio', 'Testimonials', 'Terms', 'Signature',
];

export default function GuestProposalPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [signupTrigger, setSignupTrigger] = useState<SignupTrigger>('share');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [deletedSections, setDeletedSections] = useState<Set<number>>(new Set());
  const [showClientResponsibilities, setShowClientResponsibilities] = useState(true);
  const [showOutOfScope, setShowOutOfScope] = useState(false);
  const [portfolioVisible, setPortfolioVisible] = useState(true);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => !!localStorage.getItem('propopad_nudge_dismissed'));
  const [regenerating, setRegenerating] = useState(false);
  const editCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null);

  // Template & color state
  const [templateId, setTemplateId] = useState<string>('classic');
  const [customColors, setCustomColors] = useState<Record<string, string> | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [hexInput, setHexInput] = useState('');
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const PRESET_COLORS = ['#E8825C', '#2563EB', '#34D399', '#f9b564', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#1E1B4B'];
  const currentTemplate = templates[templateId] || templates.classic;

  // Free users can preview Pro templates but can't save/send with them
  const isPreviewingPro = !!(templates[templateId]?.isPro);

  const switchTemplate = (newId: string) => {
    const tmpl = templates[newId];
    if (!tmpl) return;
    setTemplateId(newId);
    // Only save non-Pro templates to localStorage
    if (!tmpl.isPro) {
      saveToLocalStorage({ templateId: newId });
    }
  };

  const updateCustomColor = (key: string, value: string) => {
    const updated = { ...(customColors || {}), [key]: value };
    setCustomColors(updated);
    saveToLocalStorage({ customColors: updated });
  };

  const resetColors = () => {
    setCustomColors(null);
    setColorPickerOpen(null);
    saveToLocalStorage({ customColors: null });
  };

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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
      setLocalServices((guestProposal.services || []).filter((s: any) => s && s.name));
      setLocalPhases(guestProposal.phases || []);
      setLocalAboutText(guestProposal.aboutText || guestOnboarding?.agencyIdentity?.about_text || '');
      if (guestProposal.templateId) setTemplateId(guestProposal.templateId);
      if (guestProposal.customColors) setCustomColors(guestProposal.customColors);
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

  const [guestTeamMembers, setGuestTeamMembers] = useState<any[]>(() => 
    (guestOnboarding?.teamMembers || []).filter((m: any) => m.name)
  );
  const [guestTeamExpanded, setGuestTeamExpanded] = useState(false);

  const [localDifferentiators, setLocalDifferentiators] = useState<any[]>(guestOnboarding?.differentiators || []);
  const [localTestimonials, setLocalTestimonials] = useState<any[]>(
    (guestOnboarding?.testimonials || []).filter((t: any) => t.approved)
  );

  // Sync testimonial edits back to localStorage
  const saveGuestTestimonials = useCallback((updated: any[]) => {
    try {
      const raw = localStorage.getItem('propopad_guest_onboarding');
      const onboarding = raw ? JSON.parse(raw) : {};
      const unapproved = (onboarding.testimonials || []).filter((t: any) => !t.approved);
      onboarding.testimonials = [...updated, ...unapproved];
      localStorage.setItem('propopad_guest_onboarding', JSON.stringify(onboarding));
    } catch {}
  }, []);

  const saveGuestTeam = useCallback((team: any[]) => {
    try {
      const raw = localStorage.getItem('propopad_guest_onboarding');
      const onboarding = raw ? JSON.parse(raw) : {};
      onboarding.teamMembers = team;
      localStorage.setItem('propopad_guest_onboarding', JSON.stringify(onboarding));
    } catch {}
  }, []);

  // Guard: redirect if no guest data (use effect to avoid render-time side effects)
  useEffect(() => {
    if (!guestProposal) {
      navigate('/', { replace: true });
    }
  }, [guestProposal, navigate]);

  if (!guestProposal) {
    return null;
  }

  const identity = guestOnboarding?.agencyIdentity || {};
  const currencySymbol = guestProposal.currencySymbol || '$';
  const differentiators = localDifferentiators;
  const testimonials = localTestimonials;
  const clientName = guestProposal.clientName || 'Client';
  const agencyName = identity.name || 'Your Agency';
  const brandColor = identity.brand_color || '#E8825C';
  // Brand color is the universal default; custom picks override it across all templates
  const activePrimary = customColors?.primaryAccent || brandColor;
  const activeSecondary = customColors?.secondaryAccent || currentTemplate.colors.secondaryAccent;

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
    const price = s.priceOverride ?? getModulePriceByModel(s);
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

  const deleteSection = (idx: number) => {
    setDeletedSections(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    toast.success(`${sectionNames[idx]} page removed`, {
      action: { label: 'Undo', onClick: () => restoreSection(idx) },
    });
  };

  const restoreSection = (idx: number) => {
    setDeletedSections(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const requireSignup = (trigger: SignupTrigger) => {
    setSignupTrigger(trigger);
    setShowSignupGate(true);
  };

  // Logo upload handler for guest mode
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocalLogoUrl(dataUrl);
      // Save to onboarding identity in localStorage
      try {
        const raw = localStorage.getItem('propopad_guest_onboarding');
        const onboarding = raw ? JSON.parse(raw) : {};
        onboarding.agencyIdentity = { ...(onboarding.agencyIdentity || {}), logo_url: dataUrl };
        localStorage.setItem('propopad_guest_onboarding', JSON.stringify(onboarding));
      } catch {}
      toast.success('Logo updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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

        const guestPortfolioItems = Array.isArray(guestOnboarding.portfolioItems)
          ? guestOnboarding.portfolioItems
          : [];
        if (guestPortfolioItems.length > 0) {
          const { data: existingPortfolio } = await supabase
            .from('portfolio_items')
            .select('title')
            .eq('agency_id', freshAgency.id);

          const existingTitles = new Set(
            (existingPortfolio || [])
              .map((p: any) => (p.title || '').trim().toLowerCase())
              .filter(Boolean)
          );

          const baseSortOrder = existingPortfolio?.length || 0;
          const portfolioToInsert = guestPortfolioItems
            .filter((item: any) => item?.title?.trim() && !existingTitles.has(item.title.trim().toLowerCase()))
            .map((item: any, i: number) => {
              const rawImages = Array.isArray(item.images)
                ? item.images
                : (Array.isArray(item.image_urls)
                  ? item.image_urls.map((url: string, idx: number) => ({ url, alt_text: item.title || '', sort_order: idx }))
                  : []);

              const images = rawImages
                .map((img: any, idx: number) => {
                  const url = typeof img === 'string' ? img : img?.url;
                  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
                  return {
                    url,
                    alt_text: typeof img === 'object' && img?.alt_text ? img.alt_text : (item.title || ''),
                    sort_order: typeof img === 'object' && typeof img?.sort_order === 'number' ? img.sort_order : idx,
                  };
                })
                .filter(Boolean)
                .slice(0, 6);

              return {
                agency_id: freshAgency.id,
                title: item.title.trim(),
                category: item.category || 'Other',
                description: item.description || null,
                results: item.results || null,
                images: images as any,
                source_url: guestOnboarding?.scrapeData?.portfolio_url || null,
                is_active: true,
                sort_order: baseSortOrder + i,
              };
            });

          if (portfolioToInsert.length > 0) {
            await supabase.from('portfolio_items').insert(portfolioToInsert as any);
          }
        }

        const { data: et } = await supabase.from('terms_clauses').select('id').eq('agency_id', freshAgency.id);
        if (!et?.length) {
          await supabase.from('terms_clauses').insert([
            { title: 'Payment Terms', content: 'All fees are due according to the payment schedule outlined in the Investment section of this proposal. Invoices will be issued at each milestone and are payable within 14 days of receipt.', display_order: 1 },
            { title: 'Project Timeline & Milestones', content: 'The project timeline outlined in this proposal is an estimate based on the defined scope of work. Actual timelines may vary depending on the timely provision of client feedback, content, assets, and approvals.', display_order: 2 },
            { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable. Additional revision rounds beyond the included allowance will be billed at our standard hourly rate.', display_order: 3 },
            { title: 'Intellectual Property', content: 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project.', display_order: 4 },
            { title: 'Confidentiality', content: 'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement.', display_order: 5 },
            { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified in the notice period above.', display_order: 6 },
            { title: 'Liability', content: "The agency's total liability under this agreement shall not exceed the total fees paid by the client for the services.", display_order: 7 },
            { title: 'Governing Law', content: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the agency is registered.', display_order: 8 },
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
            client_responsibilities: s.client_responsibilities || [],
            out_of_scope: s.out_of_scope || [],
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
    { title: 'Payment Terms', content: 'All fees are due according to the payment schedule outlined in the Investment section of this proposal. Invoices will be issued at each milestone and are payable within 14 days of receipt.' },
    { title: 'Project Timeline & Milestones', content: 'The project timeline outlined in this proposal is an estimate based on the defined scope of work. Actual timelines may vary depending on the timely provision of client feedback, content, assets, and approvals.' },
    { title: 'Revision Policy', content: 'This proposal includes the number of revision rounds specified per deliverable. Additional revision rounds beyond the included allowance will be billed at our standard hourly rate.' },
    { title: 'Intellectual Property', content: 'Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project.' },
    { title: 'Confidentiality', content: 'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement.' },
    { title: 'Termination', content: 'Either party may terminate this agreement with written notice as specified in the notice period above.' },
    { title: 'Liability', content: "The agency's total liability under this agreement shall not exceed the total fees paid by the client for the services." },
    { title: 'Governing Law', content: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction where the agency is registered.' },
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
        <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-52 flex-col gap-1 overflow-y-auto border-r border-border bg-background p-3 lg:flex print:hidden">
          {/* Section navigation */}
          <div className="mb-1 px-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Pages</span>
          </div>
          {sectionNames.map((name, idx) => {
            const isActive = activeSection === idx;
            const isHidden = deletedSections.has(idx) || (idx === 6 && !portfolioVisible);
            const LOCKED_SECTIONS = [0, 2, 4]; // Cover, Scope, Investment
            const isLocked = LOCKED_SECTIONS.includes(idx);

            return (
              <div key={idx}>
                <div
                  className="group flex items-center gap-1.5 cursor-pointer"
                  onClick={() => {
                    if (!isHidden) {
                      setActiveSection(idx);
                      document.getElementById(`guest-section-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {/* Highlighted section name area */}
                  <div className={cn(
                    'flex-1 rounded-lg px-3 py-1.5 transition-all duration-200',
                    isHidden ? 'opacity-50' : '',
                    isActive && !isHidden ? '' : 'hover:bg-[#F4F0EA]',
                  )} style={isActive && !isHidden ? { backgroundColor: 'hsl(24 28% 13% / 0.85)' } : {}}>
                    <span className={cn(
                      'text-[13px] font-normal transition-colors',
                      isHidden ? 'line-through' : '',
                    )} style={{ color: isActive && !isHidden ? '#FFFFFF' : isHidden ? '#C8C3BB' : '#7A7265' }}>
                      {name}
                    </span>
                  </div>

                  {/* Lock or eye toggle — outside the highlight */}
                  <div className="w-6 flex items-center justify-center shrink-0">
                    {isLocked && !isHidden ? (
                      <span style={{ color: '#D5CFC7' }}><Lock className="h-3 w-3" /></span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (idx === 6) {
                            setPortfolioVisible(!portfolioVisible);
                          } else if (isHidden) {
                            restoreSection(idx);
                          } else {
                            deleteSection(idx);
                          }
                        }}
                        className={cn(
                          'p-0.5 rounded transition-all',
                          isHidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                        style={{ color: isHidden ? '#C8C3BB' : '#B8B0A5' }}
                      >
                        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Scope Display toggles */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEEAE3' }}>
            <span className="block px-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Scope Display</span>
            <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer group">
              <input type="checkbox" checked={showClientResponsibilities}
                onChange={(e) => setShowClientResponsibilities(e.target.checked)}
                className="rounded border-border text-[#2A2118] focus:ring-[#2A2118] h-3.5 w-3.5 accent-[#2A2118]" />
              <span className="text-xs group-hover:text-foreground transition-colors" style={{ color: '#7A7265' }}>Client Responsibilities</span>
            </label>
            <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer group">
              <input type="checkbox" checked={showOutOfScope}
                onChange={(e) => setShowOutOfScope(e.target.checked)}
                className="rounded border-border text-[#2A2118] focus:ring-[#2A2118] h-3.5 w-3.5 accent-[#2A2118]" />
              <span className="text-xs group-hover:text-foreground transition-colors" style={{ color: '#7A7265' }}>Out of Scope</span>
            </label>
          </div>

          {/* Portfolio toggle */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEEAE3' }}>
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Portfolio</span>
              <button
                onClick={() => setPortfolioVisible(!portfolioVisible)}
                className={cn(
                  'relative w-8 h-[18px] rounded-full transition-colors',
                  portfolioVisible ? 'bg-[#2A2118]' : 'bg-[#D5CFC7]'
                )}
              >
                <span className={cn(
                  'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-transform shadow-sm',
                  portfolioVisible ? 'left-[16px]' : 'left-[2px]'
                )} />
              </button>
            </div>
          </div>

          {/* TEMPLATE zone */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEEAE3' }}>
            <span className="block px-2 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Template</span>
            <div className="flex items-center justify-between px-1 pb-1">
              {Object.values(templates).map((tmpl) => {
                const isActive = templateId === tmpl.id;
                const isLocked = tmpl.isPro;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => switchTemplate(tmpl.id)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="relative">
                      <div className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center',
                        isActive ? 'border-[#2A2118] ring-2 ring-[#2A2118]/20 scale-110' : 'border-[#EEEAE3] hover:border-[#D5CFC7] hover:scale-105'
                      )} style={{ background: tmpl.colors.background }}>
                        <div className="w-5 h-0.5 rounded-full" style={{ background: tmpl.colors.primaryAccent }} />
                      </div>
                      {isLocked && (
                        <span className="absolute -top-1 -right-2 rounded-full text-white px-1 py-px" style={{ backgroundColor: '#2A2118', fontSize: '6px', fontWeight: 700, letterSpacing: '0.03em', lineHeight: '1.3' }}>
                          PRO
                        </span>
                      )}
                    </div>
                    <span className={cn('text-[10px] transition-colors', isActive ? 'font-medium' : '')} style={{ color: isActive ? '#2A2118' : '#B8B0A5' }}>
                      {tmpl.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLORS zone */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEEAE3' }}>
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Colors</span>
              <span className="text-[8px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5" style={{ color: '#B8B0A5', backgroundColor: '#F4F0EA' }}>Preview</span>
            </div>
            <div className="flex items-center gap-3 px-2 relative" ref={colorPickerRef}>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => { setColorPickerOpen(colorPickerOpen === 'primaryAccent' ? null : 'primaryAccent'); setHexInput(activePrimary.replace('#', '')); }}
                  className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform"
                  style={{ background: activePrimary }}
                  title="Primary accent"
                />
                <span style={{ fontSize: '9px', color: '#B8B0A5' }}>Primary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => { setColorPickerOpen(colorPickerOpen === 'secondaryAccent' ? null : 'secondaryAccent'); setHexInput(activeSecondary.replace('#', '')); }}
                  className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform"
                  style={{ background: activeSecondary }}
                  title="Secondary accent"
                />
                <span style={{ fontSize: '9px', color: '#B8B0A5' }}>Secondary</span>
              </div>
              {customColors && (
                <button onClick={resetColors} className="ml-auto hover:text-foreground" style={{ fontSize: '10px', color: '#B8B0A5' }}>
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
              {colorPickerOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 w-48">
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { updateCustomColor(colorPickerOpen, c); setColorPickerOpen(null); }}
                        className={cn('w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform', (customColors?.[colorPickerOpen] || currentTemplate.colors[colorPickerOpen]) === c ? 'border-foreground' : 'border-transparent')}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] text-muted-foreground">#</span>
                    <input
                      value={hexInput}
                      onChange={e => setHexInput(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
                      onKeyDown={e => { if (e.key === 'Enter' && hexInput.length >= 3) { updateCustomColor(colorPickerOpen, `#${hexInput}`); setColorPickerOpen(null); } }}
                      placeholder="HEX"
                      className="flex-1 text-xs bg-muted rounded px-2 py-1 border-none outline-none"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground/60 mt-2">Sign up to save colors</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proposal Content */}
        <div className="flex-1">
          {/* Pro template preview banner */}
          {isPreviewingPro && (
            <div className="sticky top-[57px] z-20 flex items-center justify-center gap-3 bg-foreground/90 text-background px-4 py-2 text-xs backdrop-blur print:hidden">
              <span>Previewing <strong>{currentTemplate.name}</strong> template. Upgrade to send proposals with this template.</span>
              <button
                onClick={() => navigate('/pricing')}
                className="rounded-md bg-background/20 hover:bg-background/30 px-3 py-1 text-xs font-medium transition-colors"
              >
                See plans
              </button>
            </div>
          )}
          <TemplateProvider templateId={templateId} customColors={{ primaryAccent: activePrimary, secondaryAccent: activeSecondary, ...(customColors || {}) }}>
          <BrandProvider brand={{
            agencyName: agencyName.toUpperCase(),
            agencyFullName: agencyName,
            primaryColor: customColors?.primaryAccent || brandColor,
            darkColor: '#0A0A0A',
            logoUrl: localLogoUrl || identity.logo_url || null,
            logoInitial: (agencyName || 'A').charAt(0).toUpperCase(),
            contactEmail: identity.email || '',
            contactWebsite: '',
            contactPhone: identity.phone || '',
            currency: currencySymbol,
          }}>
            <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
            <div className="mx-auto max-w-[900px] py-8 px-4 space-y-6">

              {/* Section 0: Cover */}
              {!deletedSections.has(0) && (
                <div id="guest-section-0" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg">
                  <HeroCover
                    proposalTitle={proposalTitle}
                    clientName={clientName}
                    date={proposalDate}
                    proposalNumber="DRAFT-001"
                    onTitleEdit={handleTitleEdit}
                    onLogoClick={() => logoInputRef.current?.click()}
                  />
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 1: Executive Summary */}
              {!deletedSections.has(1) && (
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
                    <div className="mt-12 space-y-4">
                      <HighlightPanel items={[
                        { label: 'Investment', value: totalStr, accent: true },
                        { label: 'Timeline', value: calculateTimeline(phases) },
                        { label: 'Objectives', value: getObjectivesStat(guestProposal.goals, guestProposal.clientGoal, localServices.length) },
                      ]} />
                      {(() => {
                        const kpiItems = getKpiBarItems(guestProposal.goals);
                        if (!kpiItems) return null;
                        const hasNumbers = kpiItems.some(k => /\d/.test(k.value));
                        return (
                          <HighlightPanel variant="dark" items={kpiItems.map(k => ({
                            label: k.label,
                            value: k.value,
                            accent: hasNumbers && /\d/.test(k.value),
                          }))} />
                        );
                      })()}
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 2: Scope of Services */}
              {!deletedSections.has(2) && (
                <div id="guest-section-2" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="03">
                    <SectionHeader number="02" title="Scope of Services" subtitle="What we'll deliver for you" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {localServices.map((svc: any, i: number) => {
                        const price = svc.priceOverride ?? getModulePriceByModel(svc);
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
                            clientResponsibilities={showClientResponsibilities ? (svc.client_responsibilities || []) : []}
                            outOfScope={showOutOfScope ? (svc.out_of_scope || []) : []}
                            isAddon={svc.service_type === 'addon'}
                            delay={i * 0.1}
                            onNameEdit={(val) => handleServiceEdit(i, 'name', val)}
                            onDescriptionEdit={(val) => handleServiceEdit(i, 'description', val)}
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
              {!deletedSections.has(3) && (
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
              {!deletedSections.has(4) && (
                <div id="guest-section-4" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="05">
                    <SectionHeader number="04" title="Investment" subtitle="Transparent pricing for every deliverable" />
                    <PricingSummary items={pricingItems} total={totalStr} brandColor={customColors?.primaryAccent || brandColor} />
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 5: Why Us */}
              {!deletedSections.has(5) && differentiators.length > 0 && (
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
                        <WhyUsCard key={i} title={d.title} description={d.description || ''} statValue={d.stat_value} statLabel={d.stat_label} icon={d.icon} delay={i * 0.1}
                          onTitleEdit={(val) => setLocalDifferentiators(prev => prev.map((x, j) => j === i ? { ...x, title: val } : x))}
                          onDescriptionEdit={(val) => setLocalDifferentiators(prev => prev.map((x, j) => j === i ? { ...x, description: val } : x))}
                        />
                      ))}
                    </div>
                    {/* Team Members Block */}
                    <div className="mt-12">
                      <p className="mb-6 text-center" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999' }}>
                        The Team Behind Your Project
                      </p>
                      {guestTeamMembers.length > 0 && (() => {
                        const TEAM_PREVIEW_COUNT = 6;
                        const hasMore = guestTeamMembers.length > TEAM_PREVIEW_COUNT;
                        const visibleMembers = guestTeamExpanded ? guestTeamMembers : guestTeamMembers.slice(0, TEAM_PREVIEW_COUNT);
                        const gridClass = `grid gap-6 justify-center ${visibleMembers.length <= 2 ? 'grid-cols-2 max-w-md mx-auto' : visibleMembers.length === 3 ? 'grid-cols-3 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-4'}`;
                        return (
                          <>
                            <div className={gridClass}>
                              {visibleMembers.map((member: any, i: number) => (
                                <TeamMemberCard
                                  key={member.id || i}
                                  name={member.name}
                                  title={member.title}
                                  photoUrl={member.photo_url}
                                  delay={i * 0.1}
                                  onRemove={() => {
                                    const next = guestTeamMembers.filter((_: any, idx: number) => idx !== i);
                                    setGuestTeamMembers(next);
                                    saveGuestTeam(next);
                                    toast.success(`${member.name} removed`);
                                  }}
                                  onNameEdit={(val) => {
                                    const next = guestTeamMembers.map((m: any, idx: number) => idx === i ? { ...m, name: val } : m);
                                    setGuestTeamMembers(next);
                                    saveGuestTeam(next);
                                  }}
                                  onTitleEdit={(val) => {
                                    const next = guestTeamMembers.map((m: any, idx: number) => idx === i ? { ...m, title: val } : m);
                                    setGuestTeamMembers(next);
                                    saveGuestTeam(next);
                                  }}
                                  onPhotoUpload={(file) => {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      const dataUrl = e.target?.result as string;
                                      const next = guestTeamMembers.map((m: any, idx2: number) => idx2 === i ? { ...m, photo_url: dataUrl } : m);
                                      setGuestTeamMembers(next);
                                      saveGuestTeam(next);
                                      toast.success('Photo updated');
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              ))}
                            </div>
                            {hasMore && (
                              <div className="flex justify-center mt-4 print:hidden">
                                <button
                                  onClick={() => setGuestTeamExpanded(!guestTeamExpanded)}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {guestTeamExpanded ? 'Show less' : `Show all ${guestTeamMembers.length} team members`}
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${guestTeamExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div className="flex justify-center mt-4 print:hidden">
                          <button
                            onClick={() => {
                              const newMember = { id: crypto.randomUUID(), name: 'New Member', title: 'Role', photo_url: null };
                              const next = [...guestTeamMembers, newMember];
                              setGuestTeamMembers(next);
                              saveGuestTeam(next);
                              toast.success('Team member added');
                            }}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 px-4 py-2.5 text-sm text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground transition-colors"
                          >
                            <UserPlus className="h-4 w-4" />
                            Add team member
                          </button>
                      </div>
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 6: Portfolio */}
              {!deletedSections.has(6) && portfolioVisible && (() => {
                const portfolioItems = guestOnboarding?.portfolioItems || [];
                if (portfolioItems.length === 0) return null;
                return (
                  <div id="guest-section-6" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                    <PageWrapper pageNumber="07">
                      <SectionHeader number="06" title="Our Work" subtitle="Selected projects from our portfolio" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {portfolioItems.filter((p: any) => p.is_active !== false).slice(0, 6).map((item: any, idx: number) => (
                          <PortfolioCard
                            key={item.id || idx}
                            title={item.title}
                            category={item.category}
                            description={item.description}
                            results={item.results}
                            imageUrl={item.images?.[0]?.url}
                            imageAlt={item.images?.[0]?.alt_text}
                            delay={idx * 0.1}
                          />
                        ))}
                      </div>
                    </PageWrapper>
                    <PreviewWatermark />
                  </div>
                );
              })()}

              {/* Section 7: Testimonials */}
              {!deletedSections.has(7) && testimonials.length > 0 && (
                <div id="guest-section-7" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="08">
                    <SectionHeader number="07" title="What Our Clients Say" subtitle="Proof of impact" />
                    <div className="space-y-6">
                      {testimonials.slice(0, 4).map((t: any, i: number) => (
                        <TestimonialCard key={i} clientName={t.client_name} clientTitle={t.client_title} clientCompany={t.client_company} quote={t.quote} metricValue={t.metric_value} metricLabel={t.metric_label} avatarUrl={t.avatar_url} featured={i === 0} delay={i * 0.1}
                          onQuoteEdit={(val) => setLocalTestimonials(prev => { const u = prev.map((x, j) => j === i ? { ...x, quote: val } : x); saveGuestTestimonials(u); return u; })}
                          onNameEdit={(val) => setLocalTestimonials(prev => { const u = prev.map((x, j) => j === i ? { ...x, client_name: val } : x); saveGuestTestimonials(u); return u; })}
                          onTitleEdit={(val) => setLocalTestimonials(prev => { const u = prev.map((x, j) => j === i ? { ...x, client_title: val } : x); saveGuestTestimonials(u); return u; })}
                          onCompanyEdit={(val) => setLocalTestimonials(prev => { const u = prev.map((x, j) => j === i ? { ...x, client_company: val } : x); saveGuestTestimonials(u); return u; })}
                          onMetricValueEdit={(val) => setLocalTestimonials(prev => { const u = prev.map((x, j) => j === i ? { ...x, metric_value: val } : x); saveGuestTestimonials(u); return u; })}
                          onMetricLabelEdit={(val) => setLocalTestimonials(prev => { const u = prev.map((x, j) => j === i ? { ...x, metric_label: val } : x); saveGuestTestimonials(u); return u; })}
                          onRemove={() => setLocalTestimonials(prev => { const u = prev.filter((_, j) => j !== i); saveGuestTestimonials(u); return u; })}
                        />
                      ))}
                    </div>
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 8: Terms */}
              {!deletedSections.has(8) && (
                <div id="guest-section-8" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="09">
                    <SectionHeader number="08" title="Terms & Conditions" />
                    <TermsSection clauses={[
                      ...defaultTerms,
                      ...(localServices.some((s: any) => s.client_responsibilities?.length || s.out_of_scope?.length) ? [{
                        title: 'Scope & Responsibilities',
                        content: 'The client is responsible for providing timely feedback, required access credentials, and content/assets as outlined in each service\'s scope. Work beyond the deliverables listed for each service is considered out of scope and may require a separate agreement.'
                      }] : []),
                    ]} />
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}

              {/* Section 9: Signature */}
              {!deletedSections.has(9) && (
                <div id="guest-section-9" className="relative scroll-mt-20 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="10">
                    <SignatureBlock
                      client={{ role: 'Client', companyName: clientName }}
                      agency={{ role: 'Agency', companyName: agencyName }}
                      onClosingHeadingEdit={(val) => {}}
                      onClosingSubtitleEdit={(val) => {}}
                      onClosingEmailEdit={(val) => {}}
                      onClosingPhoneEdit={(val) => {}}
                    />
                  </PageWrapper>
                  <PreviewWatermark />
                </div>
              )}
            </div>
          </BrandProvider>
          </TemplateProvider>
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
