import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useBeforeUnload } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Share2, Download, Send, LinkIcon,
  ChevronDown, FileText, Check, DollarSign, Clock,
  RefreshCw, MoreHorizontal, Plus, X, Search, RotateCcw, Loader2,
  Lock, Palette, Image, ExternalLink, ChevronUp, UserPlus,
  GripVertical,
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
  TeamMemberCard,
  PortfolioCard,
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
  show_client_responsibilities: boolean;
  show_out_of_scope: boolean;
}

interface ProposalService {
  id: string;
  module_id: string | null;
  bundle_id: string | null;
  price_override: number | null;
  display_order: number | null;
  is_addon: boolean | null;
  custom_deliverables: string[] | null;
  client_responsibilities: string[] | null;
  out_of_scope: string[] | null;
  show_responsibilities: boolean | null;
  show_out_of_scope: boolean | null;
  module?: {
    name: string;
    description: string | null;
    short_description: string | null;
    pricing_model: string | null;
    price_fixed: number | null;
    price_monthly: number | null;
    price_hourly: number | null;
    deliverables: string[] | null;
    client_responsibilities: string[] | null;
    out_of_scope: string[] | null;
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
  'Investment', 'Why Us', 'Portfolio', 'Testimonials', 'Terms', 'Signature',
];

const DEFAULT_SECTION_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const LOCKED_SECTIONS = new Set([0, 2, 4]); // Cover, Scope, Investment

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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [allPortfolioItems, setAllPortfolioItems] = useState<any[]>([]);
  const [serviceGroups, setServiceGroups] = useState<any[]>([]);
  const [proposalTeam, setProposalTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletedSections, setDeletedSections] = useState<Set<number>>(new Set([6])); // Portfolio hidden by default
  const [activeSection, setActiveSection] = useState(0);
  const [sectionOrder, setSectionOrder] = useState<number[]>([...DEFAULT_SECTION_ORDER]);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [addServiceSearch, setAddServiceSearch] = useState('');
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingTimeline, setRegeneratingTimeline] = useState(false);
  const [templateId, setTemplateId] = useState<string>('classic');
  const [customColors, setCustomColors] = useState<Record<string, string> | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [hexInput, setHexInput] = useState('');
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null);
  const currencySymbol = agency?.currency_symbol || '$';
  const undoRef = useRef<{ field: string; value: any } | null>(null);

  // Warn user before leaving if an editable field is focused (unsaved inline edit)
  useBeforeUnload(
    useCallback((e) => {
      const active = document.activeElement;
      if (active && active.getAttribute('contenteditable') === 'true') {
        e.preventDefault();
      }
    }, [])
  );

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (id) loadProposal();
  }, [id]);

  const loadProposal = async () => {
    if (!id) return;
    setLoading(true);

    const [propRes, svcRes] = await Promise.all([
      supabase.from('proposals').select('*').eq('id', id).single(),
      supabase.from('proposal_services')
        .select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, client_responsibilities, out_of_scope, icon, group_id, service_groups(name))')
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
    setCustomColors((propRes.data as any).custom_colors || null);
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
      const [diffRes, testRes, termsRes, portfolioRes, sgRes] = await Promise.all([
        supabase.from('differentiators').select('*').eq('agency_id', propRes.data.agency_id).order('display_order'),
        supabase.from('testimonials').select('*').eq('agency_id', propRes.data.agency_id).order('created_at', { ascending: false }),
        supabase.from('terms_clauses').select('*').eq('agency_id', propRes.data.agency_id).order('display_order'),
        supabase.from('portfolio_items').select('*').eq('agency_id', propRes.data.agency_id).eq('is_active', true).order('sort_order'),
        supabase.from('service_groups').select('*').order('display_order'),
      ]);
      setDifferentiators(diffRes.data || []);
      setTestimonials(testRes.data || []);
      setTermsClauses(termsRes.data || []);
      setServiceGroups(sgRes.data || []);

      // Portfolio items
      const allPi = (portfolioRes.data || []).map((d: any) => ({ ...d, images: d.images || [] }));
      setAllPortfolioItems(allPi);
      const selectedIds: string[] = (propRes.data as any).selected_portfolio_ids || [];
      if (selectedIds.length > 0) {
        setPortfolioItems(allPi.filter((p: any) => selectedIds.includes(p.id)));
      } else {
        setPortfolioItems([]);
      }

      // Load team members from agency
      const { data: agencyData } = await supabase.from('agencies').select('team_members').eq('id', propRes.data.agency_id).single();
      const agencyTeam = Array.isArray((agencyData as any)?.team_members) ? (agencyData as any).team_members : [];
      setTeamMembers(agencyTeam);

      // Load proposal-specific team selection
      const proposalTeamData = (propRes.data as any).team;
      if (Array.isArray(proposalTeamData) && proposalTeamData.length > 0) {
        setProposalTeam(proposalTeamData);
      } else if (agencyTeam.length > 0) {
        const defaultTeam = agencyTeam.slice(0, 3).map((m: any) => ({
          member_id: m.id,
          name: m.name,
          title: m.title,
          photo_url: m.photo_url,
          role_on_project: '',
        }));
        setProposalTeam(defaultTeam);
      }
    }

    // Sync portfolio visibility with deletedSections (Portfolio = index 6)
    if (!(propRes.data as any).portfolio_section_visible) {
      setDeletedSections(prev => new Set([...prev, 6]));
    } else {
      setDeletedSections(prev => { const next = new Set(prev); next.delete(6); return next; });
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
          }).select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, client_responsibilities, out_of_scope, icon)').single();
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
      client_responsibilities: mod.client_responsibilities || [],
      out_of_scope: mod.out_of_scope || [],
    } as any).select('*, service_modules(name, description, short_description, pricing_model, price_fixed, price_monthly, price_hourly, deliverables, client_responsibilities, out_of_scope, icon)').single();
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
    // Store undo state
    undoRef.current = { field, value: (proposal as any)[field] };
    await supabase.from('proposals').update({ [field]: value }).eq('id', proposal.id);
    setProposal(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // Undo last change with Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        const active = document.activeElement;
        if (active && active.getAttribute('contenteditable') === 'true') return; // let browser handle it
        if (undoRef.current && proposal) {
          e.preventDefault();
          const { field, value } = undoRef.current;
          undoRef.current = null;
          updateField(field, value);
          toast.success('Change undone');
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [proposal]);

  // Scroll tracking for active section highlight
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handler = () => {
      const containerTop = container.getBoundingClientRect().top;
      let closest = sectionOrder[0];
      let closestDist = Infinity;
      for (const idx of sectionOrder) {
        if (deletedSections.has(idx)) continue;
        const el = document.getElementById(`section-${idx}`);
        if (!el) continue;
        const dist = Math.abs(el.getBoundingClientRect().top - containerTop - 100);
        if (dist < closestDist) { closestDist = dist; closest = idx; }
      }
      setActiveSection(closest);
    };
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, [sectionOrder, deletedSections]);

  // Drag-and-drop section reorder handlers
  const handleDragStart = (orderIdx: number) => setDragIdx(orderIdx);
  const handleDragOver = (e: React.DragEvent, overIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === overIdx) return;
    setSectionOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragIdx(overIdx);
  };
  const handleDragEnd = () => setDragIdx(null);
  const isReordered = JSON.stringify(sectionOrder) !== JSON.stringify(DEFAULT_SECTION_ORDER);
  const resetOrder = () => setSectionOrder([...DEFAULT_SECTION_ORDER]);

  const saveProposalTeam = useCallback(async (team: any[]) => {
    if (!proposal) return;
    await supabase.from('proposals').update({ team } as any).eq('id', proposal.id);
  }, [proposal]);

  const toggleTeamMember = (member: any) => {
    setProposalTeam(prev => {
      const exists = prev.find((m: any) => m.member_id === member.id);
      let next: any[];
      if (exists) {
        next = prev.filter((m: any) => m.member_id !== member.id);
      } else {
        next = [...prev, {
          member_id: member.id,
          name: member.name,
          title: member.title,
          photo_url: member.photo_url,
          role_on_project: '',
        }];
      }
      saveProposalTeam(next);
      return next;
    });
  };

  const updateTeamRole = (memberId: string, role: string) => {
    setProposalTeam(prev => {
      const next = prev.map((m: any) => m.member_id === memberId ? { ...m, role_on_project: role } : m);
      saveProposalTeam(next);
      return next;
    });
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

  const deleteSection = (idx: number) => {
    setDeletedSections(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    toast.success(`${sectionNames[idx]} hidden`, {
      action: { label: 'Undo', onClick: () => restoreSection(idx) },
    });
  };

  const restoreSection = (idx: number) => {
    setDeletedSections(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    toast.success(`${sectionNames[idx]} restored`);
  };

  const switchTemplate = async (newId: string) => {
    const tmpl = templates[newId];
    if (!tmpl) return;
    // Logged-in users can use all templates (treat as paid for now)
    setTemplateId(newId);
    if (proposal) {
      await supabase.from('proposals').update({ template_id: newId }).eq('id', proposal.id);
    }
  };

  const updateCustomColor = async (key: string, value: string) => {
    const updated = { ...(customColors || {}), [key]: value };
    setCustomColors(updated);
    if (proposal) {
      await supabase.from('proposals').update({ custom_colors: updated } as any).eq('id', proposal.id);
    }
  };

  const resetColors = async () => {
    setCustomColors(null);
    setColorPickerOpen(null);
    if (proposal) {
      await supabase.from('proposals').update({ custom_colors: null } as any).eq('id', proposal.id);
    }
  };

  // Logo upload handler — saves to Supabase Storage + agency settings
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agency?.id) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${agency.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
    if (uploadError) { toast.error('Upload failed'); return; }
    const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('agencies').update({ logo_url: publicUrl }).eq('id', agency.id);
    setLocalLogoUrl(publicUrl);
    toast.success('Logo updated and saved to settings');
    e.target.value = '';
  };

  const PRESET_COLORS = ['#E8825C', '#2563EB', '#34D399', '#f9b564', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#1E1B4B'];

  const currentTemplate = templates[templateId] || templates.classic;
  // Brand color is the universal default; custom picks override it across all templates
  const brandColor = agency?.brand_color || '#fc956e';
  const activePrimary = customColors?.primaryAccent || brandColor;
  const activeSecondary = customColors?.secondaryAccent || currentTemplate.colors.secondaryAccent;

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

  const proposalDate = proposal.project_start_date || new Date(proposal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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
        {/* Sidebar */}
        <div className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-[260px] flex-col border-r lg:flex print:hidden" style={{ backgroundColor: '#FAFAF7', fontFamily: "'DM Sans', sans-serif" }}>
          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Back link */}
            <button onClick={() => navigate('/proposals')} className="flex items-center gap-2 mb-4 px-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to proposals
            </button>

            {/* TEMPLATE zone */}
            <div className="mb-3">
              <span className="block px-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Template</span>
              <div className="flex gap-2">
                {Object.values(templates).map((tmpl) => {
                  const isActive = templateId === tmpl.id;
                  const isLocked = tmpl.isPro;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => switchTemplate(tmpl.id)}
                      className={cn(
                        'flex-1 rounded-lg overflow-hidden border-2 transition-all',
                        isActive ? 'border-[#2A2118] ring-1 ring-[#2A2118]/20' : 'border-[#EEEAE3] hover:border-[#D5CFC7]'
                      )}
                    >
                      <div className="h-10 relative" style={{ background: tmpl.colors.background }}>
                        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: tmpl.colors.primaryAccent }} />
                        {isLocked && (
                          <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-foreground/80 text-background rounded px-1 py-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            <span style={{ fontSize: '8px', fontWeight: 700 }}>PRO</span>
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-1.5" style={{ backgroundColor: '#FAFAF7' }}>
                        <span className={cn('block text-center', isActive ? 'font-semibold' : '')} style={{ fontSize: '11px', color: isActive ? '#2A2118' : '#B8B0A5' }}>
                          {tmpl.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLORS zone */}
            <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #EEEAE3' }}>
              <span className="block px-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Colors</span>
              <div className="flex items-center gap-3 px-2 relative" ref={colorPickerRef}>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => { setColorPickerOpen(colorPickerOpen === 'primaryAccent' ? null : 'primaryAccent'); setHexInput(activePrimary); }}
                    className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform" style={{ background: activePrimary, borderColor: '#EEEAE3' }}
                  />
                  <span style={{ fontSize: '9px', color: '#B8B0A5' }}>Primary</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => { setColorPickerOpen(colorPickerOpen === 'secondaryAccent' ? null : 'secondaryAccent'); setHexInput(activeSecondary); }}
                    className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform" style={{ background: activeSecondary, borderColor: '#EEEAE3' }}
                  />
                  <span style={{ fontSize: '9px', color: '#B8B0A5' }}>Secondary</span>
                </div>
                {customColors && (
                  <button onClick={resetColors} className="ml-auto hover:text-foreground" style={{ fontSize: '10px', color: '#B8B0A5' }}>Reset</button>
                )}
                {colorPickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 bg-popover border border-border rounded-xl p-3 shadow-lg" style={{ width: '200px' }}>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => { updateCustomColor(colorPickerOpen, color); setColorPickerOpen(null); }}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                            (colorPickerOpen === 'primaryAccent' ? activePrimary : activeSecondary) === color ? 'border-foreground scale-110' : 'border-transparent'
                          )}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="text" value={hexInput} onChange={(e) => setHexInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && /^#[0-9A-Fa-f]{6}$/.test(hexInput)) { updateCustomColor(colorPickerOpen, hexInput); setColorPickerOpen(null); } }}
                        placeholder="#000000"
                        className="flex-1 border border-border rounded-md px-2 py-1 text-xs bg-background text-foreground outline-none focus:border-brand"
                        style={{ fontSize: '11px' }} />
                      <button onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) { updateCustomColor(colorPickerOpen, hexInput); setColorPickerOpen(null); } }}
                        className="text-xs text-brand hover:text-brand-hover font-medium">OK</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTIONS zone */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Sections</span>
                {isReordered && (
                  <button onClick={resetOrder} className="text-[11px] hover:text-foreground transition-colors" style={{ color: '#B8B0A5' }}>Reset order</button>
                )}
              </div>

              <div className="space-y-0.5">
                {sectionOrder.map((sectionIdx, orderIdx) => {
                  const name = sectionNames[sectionIdx];
                  const isLocked = LOCKED_SECTIONS.has(sectionIdx);
                  const isHidden = deletedSections.has(sectionIdx);
                  const isActive = activeSection === sectionIdx;
                  const isExpanded = expandedSection === sectionIdx;

                  // Section-specific controls config
                  const hasControls = [1, 5, 6, 7].includes(sectionIdx); // Exec Summary, Why Us, Portfolio, Testimonials

                  return (
                    <div key={sectionIdx}>
                      <div
                        draggable={!isLocked}
                        onDragStart={() => handleDragStart(orderIdx)}
                        onDragOver={(e) => handleDragOver(e, orderIdx)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'group flex items-center gap-1.5 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer',
                          isHidden ? 'opacity-50' : '',
                          isActive && !isHidden ? '' : 'hover:bg-[#F4F0EA]',
                        )}
                        style={isActive && !isHidden ? {
                          backgroundColor: 'hsl(24 28% 13%)',
                        } : {}}
                        onClick={() => {
                          if (!isHidden) {
                            setActiveSection(sectionIdx);
                            setExpandedSection(isExpanded ? null : (hasControls ? sectionIdx : null));
                            document.getElementById(`section-${sectionIdx}`)?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        {/* Drag handle */}
                        <span className={cn('transition-opacity', isLocked ? 'opacity-0' : 'opacity-0 group-hover:opacity-100')}
                          style={{ color: isActive && !isHidden ? '#FFFFFF60' : '#C8C3BB', cursor: isLocked ? 'default' : 'grab' }}>
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>

                        {/* Section name */}
                        <span className={cn(
                          'flex-1 text-[13px] font-normal transition-colors',
                          isHidden ? 'line-through' : '',
                        )} style={{ color: isActive && !isHidden ? '#FFFFFF' : isHidden ? '#C8C3BB' : '#7A7265' }}>
                          {name}
                        </span>

                        {/* Lock or eye toggle */}
                        {isLocked ? (
                          <span style={{ color: isActive && !isHidden ? '#FFFFFF80' : '#D5CFC7' }}><Lock className="h-3 w-3" /></span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isHidden) {
                                restoreSection(sectionIdx);
                                // If it's portfolio, also update the field
                                if (sectionIdx === 6) updateField('portfolio_section_visible', true);
                              } else {
                                deleteSection(sectionIdx);
                                if (sectionIdx === 6) updateField('portfolio_section_visible', false);
                              }
                            }}
                            className="p-0.5 rounded transition-all"
                            style={{ color: isHidden ? '#C8C3BB' : isActive ? '#FFFFFF80' : '#B8B0A5' }}
                          >
                            {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Expandable section-specific controls */}
                      {isExpanded && !isHidden && (
                        <div className="ml-7 mr-2 mb-2 mt-1 transition-all duration-200">
                          {/* Executive Summary controls */}
                          {sectionIdx === 1 && (
                            <div className="space-y-2 p-2 rounded-lg" style={{ backgroundColor: '#F4F0EA' }}>
                              <span className="text-[10px] font-medium" style={{ color: '#7A7265' }}>Tone</span>
                              <div className="flex flex-wrap gap-1.5">
                                {['professional', 'friendly', 'bold', 'concise'].map(tone => (
                                  <button key={tone} onClick={() => updateField('executive_summary_tone', tone)}
                                    className={cn(
                                      'rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                                      (proposal as any)?.executive_summary_tone === tone
                                        ? 'bg-[#2A2118] text-white'
                                        : 'bg-white text-[#7A7265] hover:bg-[#EEEAE3]'
                                    )}>
                                    {tone}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  if (!confirm('Regenerate this section? Your current edits will be replaced.')) return;
                                  regenerateExecutiveSummary();
                                }}
                                disabled={regenerating}
                                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-white disabled:opacity-50"
                                style={{ borderColor: '#EEEAE3', color: '#7A7265' }}>
                                {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                {regenerating ? 'Regenerating...' : 'Regenerate'}
                              </button>
                            </div>
                          )}

                          {/* Why Us controls */}
                          {sectionIdx === 5 && (
                            <div className="space-y-1.5 p-2 rounded-lg" style={{ backgroundColor: '#F4F0EA' }}>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px]" style={{ color: '#7A7265' }}>{differentiators.length} differentiators</span>
                              </div>
                              <Link to="/settings/differentiators" className="flex items-center gap-1 text-[11px] text-brand hover:text-brand-hover">
                                Edit differentiators <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          )}

                          {/* Portfolio controls */}
                          {sectionIdx === 6 && (
                            <div className="space-y-2 p-2 rounded-lg" style={{ backgroundColor: '#F4F0EA' }}>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px]" style={{ color: '#7A7265' }}>
                                  {portfolioItems.length} of {allPortfolioItems.length} selected
                                </span>
                                {portfolioItems.length >= 6 && (
                                  <span className="text-[10px] text-amber-600 font-medium">Max 6</span>
                                )}
                              </div>
                              {allPortfolioItems.length > 0 ? (
                                <div className="max-h-[200px] overflow-y-auto space-y-1">
                                  {allPortfolioItems.map(item => {
                                    const isSelected = portfolioItems.some(p => p.id === item.id);
                                    const heroImg = item.images?.[0]?.url;
                                    return (
                                      <button key={item.id}
                                        onClick={() => {
                                          if (isSelected) {
                                            const updated = portfolioItems.filter(p => p.id !== item.id);
                                            setPortfolioItems(updated);
                                            updateField('selected_portfolio_ids', updated.map((p: any) => p.id));
                                          } else if (portfolioItems.length < 6) {
                                            const updated = [...portfolioItems, item];
                                            setPortfolioItems(updated);
                                            updateField('selected_portfolio_ids', updated.map((p: any) => p.id));
                                          }
                                        }}
                                        disabled={!isSelected && portfolioItems.length >= 6}
                                        className={cn(
                                          'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all text-[11px]',
                                          isSelected ? 'bg-brand/10 border border-brand/30' : 'bg-white border border-transparent hover:bg-white/80 disabled:opacity-40'
                                        )}>
                                        <div className="h-8 w-8 flex-shrink-0 rounded overflow-hidden bg-muted">
                                          {heroImg ? <img src={heroImg} alt="" className="h-full w-full object-cover" /> : <Image className="h-3 w-3 m-auto mt-2.5 text-muted-foreground/50" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate" style={{ color: '#2A2118' }}>{item.title}</p>
                                          <p className="truncate" style={{ color: '#B8B0A5', fontSize: '10px' }}>{item.category}</p>
                                        </div>
                                        {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-brand" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] text-center py-2" style={{ color: '#B8B0A5' }}>No portfolio items yet.</p>
                              )}
                              <div className="pt-1">
                                <label className="text-[10px] font-medium" style={{ color: '#7A7265' }}>Section title</label>
                                <input type="text" value={(proposal as any)?.portfolio_section_title || 'Our Work'}
                                  onChange={(e) => updateField('portfolio_section_title', e.target.value)}
                                  className="mt-0.5 w-full rounded-md border px-2 py-1 text-xs bg-white outline-none focus:border-brand"
                                  style={{ borderColor: '#EEEAE3', color: '#2A2118' }} />
                              </div>
                              <Link to="/settings/portfolio" target="_blank" className="flex items-center gap-1 text-[11px] text-brand hover:text-brand-hover">
                                Manage portfolio <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          )}

                          {/* Testimonials controls */}
                          {sectionIdx === 7 && (
                            <div className="space-y-1.5 p-2 rounded-lg" style={{ backgroundColor: '#F4F0EA' }}>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px]" style={{ color: '#7A7265' }}>
                                  {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {testimonials.length > 0 && (
                                <div className="max-h-[150px] overflow-y-auto space-y-1">
                                  {testimonials.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded bg-white text-[11px]">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate" style={{ color: '#2A2118' }}>{t.client_name}</p>
                                        <p className="truncate" style={{ color: '#B8B0A5', fontSize: '10px' }}>
                                          {t.client_company || t.quote?.slice(0, 30) + '...'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Link to="/settings/testimonials" target="_blank" className="flex items-center gap-1 text-[11px] text-brand hover:text-brand-hover">
                                Manage testimonials <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scope Display toggles */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEEAE3' }}>
                <span className="block px-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#B8B0A5' }}>Scope Display</span>
                <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer group">
                  <input type="checkbox" checked={proposal.show_client_responsibilities ?? true}
                    onChange={(e) => updateField('show_client_responsibilities', e.target.checked)}
                    className="rounded border-border text-[#2A2118] focus:ring-[#2A2118] h-3.5 w-3.5 accent-[#2A2118]" />
                  <span className="text-xs group-hover:text-foreground transition-colors" style={{ color: '#7A7265' }}>Client Responsibilities</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer group">
                  <input type="checkbox" checked={proposal.show_out_of_scope ?? true}
                    onChange={(e) => updateField('show_out_of_scope', e.target.checked)}
                    className="rounded border-border text-[#2A2118] focus:ring-[#2A2118] h-3.5 w-3.5 accent-[#2A2118]" />
                  <span className="text-xs group-hover:text-foreground transition-colors" style={{ color: '#7A7265' }}>Out of Scope</span>
                </label>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar — sticky */}
          <div className="p-3 space-y-2" style={{ borderTop: '1px solid #EEEAE3' }}>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#2A2118' }}>
              <Share2 className="h-4 w-4" /> Share Proposal
            </button>
            <div className="flex items-center justify-between px-1">
              <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[12px] transition-colors hover:text-foreground" style={{ color: '#B8B0A5' }}>
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px]" style={{ color: '#B8B0A5' }}>Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Content — rendered with template components */}
         <div ref={scrollContainerRef} className="flex-1 overflow-y-auto h-[calc(100vh-57px)]">
          <TemplateProvider templateId={templateId} customColors={{ primaryAccent: activePrimary, secondaryAccent: activeSecondary, ...(customColors || {}) }}>
          <BrandProvider brand={{
            agencyName: (agency?.name || 'Agency').toUpperCase(),
            agencyFullName: agency?.name || 'Agency',
            primaryColor: customColors?.primaryAccent || agency?.brand_color || '#fc956e',
            darkColor: agency?.dark_color || '#0A0A0A',
            logoUrl: localLogoUrl || agency?.logo_url || null,
            logoInitial: (agency?.name || 'A').charAt(0).toUpperCase(),
            contactEmail: agency?.email || '',
            contactWebsite: agency?.website || '',
            contactPhone: agency?.phone || '',
            currency: agency?.currency_symbol || '$',
          }}>
            <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
            <div className="mx-auto max-w-[900px] py-8 px-4 space-y-6 print:max-w-none print:p-0 print:space-y-0">
              

              {/* Section 0: Cover */}
              {!deletedSections.has(0) && <SectionWrapper idx={0} onDelete={deleteSection} label="Cover">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <HeroCover
                    proposalTitle={proposal.title || 'Proposal Title'}
                    subtitle={proposal.subtitle || undefined}
                    clientName={client?.company_name || 'Client'}
                    date={proposalDate}
                    proposalNumber={proposal.reference_number}
                    onTitleEdit={(val) => updateField('title', val)}
                    onSubtitleEdit={(val) => updateField('subtitle', val)}
                    onClientNameEdit={client ? async (val) => {
                      await supabase.from('clients').update({ company_name: val }).eq('id', client.id);
                      setClient({ ...client, company_name: val });
                    } : undefined}
                    onDateEdit={(val) => {
                      updateField('project_start_date', val);
                      setProposal({ ...proposal, project_start_date: val });
                    }}
                    onLogoClick={() => logoInputRef.current?.click()}
                  />
                </div>
              </SectionWrapper>}

              {/* Section 1: Executive Summary */}
              {!deletedSections.has(1) && <SectionWrapper idx={1} onDelete={deleteSection} label="Executive Summary">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="02">
                    <SectionHeader number="01" title="Executive Summary" subtitle="Our understanding and approach"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
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
                        onClick={() => {
                          if (!confirm('Regenerate this section? Your current edits will be replaced with a new AI-generated version.')) return;
                          regenerateExecutiveSummary();
                        }}
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
              </SectionWrapper>}

              {/* Section 2: Scope of Services */}
              {!deletedSections.has(2) && <SectionWrapper idx={2} onDelete={deleteSection} label="Scope of Services">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="03">
                    <SectionHeader number="02" title="Scope of Services" subtitle="What we'll deliver for you"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
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
                                clientResponsibilities={
                                  (proposal.show_client_responsibilities ?? true) && (svc.show_responsibilities !== false)
                                    ? (svc.client_responsibilities || svc.module?.client_responsibilities || [])
                                    : []
                                }
                                outOfScope={
                                  (proposal.show_out_of_scope ?? true) && (svc.show_out_of_scope !== false)
                                    ? (svc.out_of_scope || svc.module?.out_of_scope || [])
                                    : []
                                }
                                moduleDefaultResponsibilities={svc.module?.client_responsibilities || []}
                                moduleDefaultOutOfScope={svc.module?.out_of_scope || []}
                                isAddon={svc.is_addon || false}
                                delay={i * 0.1}
                                onNameEdit={async (val) => {
                                  if (svc.module_id) {
                                    await supabase.from('service_modules').update({ name: val }).eq('id', svc.module_id);
                                  }
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, module: s.module ? { ...s.module, name: val } : s.module } : s));
                                }}
                                onDescriptionEdit={async (val) => {
                                  await supabase.from('proposal_services').update({ custom_description: val }).eq('id', svc.id);
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, module: s.module ? { ...s.module, description: val } : s.module } : s));
                                }}
                                onDeliverablesEdit={async (dels) => {
                                  await supabase.from('proposal_services').update({ custom_deliverables: dels }).eq('id', svc.id);
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, custom_deliverables: dels } : s));
                                }}
                                onClientResponsibilitiesEdit={async (items) => {
                                  await supabase.from('proposal_services').update({ client_responsibilities: items } as any).eq('id', svc.id);
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, client_responsibilities: items } : s));
                                }}
                                onOutOfScopeEdit={async (items) => {
                                  await supabase.from('proposal_services').update({ out_of_scope: items } as any).eq('id', svc.id);
                                  setServices(prev => prev.map(s => s.id === svc.id ? { ...s, out_of_scope: items } : s));
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
              </SectionWrapper>}

              {/* Section 3: Timeline */}
              {!deletedSections.has(3) && <SectionWrapper idx={3} onDelete={deleteSection} label="Timeline">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="04">
                    <SectionHeader number="03" title="Timeline" subtitle="How we'll get there"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
                    
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
                        {/* Add/Remove phase controls */}
                        <div className="flex items-center gap-3 mt-4 print:hidden">
                          <button
                            onClick={() => {
                              const phases = [...(proposal.phases as any[]), { name: `Phase ${(proposal.phases as any[]).length + 1}`, duration: '2 weeks', description: '' }];
                              updateField('phases', phases);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                          >
                            <Plus className="h-3 w-3" /> Add Phase
                          </button>
                          {(proposal.phases as any[]).length > 1 && (
                            <button
                              onClick={() => {
                                const phases = [...(proposal.phases as any[])];
                                phases.pop();
                                updateField('phases', phases);
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                            >
                              <X className="h-3 w-3" /> Remove Last
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm('Regenerate timeline? Your current edits will be replaced with a new AI-generated version.')) return;
                              setRegeneratingTimeline(true);
                              try {
                                const serviceNames = services.map(s => ({ name: s.module?.name || 'Service' }));
                                const durationMatch = (proposal.estimated_duration || '16 weeks').match(/(\d+)/);
                                const totalWeeks = durationMatch ? parseInt(durationMatch[1]) : 16;
                                const { data } = await supabase.functions.invoke('generate-timeline', {
                                  body: { services: serviceNames, clientName: client?.company_name || 'Client', totalWeeks },
                                });
                                if (data?.phases) {
                                  await updateField('phases', data.phases);
                                  toast.success('Timeline regenerated!');
                                }
                              } catch { toast.error('Failed to regenerate timeline'); }
                              setRegeneratingTimeline(false);
                            }}
                            disabled={regeneratingTimeline}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 ml-auto"
                          >
                            {regeneratingTimeline ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            {regeneratingTimeline ? 'Regenerating...' : 'Regenerate'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-10 text-center py-12 print:hidden">
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
              </SectionWrapper>}

              {/* Section 4: Investment */}
              {!deletedSections.has(4) && <SectionWrapper idx={4} onDelete={deleteSection} label="Investment">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="05">
                    <SectionHeader number="04" title="Investment" subtitle="Transparent pricing for every deliverable"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
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
              </SectionWrapper>}

              {/* Section 5: Why Us */}
              {!deletedSections.has(5) && <SectionWrapper idx={5} onDelete={deleteSection} label="Why Us">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="07">
                    <SectionHeader number="06" title="Why Us" subtitle="What sets us apart"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
                    
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
                            onTitleEdit={async (val) => {
                              await supabase.from('differentiators').update({ title: val }).eq('id', d.id);
                              setDifferentiators(prev => prev.map(x => x.id === d.id ? { ...x, title: val } : x));
                            }}
                            onDescriptionEdit={async (val) => {
                              await supabase.from('differentiators').update({ description: val }).eq('id', d.id);
                              setDifferentiators(prev => prev.map(x => x.id === d.id ? { ...x, description: val } : x));
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Your Team Block */}
                    <div className="mt-12">
                      <p className="mb-6 text-center" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#999' }}>
                        The Team Behind Your Project
                      </p>
                      {proposalTeam.length > 0 && (
                        <div className={`grid gap-6 justify-center ${proposalTeam.length <= 2 ? 'grid-cols-2 max-w-md mx-auto' : proposalTeam.length === 3 ? 'grid-cols-3 max-w-lg mx-auto' : 'grid-cols-2 sm:grid-cols-4'}`}>
                          {proposalTeam.map((member: any, i: number) => (
                            <TeamMemberCard
                              key={member.member_id}
                              name={member.name}
                              title={member.title}
                              photoUrl={member.photo_url}
                              roleOnProject={member.role_on_project}
                              delay={i * 0.1}
                              onRemove={() => {
                                const next = proposalTeam.filter((m: any) => m.member_id !== member.member_id);
                                setProposalTeam(next);
                                saveProposalTeam(next);
                                toast.success(`${member.name} removed from team`);
                              }}
                              onNameEdit={async (val) => {
                                const next = proposalTeam.map((m: any) => m.member_id === member.member_id ? { ...m, name: val } : m);
                                setProposalTeam(next);
                                saveProposalTeam(next);
                                // Sync to agency team
                                if (agency?.id) {
                                  const updatedAgencyTeam = teamMembers.map((m: any) => m.id === member.member_id ? { ...m, name: val } : m);
                                  setTeamMembers(updatedAgencyTeam);
                                  await supabase.from('agencies').update({ team_members: updatedAgencyTeam as any }).eq('id', agency.id);
                                }
                              }}
                              onTitleEdit={async (val) => {
                                const next = proposalTeam.map((m: any) => m.member_id === member.member_id ? { ...m, title: val } : m);
                                setProposalTeam(next);
                                saveProposalTeam(next);
                                // Sync to agency team
                                if (agency?.id) {
                                  const updatedAgencyTeam = teamMembers.map((m: any) => m.id === member.member_id ? { ...m, title: val } : m);
                                  setTeamMembers(updatedAgencyTeam);
                                  await supabase.from('agencies').update({ team_members: updatedAgencyTeam as any }).eq('id', agency.id);
                                }
                              }}
                              onPhotoUpload={async (file) => {
                                if (!agency?.id) return;
                                const ext = file.name.split('.').pop() || 'jpg';
                                const path = `${agency.id}/team/${member.member_id}.${ext}`;
                                const { error } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
                                if (error) { toast.error('Upload failed'); return; }
                                const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
                                const photoUrl = urlData.publicUrl + '?t=' + Date.now();
                                // Update proposal team
                                const next = proposalTeam.map((m: any) => m.member_id === member.member_id ? { ...m, photo_url: photoUrl } : m);
                                setProposalTeam(next);
                                saveProposalTeam(next);
                                // Sync to agency team
                                const updatedAgencyTeam = teamMembers.map((m: any) => m.id === member.member_id ? { ...m, photo_url: photoUrl } : m);
                                setTeamMembers(updatedAgencyTeam);
                                await supabase.from('agencies').update({ team_members: updatedAgencyTeam as any }).eq('id', agency.id);
                                toast.success('Photo updated');
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex justify-center mt-4 print:hidden">
                          <button
                            onClick={async () => {
                              const newId = crypto.randomUUID();
                              const newMember = {
                                member_id: newId,
                                name: 'New Member',
                                title: 'Role',
                                photo_url: null,
                                role_on_project: '',
                              };
                              const nextTeam = [...proposalTeam, newMember];
                              setProposalTeam(nextTeam);
                              saveProposalTeam(nextTeam);

                              // Also save to agency team_members so it persists in settings
                              if (agency?.id) {
                                const agencyMember = { id: newId, name: 'New Member', title: 'Role', photo_url: null, bio: null };
                                const updatedAgencyTeam = [...teamMembers, agencyMember];
                                setTeamMembers(updatedAgencyTeam);
                                await supabase.from('agencies').update({ team_members: updatedAgencyTeam as any }).eq('id', agency.id);
                              }
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
                </div>
              </SectionWrapper>}

              {/* Section 6: Portfolio */}
              {!deletedSections.has(6) && <SectionWrapper idx={6} onDelete={deleteSection} label="Portfolio">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="08">
                    <SectionHeader number="08" title={(proposal as any).portfolio_section_title || 'Our Work'} subtitle="Selected projects from our portfolio"
                      onTitleEdit={(val) => updateField('portfolio_section_title', val)} />
                    {portfolioItems.length === 0 ? (
                      <div className="text-center py-16 print:hidden">
                        <p className="text-muted-foreground" style={{ fontSize: '15px' }}>No portfolio items added yet.</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Add your previous work to build credibility.</p>
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => {
                              const unselected = allPortfolioItems.filter(p => !portfolioItems.some(s => s.id === p.id));
                              if (unselected.length > 0) {
                                const toAdd = unselected.slice(0, 4);
                                const updated = [...portfolioItems, ...toAdd];
                                setPortfolioItems(updated);
                                updateField('selected_portfolio_ids', updated.map((p: any) => p.id));
                                updateField('portfolio_section_visible', true);
                              }
                            }}
                            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                            disabled={allPortfolioItems.length === 0}
                          >
                            {allPortfolioItems.length > 0 ? 'Add from library' : 'No items available'}
                          </button>
                          <Link to="/settings/portfolio" className="text-sm text-brand hover:text-brand-hover">Go to Settings →</Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {portfolioItems.map((item, i) => (
                            <div key={item.id} className="group/portfolio relative">
                              <button onClick={() => { const updated = portfolioItems.filter(p => p.id !== item.id); setPortfolioItems(updated); updateField('selected_portfolio_ids', updated.map((p: any) => p.id)); }}
                                className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-md transition-opacity group-hover/portfolio:opacity-100 print:hidden"
                                title="Remove from proposal"><X className="h-3 w-3" /></button>
                              <PortfolioCard title={item.title} category={item.category} description={item.description} results={item.results} imageUrl={item.images?.[0]?.url} imageAlt={item.images?.[0]?.alt_text} delay={i * 0.1} />
                            </div>
                          ))}
                        </div>
                        {allPortfolioItems.filter(p => !portfolioItems.some(s => s.id === p.id)).length > 0 && (
                          <div className="mt-6 text-center print:hidden">
                            <button onClick={() => { const unselected = allPortfolioItems.filter(p => !portfolioItems.some(s => s.id === p.id)); if (unselected.length > 0) { const toAdd = unselected[0]; const updated = [...portfolioItems, toAdd]; setPortfolioItems(updated); updateField('selected_portfolio_ids', updated.map((p: any) => p.id)); } }}
                              className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
                              <Plus className="h-4 w-4" /> Add Project
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>}

              {/* Section 7: Testimonials */}
              {!deletedSections.has(7) && <SectionWrapper idx={7} onDelete={deleteSection} label="Testimonials">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="09">
                    <SectionHeader number="09" title="What Our Clients Say" subtitle="Proof of impact"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
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
                            onQuoteEdit={async (val) => {
                              await supabase.from('testimonials').update({ quote: val }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, quote: val } : x));
                            }}
                            onNameEdit={async (val) => {
                              await supabase.from('testimonials').update({ client_name: val }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, client_name: val } : x));
                            }}
                            onTitleEdit={async (val) => {
                              await supabase.from('testimonials').update({ client_title: val }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, client_title: val } : x));
                            }}
                            onCompanyEdit={async (val) => {
                              await supabase.from('testimonials').update({ client_company: val }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, client_company: val } : x));
                            }}
                            onMetricValueEdit={async (val) => {
                              await supabase.from('testimonials').update({ metric_value: val }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, metric_value: val } : x));
                            }}
                            onMetricLabelEdit={async (val) => {
                              await supabase.from('testimonials').update({ metric_label: val }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, metric_label: val } : x));
                            }}
                            onAvatarUpload={async (file) => {
                              const ext = file.name.split('.').pop() || 'jpg';
                              const path = `${agency.id}/testimonials/${t.id}.${ext}`;
                              const { error } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
                              if (error) { toast.error('Upload failed'); return; }
                              const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
                              const newAvatarUrl = urlData.publicUrl + '?t=' + Date.now();
                              await supabase.from('testimonials').update({ avatar_url: newAvatarUrl }).eq('id', t.id);
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, avatar_url: newAvatarUrl } : x));
                              toast.success('Photo uploaded');
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>}

              {/* Section 8: Terms */}
              {!deletedSections.has(8) && <SectionWrapper idx={8} onDelete={deleteSection} label="Terms">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="09">
                    <SectionHeader number="09" title="Terms & Conditions" subtitle="The fine print"
                      onTitleEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)} />
                    {termsClauses.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-muted-foreground" style={{ fontSize: '15px' }}>No terms clauses added yet.</p>
                        <Link to="/settings" className="mt-2 inline-block text-sm text-brand hover:text-brand-hover">Add in Settings →</Link>
                      </div>
                    ) : (
                      <TermsSection
                        clauses={termsClauses.map(c => ({ title: c.title, content: c.content }))}
                        onClauseEdit={async (index, field, value) => {
                          const clause = termsClauses[index];
                          if (!clause) return;
                          await supabase.from('terms_clauses').update({ [field]: value }).eq('id', clause.id);
                          setTermsClauses(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
                        }}
                      />
                    )}
                  </PageWrapper>
                </div>
              </SectionWrapper>}

              {/* Section 9: Signature */}
              {!deletedSections.has(9) && <SectionWrapper idx={9} onDelete={deleteSection} label="Signature">
                <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                  <PageWrapper pageNumber="10">
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
                      onHeadingEdit={(val) => updateField('title', val)}
                      onSubtitleEdit={(val) => updateField('subtitle', val)}
                    />
                  </PageWrapper>
                </div>
              </SectionWrapper>}

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

function SectionWrapper({ idx, onDelete, label, children }: {
  idx: number; onDelete: (idx: number) => void; label: string; children: React.ReactNode;
}) {
  return (
    <div id={`section-${idx}`} className="group relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-card border border-border px-4 py-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 z-20 print:hidden">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="w-px h-4 bg-border" />
        <button onClick={() => onDelete(idx)} className="text-muted-foreground hover:text-destructive" title="Remove page">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}
