import { useState, useRef, useMemo, useEffect } from 'react';
import { Check, Pencil, X, Plus, Upload, Loader2, Quote, Target, BarChart3, Users, Trophy, Zap, Layers, Package, ArrowRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';
import { defaultBundles, findDefaultModule, calculateBundlePricing, formatBundlePrice } from '@/lib/defaultBundles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const iconMap: Record<string, any> = { Target, BarChart3, Users, Trophy, Zap, Layers };

interface ReviewScreenProps {
  agencyIdentity: any;
  onAgencyChange: (data: any) => void;
  selectedModuleKeys: Set<string>;
  onModuleKeysChange: (keys: Set<string>) => void;
  testimonials: any[];
  onTestimonialsChange: (t: any[]) => void;
  differentiators: any[];
  onDifferentiatorsChange: (d: any[]) => void;
  diffIntro: string;
  onDiffIntroChange: (s: string) => void;
  groupNameMap: Record<string, string>;
  onFinish: () => void;
  onBack?: () => void;
  saving: boolean;
  addedBundles?: Set<string>;
  onAddBundle?: (bundleName: string) => void;
  teamMembers: any[];
  onTeamMembersChange: (members: any[]) => void;
}

export function ReviewScreen({
  agencyIdentity,
  onAgencyChange,
  selectedModuleKeys,
  onModuleKeysChange,
  testimonials,
  onTestimonialsChange,
  differentiators,
  onDifferentiatorsChange,
  diffIntro,
  onDiffIntroChange,
  groupNameMap,
  onFinish,
  onBack,
  saving,
  addedBundles = new Set(),
  onAddBundle,
  teamMembers,
  onTeamMembersChange,
}: ReviewScreenProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState<number | null>(null);
  const teamPhotoInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [editingDeliverable, setEditingDeliverable] = useState<{ key: string; index: number } | null>(null);
  const [deliverableDraft, setDeliverableDraft] = useState('');
  const [deliverableOverrides, setDeliverableOverrides] = useState<Record<string, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agencyRef = useRef<HTMLElement>(null);
  const inlineCtaRef = useRef<HTMLDivElement>(null);

  // Show sticky CTA after scrolling past agency section, but hide when inline CTA is visible
  useEffect(() => {
    let agencyVisible = true;
    let inlineCtaVisible = false;

    const update = () => setShowStickyCta(!agencyVisible && !inlineCtaVisible);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === agencyRef.current) {
          agencyVisible = entry.isIntersecting;
        } else if (entry.target === inlineCtaRef.current) {
          inlineCtaVisible = entry.isIntersecting;
        }
      });
      update();
    }, { threshold: 0 });

    if (agencyRef.current) observer.observe(agencyRef.current);
    if (inlineCtaRef.current) observer.observe(inlineCtaRef.current);
    return () => observer.disconnect();
  }, []);

  // All available services grouped
  const allGroupNames = Object.values(groupNameMap);
  const allModules = allGroupNames.flatMap(gn =>
    getDefaultModulesForGroup(gn).map((m, i) => ({
      ...m,
      key: `${gn}-${i}`,
      groupName: gn,
    }))
  );

  const selectedModules = allModules.filter(m => selectedModuleKeys.has(m.key));
  const unselectedModules = allModules.filter(m => !selectedModuleKeys.has(m.key));

  // Group selected modules by group name
  const selectedByGroup = useMemo(() => {
    const groups: Record<string, typeof selectedModules> = {};
    selectedModules.forEach(m => {
      if (!groups[m.groupName]) groups[m.groupName] = [];
      groups[m.groupName].push(m);
    });
    return groups;
  }, [selectedModules]);

  // Group unselected modules by group name
  const unselectedByGroup = useMemo(() => {
    const groups: Record<string, typeof unselectedModules> = {};
    unselectedModules.forEach(m => {
      if (!groups[m.groupName]) groups[m.groupName] = [];
      groups[m.groupName].push(m);
    });
    return groups;
  }, [unselectedModules]);

  const handleFinishAttemptWrapped = () => {
    if (testimonials.length > 0 && !testimonials.some(t => t.approved)) {
      toast('No testimonials approved — you can add them later in Settings.', { icon: 'ℹ️' });
    }
    onFinish();
  };

  const toggleModule = (key: string) => {
    const next = new Set(selectedModuleKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onModuleKeysChange(next);
  };

  const getModulePrice = (mod: any) => priceOverrides[mod.key] ?? mod.price;

  // Suggested bundles based on selected services
  const selectedModuleNames = new Set(selectedModules.map(m => m.name));
  const suggestedBundles = useMemo(() => {
    const scored = defaultBundles.map(b => {
      const matchCount = b.serviceNames.filter(n => selectedModuleNames.has(n)).length;
      const missingCount = b.serviceNames.length - matchCount;
      return { ...b, matchCount, missingCount };
    });
    const full = scored.filter(b => b.missingCount === 0).sort((a, b) => b.serviceNames.length - a.serviceNames.length);
    const fullNames = new Set(full.map(b => b.name));
    const partial = scored.filter(b => b.missingCount > 0 && b.missingCount <= 2 && b.matchCount >= 2 && !fullNames.has(b.name)).sort((a, b) => a.missingCount - b.missingCount || b.matchCount - a.matchCount);
    return [...full, ...partial].slice(0, 4);
  }, [selectedModuleNames.size]);

  const pricingLabel: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PNG, SVG, or WebP file');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
    onAgencyChange({ ...agencyIdentity, logo_url: urlData.publicUrl });
    setUploading(false);
  };

  const removeTestimonial = (idx: number) => {
    onTestimonialsChange(testimonials.filter((_, i) => i !== idx));
  };

  const addTestimonial = () => {
    onTestimonialsChange([...testimonials, { quote: '', client_name: '', client_title: '', client_company: '', metric_value: '', metric_label: '', approved: false }]);
  };

  const updateTestimonial = (idx: number, field: string, value: any) => {
    const updated = [...testimonials];
    updated[idx] = { ...updated[idx], [field]: value };
    onTestimonialsChange(updated);
  };

  const getDeliverables = (mod: any): string[] => deliverableOverrides[mod.key] ?? mod.deliverables ?? [];

  const toggleServiceExpand = (key: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const updateDeliverable = (key: string, index: number, value: string) => {
    const current = getDeliverables(allModules.find(m => m.key === key)!);
    const updated = [...current];
    updated[index] = value;
    setDeliverableOverrides(prev => ({ ...prev, [key]: updated }));
  };

  const removeDeliverable = (key: string, index: number) => {
    const current = getDeliverables(allModules.find(m => m.key === key)!);
    setDeliverableOverrides(prev => ({ ...prev, [key]: current.filter((_, i) => i !== index) }));
  };

  const addDeliverable = (key: string) => {
    const current = getDeliverables(allModules.find(m => m.key === key)!);
    setDeliverableOverrides(prev => ({ ...prev, [key]: [...current, 'New deliverable'] }));
    setEditingDeliverable({ key, index: current.length });
    setDeliverableDraft('New deliverable');
  };

  const renderServiceRow = (mod: any, isSelected: boolean) => {
    const price = getModulePrice(mod);
    const isEditing = editingPrice === mod.key;
    const isModified = priceOverrides[mod.key] !== undefined;
    const isExpanded = expandedServices.has(mod.key);
    const deliverables = getDeliverables(mod);

    return (
      <div key={mod.key} className={cn("border-b border-border last:border-0", !isSelected && "opacity-50")}>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => toggleModule(mod.key)} className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
              isSelected ? "border-ink bg-ink" : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </button>
            <button
              onClick={() => isSelected && toggleServiceExpand(mod.key)}
              className={cn("flex items-center gap-1 min-w-0", isSelected && "cursor-pointer")}
            >
              <span className={cn("text-sm", isSelected ? "text-foreground" : "text-muted-foreground")}>{mod.name}</span>
              {isSelected && deliverables.length > 0 && (
                <ChevronDown className={cn("h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform", isExpanded && "rotate-180")} />
              )}
            </button>
            {isModified && <span className="text-[10px] text-brass font-medium">Modified</span>}
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <input
                type="number"
                autoFocus
                defaultValue={price}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val !== mod.price) {
                    setPriceOverrides(prev => ({ ...prev, [mod.key]: val }));
                  } else if (val === mod.price) {
                    setPriceOverrides(prev => { const n = { ...prev }; delete n[mod.key]; return n; });
                  }
                  setEditingPrice(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="w-24 rounded border border-border bg-background px-2 py-0.5 text-right text-sm tabular-nums text-foreground focus:border-ink focus:outline-none"
              />
            ) : (
              <button
                onClick={() => isSelected && setEditingPrice(mod.key)}
                className={cn("text-sm font-medium tabular-nums", isSelected ? "text-foreground hover:text-brass cursor-pointer" : "text-muted-foreground")}
              >
                ${price.toLocaleString()}{pricingLabel[mod.pricingModel]}
              </button>
            )}
          </div>
        </div>

        {/* Expandable deliverables */}
        {isExpanded && isSelected && (
          <div className="ml-8 pb-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Deliverables</p>
            {deliverables.map((d, idx) => {
              const isEditingThis = editingDeliverable?.key === mod.key && editingDeliverable?.index === idx;
              return (
                <div key={idx} className="group flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {isEditingThis ? (
                    <input
                      autoFocus
                      type="text"
                      value={deliverableDraft}
                      onChange={(e) => setDeliverableDraft(e.target.value)}
                      onBlur={() => {
                        if (deliverableDraft.trim()) updateDeliverable(mod.key, idx, deliverableDraft.trim());
                        setEditingDeliverable(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { if (deliverableDraft.trim()) updateDeliverable(mod.key, idx, deliverableDraft.trim()); setEditingDeliverable(null); }
                        if (e.key === 'Escape') setEditingDeliverable(null);
                      }}
                      className="flex-1 rounded border border-brand bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                    />
                  ) : (
                    <span
                      className="flex-1 text-xs text-muted-foreground cursor-text hover:text-foreground transition-colors"
                      onClick={() => { setEditingDeliverable({ key: mod.key, index: idx }); setDeliverableDraft(d); }}
                    >
                      {d}
                    </span>
                  )}
                  <button
                    onClick={() => removeDeliverable(mod.key, idx)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => addDeliverable(mod.key)}
              className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add deliverable
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[720px] px-6 py-10">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center gap-3 text-xs">
        <button onClick={onBack} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brass text-[10px] font-bold text-primary-foreground">✓</span>
          <span className="text-muted-foreground font-medium">Enter website</span>
        </button>
        <div className="h-px w-8 bg-border" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-primary-foreground">●</span>
          <span className="text-foreground font-semibold">Review profile</span>
        </div>
        <div className="h-px w-8 bg-border" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">○</span>
          <span className="text-muted-foreground">Create proposal</span>
        </div>
      </div>

      {/* Section: Agency */}
      <section ref={agencyRef} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Your Agency</h2>
          <button
            onClick={() => setEditingSection(editingSection === 'agency' ? null : 'agency')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {editingSection === 'agency' ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Hidden file input — always rendered so logo click works in both modes */}
        <input ref={fileInputRef} type="file" accept=".png,.svg,.webp" onChange={handleLogoUpload} className="hidden" />

        {editingSection === 'agency' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={agencyIdentity.name || ''}
              onChange={e => onAgencyChange({ ...agencyIdentity, name: e.target.value })}
              placeholder="Agency Name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ink focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input type="email" value={agencyIdentity.email || ''} onChange={e => onAgencyChange({ ...agencyIdentity, email: e.target.value })} placeholder="Email" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ink focus:outline-none" />
              <input type="tel" value={agencyIdentity.phone || ''} onChange={e => onAgencyChange({ ...agencyIdentity, phone: e.target.value })} placeholder="Phone" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ink focus:outline-none" />
            </div>
            <input type="text" value={agencyIdentity.tagline || ''} onChange={e => onAgencyChange({ ...agencyIdentity, tagline: e.target.value })} placeholder="Tagline" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ink focus:outline-none" />
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Brand Color</label>
              <input type="color" value={agencyIdentity.brand_color || '#E8825C'} onChange={e => onAgencyChange({ ...agencyIdentity, brand_color: e.target.value })} className="h-8 w-8 cursor-pointer rounded border border-border" />
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                {agencyIdentity.logo_url && (
                  <div className="h-6 w-6 rounded border border-border bg-background p-0.5 shrink-0">
                    <img src={agencyIdentity.logo_url} alt="" className="h-full w-full object-contain" />
                  </div>
                )}
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {agencyIdentity.logo_url ? 'Replace logo' : 'Upload logo'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {agencyIdentity.logo_url ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 rounded-xl border border-border bg-muted/50 p-1.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="Click to replace logo"
              >
                <img src={agencyIdentity.logo_url} alt="" className="h-full w-full object-contain" />
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: agencyIdentity.brand_color || '#E8825C' }}
                title="Click to upload logo"
              >
                {(agencyIdentity.name || 'A').charAt(0).toUpperCase()}
              </button>
            )}
            <div className="min-w-0">
              <input
                value={agencyIdentity.name || ''}
                onChange={(e) => onAgencyChange({ ...agencyIdentity, name: e.target.value })}
                placeholder="Your Agency"
                className="font-display text-lg font-bold text-foreground truncate bg-transparent border-b border-transparent focus:border-brass outline-none w-full"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {/* Inline color picker */}
                <label className="relative inline-flex items-center gap-1.5 cursor-pointer group shrink-0">
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-border group-hover:ring-2 group-hover:ring-brass/30 transition-shadow"
                    style={{ backgroundColor: agencyIdentity.brand_color || '#E8825C' }}
                  />
                  <span className="group-hover:text-foreground transition-colors">Brand color</span>
                  <input
                    type="color"
                    value={agencyIdentity.brand_color || '#E8825C'}
                    onChange={e => onAgencyChange({ ...agencyIdentity, brand_color: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
                <span>·</span>
                <input
                  type="email"
                  value={agencyIdentity.email || ''}
                  onChange={e => onAgencyChange({ ...agencyIdentity, email: e.target.value })}
                  placeholder="Add email"
                  size={agencyIdentity.email ? Math.max(agencyIdentity.email.length, 8) : 8}
                  className="bg-transparent outline-none text-xs text-muted-foreground placeholder:italic placeholder:text-brass hover:text-foreground focus:text-foreground transition-colors w-auto"
                />
                <span>·</span>
                <input
                  type="tel"
                  value={agencyIdentity.phone || ''}
                  onChange={e => onAgencyChange({ ...agencyIdentity, phone: e.target.value })}
                  placeholder="Add phone"
                  size={agencyIdentity.phone ? Math.max(agencyIdentity.phone.length, 8) : 8}
                  className="bg-transparent outline-none text-xs text-muted-foreground placeholder:italic placeholder:text-brass hover:text-foreground focus:text-foreground transition-colors w-auto"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section: Services — grouped by category */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Your Services</h2>
          <span className="text-xs text-muted-foreground">{selectedModuleKeys.size} selected</span>
        </div>

        <div className="space-y-0">
          {Object.entries(selectedByGroup).map(([groupName, modules], gi) => (
            <div key={groupName}>
              {gi > 0 && <div className="border-t border-border mt-3 pt-3" />}
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint mb-1">{groupName}</p>
              {modules.map(mod => renderServiceRow(mod, true))}
            </div>
          ))}

          {!showAllServices && unselectedModules.length > 0 && (
            <button
              onClick={() => setShowAllServices(true)}
              className="mt-3 text-xs text-brass hover:text-foreground font-medium"
            >
              + {unselectedModules.length} more available
            </button>
          )}

          {showAllServices && Object.entries(unselectedByGroup).map(([groupName, modules], gi) => (
            <div key={groupName}>
              <div className="border-t border-border mt-3 pt-3" />
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint mb-1">{groupName}</p>
              {modules.map(mod => renderServiceRow(mod, false))}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Click any price to edit. Each service has full deliverables, timelines, and scope pre-filled. Customize in Settings later.
        </p>
      </section>

      {/* Section: Suggested Bundles */}
      {suggestedBundles.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label-overline">Suggested Bundles</h2>
            <span className="text-xs text-muted-foreground">{suggestedBundles.length} matched</span>
          </div>

          <div className="space-y-3">
            {suggestedBundles.map(bundle => {
              const isAdded = addedBundles.has(bundle.name);
              const pricing = calculateBundlePricing(bundle.serviceNames, bundle.discountPercentage);
              const missingNames = bundle.serviceNames.filter(n => !selectedModuleNames.has(n));
              const isFullMatch = missingNames.length === 0;

              return (
                <div key={bundle.name} className={cn(
                  'rounded-xl border p-4 transition-colors',
                  isAdded ? 'border-ink/20 bg-ink/5' : missingNames.length > 1 ? 'border-border bg-background opacity-60' : 'border-border bg-background'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h3 className="font-display text-sm font-semibold text-foreground">{bundle.name}</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{bundle.tagline}</p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {bundle.serviceNames.map(name => (
                          <span key={name} className={cn(
                            'rounded-full px-2 py-0.5 text-[10px]',
                            missingNames.includes(name)
                              ? 'border border-dashed border-muted-foreground/30 text-muted-foreground/70'
                              : 'bg-muted text-muted-foreground'
                          )}>{name}</span>
                        ))}
                      </div>

                      <div className="mt-3 space-y-0.5">
                        <div className="flex items-baseline gap-3">
                          <span className="font-display text-sm font-bold tabular-nums text-foreground">
                            {formatBundlePrice(pricing.bundleFixed, pricing.bundleMonthly)}
                          </span>
                          {pricing.totalSavings > 0 && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: '#F0F5F1', color: '#6E9A7A' }}>
                              Save ${pricing.totalSavings.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground line-through">
                          {formatBundlePrice(pricing.totalFixed, pricing.totalMonthly)} (individual)
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAdded ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                          <Check className="h-4 w-4" /> Added
                        </span>
                      ) : missingNames.length > 1 ? (
                        <span className="text-[11px] text-muted-foreground">
                          Add {missingNames.length} services to unlock
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (missingNames.length > 0) {
                              const next = new Set(selectedModuleKeys);
                              for (const name of missingNames) {
                                const mod = allModules.find(m => m.name === name);
                                if (mod) next.add(mod.key);
                              }
                              onModuleKeysChange(next);
                            }
                            onAddBundle?.(bundle.name);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                        >
                          {missingNames.length > 0 ? `Add bundle + ${missingNames.length} service${missingNames.length !== 1 ? 's' : ''}` : 'Use this bundle'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Bundles package your services for bigger deals. You can customize them later.
          </p>
        </section>
      )}

      {suggestedBundles.length === 0 && selectedModuleKeys.size > 0 && (
        <section className="mt-4 rounded-2xl border border-dashed border-border bg-card p-4">
          <p className="text-xs text-muted-foreground text-center">
            You can create custom bundles or browse templates in Settings → Bundles after setup.
          </p>
        </section>
      )}

      {/* Section: Testimonials — more spacing before this group */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Testimonials</h2>
          <span className="text-xs text-muted-foreground">
            {testimonials.length > 0 ? `${testimonials.length} found` : 'None found'}
          </span>
        </div>

        {testimonials.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2 rounded-lg bg-background px-3 py-2.5">
              <span className="text-brass text-sm mt-0.5">ℹ</span>
              <p className="text-[12px] text-muted-foreground">
                We found these on your website. Confirm you have permission to use each one in proposals.
              </p>
            </div>
            {(() => {
              const approvedCount = testimonials.filter(t => t.approved).length;
              const hasApproved = approvedCount > 0;
              return (
                <p className={cn("text-[12px] font-medium px-1", hasApproved ? "text-[#6E9A7A]" : "text-muted-foreground")}>
                  {approvedCount} of {testimonials.length} approved for proposals{hasApproved ? ' ✓' : ''}
                </p>
              );
            })()}
            <p className="text-[11px] text-muted-foreground italic px-1">
              Testimonials were translated to English from your website. Review for accuracy before using in proposals.
            </p>
          </div>
        )}

        {testimonials.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No testimonials found on your website.</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Adding testimonials increases win rates by up to 30%.<br />
              Add them here or anytime in Settings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((t, idx) => {
              const isApproved = t.approved === true;
              const hasNumericMetric = t.metric_value && /\d/.test(t.metric_value);
              // Build attribution parts: Name · Title · Company (skip empty)
              const attrParts = [t.client_name, t.client_title, t.client_company].filter(Boolean);

              return (
                <div
                  key={idx}
                  className={cn(
                    "relative rounded-xl p-4 transition-all",
                    isApproved
                      ? "border border-solid bg-[#FAFCFA]"
                      : "border border-dashed bg-white"
                  )}
                  style={{
                    borderColor: isApproved ? '#C5DBC9' : '#EEEAE3',
                  }}
                >
                  {/* Top-right: Toggle + label + Remove */}
                  <div className="absolute top-3 right-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[11px]", isApproved ? "text-[#6E9A7A] font-medium" : "text-muted-foreground")}>
                        {isApproved ? '✓ Approved' : 'Not approved'}
                      </span>
                      <Switch
                        checked={isApproved}
                        onCheckedChange={(checked) => updateTestimonial(idx, 'approved', checked)}
                        className="data-[state=checked]:bg-[#6E9A7A] scale-75"
                      />
                    </div>
                    <button onClick={() => removeTestimonial(idx)} className="text-[11px] text-muted-foreground hover:text-destructive">
                      Remove
                    </button>
                  </div>

                  {/* Quote icon with optional green check overlay */}
                  <div className="relative inline-block mb-2">
                    <Quote className={cn("h-4 w-4", isApproved ? "text-[#6E9A7A]" : "text-brass")} />
                    {isApproved && <CheckCircle2 className="absolute -top-1 -right-1.5 h-2.5 w-2.5 text-[#6E9A7A]" />}
                  </div>

                  <textarea
                    value={t.quote || ''}
                    onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
                    placeholder="Enter testimonial quote…"
                    rows={2}
                    className="w-full text-sm text-foreground italic leading-relaxed bg-transparent border-b border-border/50 focus:border-brass outline-none resize-none pb-1"
                  />
                  {/* Attribution line — editable inline inputs, only show fields with values or on focus */}
                  <div className="mt-2 flex flex-wrap items-center gap-0">
                    <input
                      value={t.client_name || ''}
                      onChange={(e) => updateTestimonial(idx, 'client_name', e.target.value)}
                      placeholder="Client name"
                      className="text-[13px] font-medium bg-transparent border-b border-transparent focus:border-brass outline-none pb-0.5 w-auto min-w-[80px]"
                      style={{ color: '#4A3F32', width: Math.max(80, (t.client_name?.length || 11) * 7.5) + 'px' }}
                    />
                    {(t.client_title || t.client_company) && (
                      <>
                        {t.client_title && (
                          <>
                            <span className="text-[13px] text-muted-foreground mx-1">·</span>
                            <input
                              value={t.client_title}
                              onChange={(e) => updateTestimonial(idx, 'client_title', e.target.value)}
                              placeholder="Title"
                              className="text-[13px] bg-transparent border-b border-transparent focus:border-brass outline-none pb-0.5 w-auto min-w-[50px]"
                              style={{ color: '#4A3F32', width: Math.max(50, (t.client_title?.length || 5) * 7) + 'px' }}
                            />
                          </>
                        )}
                        {t.client_company && (
                          <>
                            <span className="text-[13px] text-muted-foreground mx-1">·</span>
                            <input
                              value={t.client_company}
                              onChange={(e) => updateTestimonial(idx, 'client_company', e.target.value)}
                              placeholder="Company"
                              className="text-[13px] bg-transparent border-b border-transparent focus:border-brass outline-none pb-0.5 w-auto min-w-[60px]"
                              style={{ color: '#4A3F32', width: Math.max(60, (t.client_company?.length || 7) * 7) + 'px' }}
                            />
                          </>
                        )}
                      </>
                    )}
                    {/* Show add buttons for missing title/company */}
                    {!t.client_title && !t.client_company && (
                      <button
                        onClick={() => {
                          updateTestimonial(idx, 'client_title', 'Title');
                          updateTestimonial(idx, 'client_company', 'Company');
                        }}
                        className="ml-1 text-[11px] text-muted-foreground/50 hover:text-brass"
                      >
                        + add details
                      </button>
                    )}
                  </div>
                  {/* Metric badge — only show if metric contains a number */}
                  {hasNumericMetric && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: '#F0F5F1' }}>
                      <span className="text-[12px]">📈</span>
                      <span className="text-[12px] font-medium" style={{ color: '#6E9A7A' }}>
                        {t.metric_value}{t.metric_label ? ` ${t.metric_label}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={addTestimonial} className="mt-4 flex items-center gap-2 text-xs text-brass hover:text-foreground font-medium">
          <Plus className="h-3.5 w-3.5" /> Add testimonial
        </button>
      </section>

      {/* Section: Why Choose You */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Why Choose You</h2>
          <button
            onClick={() => setEditingSection(editingSection === 'differentiators' ? null : 'differentiators')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {editingSection === 'differentiators' ? 'Done' : 'Edit'}
          </button>
        </div>

        {diffIntro && (
          editingSection === 'differentiators' ? (
            <textarea
              value={diffIntro}
              onChange={e => onDiffIntroChange(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground leading-relaxed mb-4 focus:border-ink focus:outline-none"
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed mb-4">"{diffIntro}"</p>
          )
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {differentiators.map((d, i) => {
            const Icon = iconMap[d.icon] || Target;
            return editingSection === 'differentiators' ? (
              <div key={i} className="rounded-xl border border-border bg-background p-3 space-y-2">
                <input
                  value={d.title}
                  onChange={e => {
                    const updated = [...differentiators];
                    updated[i] = { ...updated[i], title: e.target.value };
                    onDifferentiatorsChange(updated);
                  }}
                  placeholder="Title"
                  className="w-full rounded border border-border bg-card px-2 py-1 text-xs font-medium text-foreground focus:border-ink focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    value={d.stat_value || ''}
                    onChange={e => {
                      const updated = [...differentiators];
                      updated[i] = { ...updated[i], stat_value: e.target.value };
                      onDifferentiatorsChange(updated);
                    }}
                    placeholder={
                      d.title?.toLowerCase().includes('impact') ? 'e.g. 312%' :
                      d.title?.toLowerCase().includes('partnership') ? 'e.g. 12+' :
                      d.title?.toLowerCase().includes('strategy') ? 'e.g. 94%' :
                      'e.g. 50+'
                    }
                    className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-ink focus:outline-none"
                  />
                  <input
                    value={d.stat_label || ''}
                    onChange={e => {
                      const updated = [...differentiators];
                      updated[i] = { ...updated[i], stat_label: e.target.value };
                      onDifferentiatorsChange(updated);
                    }}
                    placeholder={
                      d.title?.toLowerCase().includes('impact') ? 'Avg ROI %' :
                      d.title?.toLowerCase().includes('partnership') ? 'Avg yrs relationship' :
                      d.title?.toLowerCase().includes('strategy') ? 'Client retention %' :
                      'Label'
                    }
                    className="rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground focus:border-ink focus:outline-none"
                  />
                </div>
                <textarea
                  value={d.description || ''}
                  onChange={e => {
                    const updated = [...differentiators];
                    updated[i] = { ...updated[i], description: e.target.value };
                    onDifferentiatorsChange(updated);
                  }}
                  rows={3}
                  placeholder="Description"
                  className="w-full rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground focus:border-ink focus:outline-none"
                />
                <button
                  onClick={() => onDifferentiatorsChange(differentiators.filter((_, idx) => idx !== i))}
                  className="text-[10px] text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div key={i} className="rounded-xl border border-border border-l-2 bg-background p-3 transition-colors hover:border-l-brass group" style={{ borderLeftColor: undefined }}>
                {d.stat_value ? (
                  <div className="mb-2 cursor-text"
                    onClick={() => setEditingSection('differentiators')}
                  >
                    <p className="font-display text-[28px] font-bold text-foreground leading-tight">{d.stat_value}</p>
                    {d.stat_label && <p className="text-[11px] text-muted-foreground">{d.stat_label}</p>}
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSection('differentiators')}
                    className="flex items-center gap-1 mb-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <span className="text-[11px]">+</span>
                    <span className="text-[11px]">Add stat</span>
                  </button>
                )}
                <p className="text-[14px] font-semibold text-foreground">{d.title}</p>
                {d.description && <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{d.description}</p>}
              </div>
            );
          })}
        </div>

        {editingSection === 'differentiators' && (
          <button
            onClick={() => onDifferentiatorsChange([...differentiators, { title: '', stat_value: '', stat_label: '', description: '', icon: 'Target', source: 'manual' }])}
            className="mt-3 flex items-center gap-2 text-xs text-brass hover:text-foreground font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Add differentiator
          </button>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          These appear in your proposals. Edit anytime in Settings.
        </p>
      </section>

      {/* Section: Our Team */}
      {(
        <section className="mt-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label-overline">Our Team</h2>
            <button
              onClick={() => setEditingSection(editingSection === 'team' ? null : 'team')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {editingSection === 'team' ? 'Done' : 'Edit'}
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-lg">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No team members found on your website.</p>
              <p className="mt-1 text-[12px] text-muted-foreground/60">
                Adding your team creates a personal connection with clients.
              </p>
              <button
                onClick={() => {
                  onTeamMembersChange([{ id: `tm_${Date.now()}`, name: '', title: '', photo_url: null, bio: '' }]);
                  setEditingSection('team');
                }}
                className="mt-3 text-xs font-medium text-brass hover:text-foreground"
              >
                + Add your first team member
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member, idx) => (
                  <div key={member.id || idx} className="rounded-xl border border-border bg-background p-4 flex flex-col items-center text-center relative group">
                    {editingSection === 'team' && (
                      <button
                        onClick={() => onTeamMembersChange(teamMembers.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Avatar — clickable to upload photo */}
                    <input
                      ref={(el) => { teamPhotoInputRefs.current[idx] = el; }}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingTeamPhoto(idx);
                        const ext = file.name.split('.').pop();
                        const path = `team/${Date.now()}-${idx}.${ext}`;
                        const { error } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
                        if (error) { toast.error('Upload failed'); setUploadingTeamPhoto(null); return; }
                        const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
                        const updated = [...teamMembers];
                        updated[idx] = { ...updated[idx], photo_url: urlData.publicUrl };
                        onTeamMembersChange(updated);
                        setUploadingTeamPhoto(null);
                      }}
                    />
                    <button
                      onClick={() => teamPhotoInputRefs.current[idx]?.click()}
                      className="relative group/avatar mb-3"
                      title="Upload photo"
                    >
                      {uploadingTeamPhoto === idx ? (
                        <div className="h-16 w-16 rounded-full bg-brass/20 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-brass animate-spin" />
                        </div>
                      ) : member.photo_url ? (
                        <div className="relative">
                          <img
                            src={member.photo_url}
                            alt={member.name}
                            className="h-16 w-16 rounded-full object-cover border-2 border-border"
                          />
                          <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/30 flex items-center justify-center transition-colors">
                            <Upload className="h-4 w-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-brass/20 flex items-center justify-center text-lg font-semibold text-brass">
                            {(member.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/20 flex items-center justify-center transition-colors">
                            <Upload className="h-4 w-4 text-brass opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </button>

                    {editingSection === 'team' ? (
                      <div className="w-full space-y-2">
                        <input
                          value={member.name || ''}
                          onChange={(e) => {
                            const updated = [...teamMembers];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            onTeamMembersChange(updated);
                          }}
                          placeholder="Name"
                          className="w-full text-center rounded border border-border bg-card px-2 py-1 text-sm font-medium text-foreground focus:border-ink focus:outline-none"
                        />
                        <input
                          value={member.title || ''}
                          onChange={(e) => {
                            const updated = [...teamMembers];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            onTeamMembersChange(updated);
                          }}
                          placeholder="Title"
                          className="w-full text-center rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground focus:border-ink focus:outline-none"
                        />
                        <textarea
                          value={member.bio || ''}
                          onChange={(e) => {
                            const updated = [...teamMembers];
                            updated[idx] = { ...updated[idx], bio: e.target.value };
                            onTeamMembersChange(updated);
                          }}
                          placeholder="Short bio"
                          rows={2}
                          className="w-full text-center rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground focus:border-ink focus:outline-none resize-none"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">{member.name}</p>
                        {member.title && <p className="text-xs text-muted-foreground mt-0.5">{member.title}</p>}
                        {member.bio && <p className="text-[11px] text-muted-foreground/70 mt-1.5 line-clamp-2 leading-relaxed">{member.bio}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {editingSection === 'team' && (
                <button
                  onClick={() => onTeamMembersChange([...teamMembers, { id: `tm_${Date.now()}`, name: '', title: '', photo_url: null, bio: '' }])}
                  className="mt-3 flex items-center gap-2 text-xs text-brass hover:text-foreground font-medium"
                >
                  <Plus className="h-3.5 w-3.5" /> Add team member
                </button>
              )}
            </>
          )}

          <p className="mt-3 text-[11px] text-muted-foreground">
            These team members will appear in the "Why Us" section of your proposals.
          </p>
        </section>
      )}

      <div ref={inlineCtaRef} className="mt-10 text-center pb-6">
        <button
          onClick={handleFinishAttemptWrapped}
          disabled={saving}
          className="w-full max-w-[480px] rounded-[10px] bg-ink px-8 py-4 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ boxShadow: '0 2px 8px rgba(42,33,24,0.15)' }}
        >
          {saving ? 'Setting up...' : 'Looks good — create my first proposal'}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Everything can be edited later in Settings.<br />
          No credit card required.
        </p>
      </div>

      {/* Sticky CTA bar */}
      {showStickyCta && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[720px] items-center justify-center px-6 py-4">
            <button
              onClick={handleFinishAttemptWrapped}
              disabled={saving}
              className="w-full max-w-[480px] rounded-[10px] bg-ink px-8 py-3.5 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ boxShadow: '0 2px 8px rgba(42,33,24,0.15)' }}
            >
              {saving ? 'Setting up...' : 'Looks good — create my first proposal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
