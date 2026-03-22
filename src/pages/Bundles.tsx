import { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Plus, Package, X, Save, Check, Library, Loader2, ArrowRight, ChevronDown, ChevronUp, Sparkles, MoreVertical, Copy, Trash2, Pencil, GripVertical, ArrowDown, ArrowUp, EyeOff, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBundles, useServiceModules } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { defaultBundles, findDefaultModule, calculateBundlePricing, formatBundlePrice } from '@/lib/defaultBundles';
import { defaultModulesByGroup } from '@/lib/defaultModules';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

interface BundleForm {
  id?: string;
  name: string;
  tagline: string;
  description: string;
  bundle_price: string;
  selectedModuleIds: Set<string>;
}

const emptyForm: BundleForm = {
  name: '', tagline: '', description: '', bundle_price: '', selectedModuleIds: new Set(),
};

function formatBundlePriceLabeled(fixed: number, monthly: number, symbol = '$'): string {
  if (fixed > 0 && monthly > 0) return `${symbol}${fixed.toLocaleString()} fixed + ${symbol}${monthly.toLocaleString()}/mo`;
  if (monthly > 0) return `${symbol}${monthly.toLocaleString()}/mo`;
  return `${symbol}${fixed.toLocaleString()}`;
}

/* ─── Inline Editable Text ─── */
function InlineText({ value, onSave, className, placeholder }: { value: string; onSave: (v: string) => void; className?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { setDraft(value); setTimeout(() => inputRef.current?.select(), 0); } }, [editing, value]);

  const commit = () => { setEditing(false); if (draft.trim() !== value) onSave(draft.trim()); };

  if (editing) {
    return (
      <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className={cn("bg-transparent border-b border-brand/40 outline-none", className)} />
    );
  }
  return (
    <span onClick={() => setEditing(true)} className={cn("cursor-text hover:border-b hover:border-dashed hover:border-muted-foreground/30", className)}>
      {value || <span className="italic text-muted-foreground">{placeholder}</span>}
    </span>
  );
}

/* ─── Inline Price ─── */
function InlinePrice({ value, onSave, currencySymbol }: { value: number; onSave: (v: number) => void; currencySymbol: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { setDraft(value.toString()); setTimeout(() => inputRef.current?.select(), 0); } }, [editing, value]);

  const commit = () => {
    setEditing(false);
    const num = parseFloat(draft) || 0;
    if (num !== value) { onSave(num); setSaved(true); setTimeout(() => setSaved(false), 1200); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        <span className="text-[13px] text-muted-foreground">{currencySymbol}</span>
        <input ref={inputRef} type="number" value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-[120px] rounded border border-border bg-background px-2 py-1 text-right text-[16px] font-bold text-foreground focus:border-brand focus:outline-none" />
      </div>
    );
  }
  return (
    <span onClick={() => setEditing(true)} className="relative cursor-text text-[16px] font-bold text-[hsl(24,19%,24%)] hover:border-b hover:border-dashed hover:border-muted-foreground/30">
      {currencySymbol}{value.toLocaleString()}
      {saved && <Check className="inline ml-1 h-3.5 w-3.5 text-[hsl(140,22%,52%)] animate-in fade-in" />}
    </span>
  );
}

/* ─── Sortable Bundle Card ─── */
function SortableBundleCard({ bundle, children, isMobile, onMoveOrder, index, total }: {
  bundle: any; children: React.ReactNode; isMobile: boolean;
  onMoveOrder: (id: string, dir: 'up' | 'down') => void; index: number; total: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bundle.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined };

  return (
    <div ref={setNodeRef} style={style} className="relative group/card">
      {/* Drag handle */}
      {isMobile ? (
        <div className="absolute -left-1 top-6 flex flex-col gap-0.5 z-10">
          <button onClick={() => onMoveOrder(bundle.id, 'up')} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
          <button onClick={() => onMoveOrder(bundle.id, 'down')} disabled={index === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
        </div>
      ) : (
        <button {...attributes} {...listeners} className="absolute -left-2 top-6 cursor-grab text-[hsl(34,14%,77%)] opacity-0 group-hover/card:opacity-100 transition-opacity active:cursor-grabbing z-10">
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

/* ─── Edit Services Panel ─── */
function EditServicesPanel({ bundle, modules, currencySymbol, onClose, onSaved }: {
  bundle: any; modules: any[]; currencySymbol: string; onClose: () => void; onSaved: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set((bundle.bundle_modules || []).map((bm: any) => bm.module_id).filter(Boolean));
  });
  const [discount, setDiscount] = useState(15);
  const [customPrice, setCustomPrice] = useState<string>(bundle.bundle_price?.toString() || '');
  const [useCustom, setUseCustom] = useState(true);
  const [saving, setSaving] = useState(false);

  const included = modules.filter((m: any) => selectedIds.has(m.id));
  const available = modules.filter((m: any) => !selectedIds.has(m.id));
  const individualTotal = included.reduce((s: number, m: any) => s + (m.price_fixed || m.price_monthly || m.price_hourly || 0), 0);
  const calcPrice = Math.round(individualTotal * (1 - discount / 100));
  const bundlePrice = useCustom ? (parseFloat(customPrice) || 0) : calcPrice;
  const savings = individualTotal - bundlePrice;

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 2) { toast.error('A bundle needs at least 2 services'); return prev; }
        next.delete(id);
      } else { next.add(id); }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size < 2) { toast.error('A bundle needs at least 2 services'); return; }
    setSaving(true);
    await supabase.from('bundles').update({
      bundle_price: bundlePrice, individual_total: individualTotal,
      savings_amount: savings > 0 ? savings : null,
      savings_label: savings > 0 ? `Save ${currencySymbol}${savings.toLocaleString()}` : null,
    }).eq('id', bundle.id);
    await supabase.from('bundle_modules').delete().eq('bundle_id', bundle.id);
    const inserts = Array.from(selectedIds).map(mid => ({ bundle_id: bundle.id, module_id: mid }));
    if (inserts.length > 0) await supabase.from('bundle_modules').insert(inserts);
    toast.success('Bundle updated');
    setSaving(false);
    onSaved();
    onClose();
  };

  const priceSuffix = (m: any) => m.pricing_model === 'monthly' ? '/mo' : m.pricing_model === 'hourly' ? '/hr' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-foreground">Edit services in {bundle.name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Included */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Included in this bundle</span>
            <span className="text-[11px] text-muted-foreground">{selectedIds.size} services</span>
          </div>
          <div className="rounded-lg border border-border divide-y divide-border">
            {included.map((m: any) => {
              const price = m.price_fixed || m.price_monthly || m.price_hourly || 0;
              return (
                <div key={m.id} onClick={() => toggle(m.id)} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-brand bg-brand"><Check className="h-3 w-3 text-primary-foreground" /></div>
                  <span className="flex-1 text-sm text-foreground">{m.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{currencySymbol}{price.toLocaleString()}{priceSuffix(m)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Individual total: {currencySymbol}{individualTotal.toLocaleString()}</p>
        </div>

        {/* Available */}
        {available.length > 0 && (
          <div className="mb-4">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Add more services</span>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {available.map((m: any) => {
                const price = m.price_fixed || m.price_monthly || m.price_hourly || 0;
                return (
                  <div key={m.id} onClick={() => toggle(m.id)} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-muted-foreground/30" />
                    <span className="flex-1 text-sm text-foreground">{m.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{currencySymbol}{price.toLocaleString()}{priceSuffix(m)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="rounded-lg border border-border p-4 space-y-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bundle pricing</span>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Individual total:</span>
            <span className="tabular-nums">{currencySymbol}{individualTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Bundle discount:</span>
            <select value={useCustom ? 'custom' : discount} onChange={e => {
              if (e.target.value === 'custom') { setUseCustom(true); }
              else { setUseCustom(false); setDiscount(parseInt(e.target.value)); }
            }} className="rounded border border-border bg-background px-2 py-1 text-xs">
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
              <option value={25}>25%</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium">Bundle price:</span>
            {useCustom ? (
              <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                className="w-[120px] rounded border border-border bg-background px-2 py-1 text-right text-sm font-semibold focus:border-brand focus:outline-none" />
            ) : (
              <span className="font-bold tabular-nums">{currencySymbol}{calcPrice.toLocaleString()}</span>
            )}
          </div>
          {savings > 0 && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[hsl(140,22%,52%)]">You save clients:</span>
              <span className="font-semibold text-[hsl(140,22%,52%)]">{currencySymbol}{savings.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={handleSave} disabled={saving || selectedIds.size < 2}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Bundles() {
  const { agency } = useAuth();
  const { data: bundles = [], isLoading } = useBundles();
  const { data: modules = [] } = useServiceModules();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const currencySymbol = agency?.currency_symbol || '$';
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BundleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingServicesBundle, setEditingServicesBundle] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canAddBundle } = usePlan();

  // Usage stats query (Spec #4)
  const { data: usageStats = {} } = useQuery({
    queryKey: ['bundle_usage_stats', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return {};
      const { data } = await supabase
        .from('proposal_services')
        .select('bundle_id, proposal_id, proposals!proposal_services_proposal_id_fkey(created_at)')
        .not('bundle_id', 'is', null);
      const stats: Record<string, { count: number; lastUsed: string | null }> = {};
      (data || []).forEach((ps: any) => {
        const bid = ps.bundle_id;
        if (!stats[bid]) stats[bid] = { count: 0, lastUsed: null };
        stats[bid].count++;
        const created = ps.proposals?.created_at;
        if (created && (!stats[bid].lastUsed || created > stats[bid].lastUsed)) stats[bid].lastUsed = created;
      });
      return stats;
    },
    enabled: !!agency?.id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedBundles = [...bundles].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bundles'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['bundle_usage_stats'] });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This won't affect existing proposals.`)) return;
    await supabase.from('bundle_modules').delete().eq('bundle_id', id);
    await supabase.from('bundles').delete().eq('id', id);
    invalidate();
    toast.success('Bundle deleted');
  };

  const handleDuplicate = async (bundle: any) => {
    if (!agency) return;
    const { data: newBundle, error } = await supabase.from('bundles').insert({
      agency_id: agency.id, name: `${bundle.name} (copy)`, tagline: bundle.tagline, description: bundle.description,
      bundle_price: bundle.bundle_price, individual_total: bundle.individual_total,
      savings_amount: bundle.savings_amount, savings_label: bundle.savings_label, is_active: true,
    }).select('id').single();
    if (error) { toast.error('Failed to duplicate'); return; }
    const moduleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id).filter(Boolean);
    if (moduleIds.length > 0) await supabase.from('bundle_modules').insert(moduleIds.map((mid: string) => ({ bundle_id: newBundle.id, module_id: mid })));
    invalidate();
    toast.success(`${bundle.name} duplicated`);
  };

  const handleToggleActive = async (bundle: any) => {
    const newActive = !bundle.is_active;
    await supabase.from('bundles').update({ is_active: newActive }).eq('id', bundle.id);
    invalidate();
    toast.success(newActive ? 'Bundle reactivated' : 'Bundle deactivated');
  };

  const handleInlineSave = async (id: string, field: string, value: any) => {
    await supabase.from('bundles').update({ [field]: value }).eq('id', id);
    invalidate();
  };

  const handleBundlePriceSave = async (bundle: any, newPrice: number) => {
    const individualTotal = bundle.individual_total || 0;
    const savings = individualTotal - newPrice;
    await supabase.from('bundles').update({
      bundle_price: newPrice,
      savings_amount: savings > 0 ? savings : null,
      savings_label: savings > 0 ? `Save ${currencySymbol}${savings.toLocaleString()}` : null,
    }).eq('id', bundle.id);
    invalidate();
  };

  const handleBundleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortedBundles.findIndex((b: any) => b.id === active.id);
    const newIdx = sortedBundles.findIndex((b: any) => b.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(sortedBundles, oldIdx, newIdx);
    await Promise.all(reordered.map((b: any, i: number) => supabase.from('bundles').update({ display_order: i }).eq('id', b.id)));
    invalidate();
  };

  const handleMoveOrder = async (id: string, dir: 'up' | 'down') => {
    const idx = sortedBundles.findIndex((b: any) => b.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedBundles.length) return;
    const reordered = arrayMove(sortedBundles, idx, swapIdx);
    await Promise.all(reordered.map((b: any, i: number) => supabase.from('bundles').update({ display_order: i }).eq('id', b.id)));
    invalidate();
  };

  const openCreate = () => { setForm(emptyForm); setShowModal(true); };

  const toggleModule = (id: string) => {
    setForm(prev => {
      const next = new Set(prev.selectedModuleIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, selectedModuleIds: next };
    });
  };

  const individualTotal = modules.filter((m: any) => form.selectedModuleIds.has(m.id))
    .reduce((sum: number, m: any) => sum + (m.price_fixed || m.price_monthly || m.price_hourly || 0), 0);
  const bundlePrice = parseFloat(form.bundle_price) || 0;
  const savingsAmount = individualTotal - bundlePrice;

  const handleSave = async () => {
    if (!agency || !form.name.trim() || form.selectedModuleIds.size < 2) {
      if (form.selectedModuleIds.size < 2) toast.error('Bundles need at least 2 services');
      return;
    }
    setSaving(true);
    const payload = {
      agency_id: agency.id, name: form.name.trim(), tagline: form.tagline || null,
      description: form.description || null, bundle_price: bundlePrice || null,
      individual_total: individualTotal || null,
      savings_amount: savingsAmount > 0 ? savingsAmount : null,
      savings_label: savingsAmount > 0 ? `Save ${currencySymbol}${savingsAmount.toLocaleString()}` : null,
      is_active: true,
    };
    let bundleId = form.id;
    if (form.id) {
      const { error } = await supabase.from('bundles').update(payload).eq('id', form.id);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      await supabase.from('bundle_modules').delete().eq('bundle_id', form.id);
    } else {
      const { data, error } = await supabase.from('bundles').insert(payload).select('id').single();
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      bundleId = data.id;
    }
    const bmInserts = Array.from(form.selectedModuleIds).map(moduleId => ({ bundle_id: bundleId!, module_id: moduleId }));
    if (bmInserts.length > 0) await supabase.from('bundle_modules').insert(bmInserts);
    toast.success(form.id ? 'Bundle updated' : 'Bundle created');
    setShowModal(false); setSaving(false);
    invalidate();
  };

  const addTemplateBundle = async (template: typeof defaultBundles[0]) => {
    if (!agency) return;
    setAddingTemplate(template.name);
    try {
      const { data: allAgencyModules } = await supabase.from('service_modules').select('*').eq('agency_id', agency.id);
      const existingNames = new Set((allAgencyModules || []).map((m: any) => m.name));
      const missingNames = template.serviceNames.filter(n => !existingNames.has(n));
      const added: string[] = [];
      const reactivated: string[] = [];
      const { data: groups } = await supabase.from('service_groups').select('id, name');
      const groupIdMap: Record<string, string> = {};
      (groups || []).forEach((g: any) => { groupIdMap[g.name] = g.id; });

      for (const name of missingNames) {
        const { data: inactive } = await supabase.from('service_modules').select('id').eq('agency_id', agency.id).eq('name', name).eq('is_active', false).maybeSingle();
        if (inactive) { await supabase.from('service_modules').update({ is_active: true }).eq('id', inactive.id); reactivated.push(name); }
        else {
          const found = findDefaultModule(name);
          if (found) {
            await supabase.from('service_modules').insert({
              agency_id: agency.id, group_id: groupIdMap[found.groupName] || null, name: found.module.name,
              description: found.module.description, short_description: found.module.shortDesc,
              pricing_model: found.module.pricingModel,
              price_fixed: found.module.pricingModel === 'fixed' ? found.module.price : null,
              price_monthly: found.module.pricingModel === 'monthly' ? found.module.price : null,
              price_hourly: found.module.pricingModel === 'hourly' ? found.module.price : null,
              service_type: found.module.serviceType, deliverables: found.module.deliverables,
              client_responsibilities: found.module.clientResponsibilities, out_of_scope: found.module.outOfScope,
              default_timeline: found.module.defaultTimeline, suggested_kpis: found.module.suggestedKpis,
              common_tools: found.module.commonTools, is_active: true,
            });
            added.push(name);
          }
        }
      }

      const { data: updatedModules } = await supabase.from('service_modules').select('id, name, price_fixed, price_monthly').eq('agency_id', agency.id).eq('is_active', true);
      const pricing = calculateBundlePricing(template.serviceNames, template.discountPercentage, updatedModules);

      const { data: newBundle, error } = await supabase.from('bundles').insert({
        agency_id: agency.id, name: template.name, tagline: template.tagline, description: template.description,
        bundle_price: pricing.bundleFixed + pricing.bundleMonthly,
        individual_total: pricing.totalFixed + pricing.totalMonthly,
        savings_amount: pricing.totalSavings,
        savings_label: pricing.totalSavings > 0 ? `Save ${currencySymbol}${pricing.totalSavings.toLocaleString()}` : null,
        is_active: true,
      }).select('id').single();
      if (error) throw error;

      const moduleIds = template.serviceNames.map(n => (updatedModules || []).find((m: any) => m.name === n)?.id).filter(Boolean);
      if (moduleIds.length > 0) await supabase.from('bundle_modules').insert(moduleIds.map(mid => ({ bundle_id: newBundle.id, module_id: mid })));

      let msg = `${template.name} added to your bundles`;
      if (added.length > 0) msg += `. ${added.length} service${added.length > 1 ? 's were' : ' was'} also added to your library: ${added.join(', ')}`;
      if (reactivated.length > 0) msg += `. Reactivated: ${reactivated.join(', ')}`;
      toast.success(msg);
      invalidate();
    } catch (e) { console.error(e); toast.error('Failed to add bundle'); }
    setAddingTemplate(null);
  };

  const existingBundleNames = new Set(bundles.map((b: any) => b.name));
  const agencyModuleNames = new Set(modules.map((m: any) => m.name));
  const proTipText = bundles.length === 0
    ? "Agencies using bundles close 23% larger deals. Pick a template below or create your own — bundles display as premium packages in your proposals."
    : "Tip: Bundles show as a highlighted package in your proposals. Clients see the savings upfront.";

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bundles</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg border border-[hsl(34,14%,91%)] bg-transparent px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-[hsl(40,20%,97%)] hover:border-[hsl(34,14%,83%)]">
          <Plus className="h-4 w-4 text-[hsl(24,8%,49%)]" /> Create Bundle
        </button>
      </div>

      <div className="relative mb-5 overflow-hidden rounded-[12px] p-5" style={{ background: '#2A2118' }}>
        <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #BE8E5E, transparent)' }} />
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">Insight</p>
        <p className="text-[13px] leading-relaxed" style={{ color: '#B8B0A5' }}>
          {bundles.length === 0 ? (
            <>Agencies using <span className="font-semibold" style={{ color: '#FAF9F6' }}>service bundles</span> close <span className="font-semibold" style={{ color: '#BE8E5E' }}>23% larger deals</span> on average. Pick a template below or create your own.</>
          ) : (
            <>Bundles show as a <span className="font-semibold" style={{ color: '#FAF9F6' }}>highlighted package</span> in your proposals. Clients see the <span className="font-semibold" style={{ color: '#BE8E5E' }}>savings upfront</span>.</>
          )}
        </p>
      </div>

      {/* YOUR BUNDLES */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Bundles</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-card" style={{ boxShadow: '0 1px 3px rgba(42,33,24,0.05)' }} />)}
          </div>
        ) : sortedBundles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-brand/60" />
            <p className="mt-3 text-[13px] font-medium text-[hsl(24,19%,24%)]">No bundles yet</p>
            <p className="mt-1.5 text-[13px] text-[hsl(24,8%,49%)]">
              Pick a template below to create your first bundle in one click,{' '}
              <button onClick={openCreate} className="underline hover:text-foreground transition-colors">or create a custom one from scratch</button>.
            </p>
            <div className="mt-4 flex justify-center">
              <ChevronDown className="h-5 w-5 text-[hsl(24,8%,49%)] animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBundleDragEnd}>
            <SortableContext items={sortedBundles.map((b: any) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {sortedBundles.map((bundle: any, idx: number) => {
                  const moduleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id);
                  const bundleModules = modules.filter((m: any) => moduleIds.includes(m.id));
                  const calcIndividualTotal = bundleModules.reduce((s: number, m: any) => s + (m.price_fixed || m.price_monthly || m.price_hourly || 0), 0);
                  const bPrice = bundle.bundle_price || 0;
                  const bSavings = calcIndividualTotal - bPrice;
                  const usage = usageStats[bundle.id];
                  // Check for inactive services in bundle
                  const allModuleNames = modules.map((m: any) => m.name);
                  const inactiveInBundle = moduleIds.filter((mid: string) => {
                    const m = modules.find((mod: any) => mod.id === mid);
                    return m && !m.is_active;
                  });

                  return (
                    <SortableBundleCard key={bundle.id} bundle={bundle} isMobile={isMobile} onMoveOrder={handleMoveOrder} index={idx} total={sortedBundles.length}>
                      <div className={cn(
                        "flex flex-col rounded-xl bg-card p-6 transition-shadow",
                        !bundle.is_active && "opacity-50",
                      )} style={{ boxShadow: '0 1px 3px rgba(42,33,24,0.05)' }}
                        onMouseEnter={e => { if (bundle.is_active) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(42,33,24,0.07)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(42,33,24,0.05)'; }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <InlineText value={bundle.name} onSave={v => handleInlineSave(bundle.id, 'name', v)}
                              className="text-[16px] font-semibold text-[hsl(24,19%,24%)]" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => setEditingServicesBundle(bundle)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit services
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(bundle)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(bundle)}>
                                {bundle.is_active ? <><EyeOff className="mr-2 h-4 w-4" /> Deactivate</> : <><Eye className="mr-2 h-4 w-4" /> Reactivate</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(bundle.id, bundle.name)} className="text-[hsl(0,20%,56%)] focus:text-[hsl(0,20%,56%)]">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <InlineText value={bundle.tagline || ''} onSave={v => handleInlineSave(bundle.id, 'tagline', v)}
                          className="text-[13px] text-[hsl(24,8%,49%)] mb-4" placeholder="Add a tagline..." />

                        {/* Service pills */}
                        <div className="flex flex-1 flex-wrap gap-1.5 content-start mb-4">
                          {bundleModules.map((m: any) => (
                            <span key={m.id} className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px]',
                              !m.is_active
                                ? 'border border-dashed border-[hsl(0,20%,56%)] text-[hsl(0,20%,56%)]'
                                : 'border border-solid border-[hsl(34,14%,91%)] bg-[hsl(34,14%,95%)] text-[hsl(24,19%,24%)]'
                            )}>{m.name}</span>
                          ))}
                          {bundleModules.length === 0 && moduleIds.length > 0 && (
                            <span className="text-xs text-muted-foreground">{moduleIds.length} services</span>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="border-t border-[hsl(34,14%,91%)] pt-4">
                          <div className="flex items-baseline justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-[13px] text-[hsl(30,8%,71%)] line-through">
                                Individual: {currencySymbol}{calcIndividualTotal.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-muted-foreground">Bundle:</span>
                                <InlinePrice value={bPrice} onSave={v => handleBundlePriceSave(bundle, v)} currencySymbol={currencySymbol} />
                              </div>
                              {bSavings > 0 && calcIndividualTotal > 0 && (
                                <span className="inline-block mt-1 rounded-full bg-[hsl(135,25%,94%)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(140,22%,52%)] whitespace-nowrap">
                                  Save {currencySymbol}{bSavings.toLocaleString()} ({Math.round((bSavings / calcIndividualTotal) * 100)}% off)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Usage stats (Spec #4) */}
                        {usage && usage.count > 0 && (
                          <p className="mt-3 text-[11px] text-[hsl(30,8%,71%)]">
                            Used in {usage.count} proposal{usage.count > 1 ? 's' : ''}
                            {usage.lastUsed && ` · Last used ${formatTimeAgo(usage.lastUsed)}`}
                          </p>
                        )}
                      </div>
                    </SortableBundleCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* BUNDLE TEMPLATES */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Library className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bundle Templates</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">Pre-built packages you can add to your library. Missing services are auto-added.</p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {defaultBundles.map(template => {
            const alreadyAdded = existingBundleNames.has(template.name);
            const missingServices = template.serviceNames.filter(n => !agencyModuleNames.has(n));
            const pricing = calculateBundlePricing(template.serviceNames, template.discountPercentage, modules);
            const isAdding = addingTemplate === template.name;
            const isExpanded = expandedTemplate === template.name;

            return (
              <div key={template.name} className={cn('flex flex-col rounded-xl border bg-card p-6 transition-shadow', alreadyAdded ? 'border-border opacity-60' : 'border-border hover:shadow-sm')}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent"><Package className="h-4 w-4 text-accent-foreground" /></div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-foreground">{template.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{template.tagline}</p>
                  </div>
                </div>
                <button onClick={() => setExpandedTemplate(isExpanded ? null : template.name)}
                  className="mb-3 flex items-center gap-1 text-[12px] text-[hsl(24,8%,49%)] hover:text-foreground transition-colors self-start">
                  {isExpanded ? 'Hide details' : 'View details'}
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <div className="mb-3 rounded-lg border border-[hsl(34,14%,91%)] bg-[hsl(40,20%,97%)] p-4 text-[12px] text-[hsl(24,19%,24%)] transition-all duration-200">
                    <p className="leading-relaxed">{template.description}</p>
                    <div className="mt-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(24,8%,49%)]">Included Services</p>
                      <div className="space-y-1">
                        {template.serviceNames.map(name => {
                          const found = findDefaultModule(name);
                          const agencyMod = modules.find((m: any) => m.name === name);
                          const price = agencyMod ? (agencyMod.price_fixed || agencyMod.price_monthly || 0) : (found?.module.price || 0);
                          const model = agencyMod ? agencyMod.pricing_model : (found?.module.pricingModel || 'fixed');
                          return (<div key={name} className="flex items-center justify-between"><span>{name}</span><span className="tabular-nums text-[hsl(24,8%,49%)]">{currencySymbol}{price.toLocaleString()} {model}</span></div>);
                        })}
                      </div>
                      <div className="mt-3 border-t border-[hsl(34,14%,91%)] pt-2 space-y-1">
                        <div className="flex justify-between"><span className="text-[hsl(24,8%,49%)]">Individual total:</span><span className="tabular-nums">{currencySymbol}{pricing.totalIndividual.toLocaleString()}</span></div>
                        <div className="flex justify-between font-semibold"><span>Bundle price:</span><span className="tabular-nums">{currencySymbol}{pricing.bundleTotal.toLocaleString()} <span className="font-normal text-[hsl(140,22%,52%)]">(save {currencySymbol}{pricing.totalSavings.toLocaleString()})</span></span></div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {template.serviceNames.map(name => {
                      const isMissing = !agencyModuleNames.has(name);
                      return (<span key={name} className={cn('rounded-full px-2.5 py-0.5 text-[11px]', isMissing ? 'border border-dashed border-[hsl(34,14%,83%)] bg-[hsl(40,20%,97%)] text-[hsl(24,8%,49%)]' : 'border border-solid border-[hsl(34,14%,91%)] bg-[hsl(34,14%,95%)] text-[hsl(24,19%,24%)]')}>{isMissing ? `+ ${name}` : name}</span>);
                    })}
                  </div>
                </div>
                <div className="border-t border-border pt-3 mb-4">
                  <span className="text-xs text-muted-foreground line-through">{formatBundlePrice(pricing.totalFixed, pricing.totalMonthly, currencySymbol)}</span>
                  <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-base font-bold tabular-nums text-foreground">{formatBundlePriceLabeled(pricing.bundleFixed, pricing.bundleMonthly, currencySymbol)}</span>
                    {pricing.totalSavings > 0 && (
                      <span className="ml-auto rounded-full bg-[hsl(135,25%,94%)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(140,22%,52%)] whitespace-nowrap">
                        Save {currencySymbol}{pricing.totalSavings.toLocaleString()} ({template.discountPercentage}% off)
                      </span>
                    )}
                  </div>
                </div>
                {alreadyAdded ? (
                  <div className="flex h-10 items-center justify-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4" /> Already in your library</div>
                ) : (
                  <button onClick={() => addTemplateBundle(template)} disabled={isAdding}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50">
                    {isAdding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : missingServices.length > 0 ? <>Add bundle + {missingServices.length} service{missingServices.length > 1 ? 's' : ''} <ArrowRight className="h-3.5 w-3.5" /></> : <>Add to my bundles <ArrowRight className="h-3.5 w-3.5" /></>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Edit Services Panel */}
      {editingServicesBundle && (
        <EditServicesPanel bundle={editingServicesBundle} modules={modules} currencySymbol={currencySymbol}
          onClose={() => setEditingServicesBundle(null)} onSaved={invalidate} />
      )}

      {/* Bundle Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Create Bundle</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bundle Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Growth Package" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tagline</label>
                <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Everything you need to grow" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional longer description..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /></div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Included Services * (min. 2)</label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {modules.map((m: any) => {
                    const isSelected = form.selectedModuleIds.has(m.id);
                    const price = m.price_fixed || m.price_monthly || m.price_hourly || 0;
                    const suffix = m.pricing_model === 'monthly' ? '/mo' : m.pricing_model === 'hourly' ? '/hr' : '';
                    return (
                      <div key={m.id} onClick={() => toggleModule(m.id)} className={cn('flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors', isSelected ? 'bg-accent/50' : 'hover:bg-muted/30')}>
                        <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', isSelected ? 'border-brand bg-brand' : 'border-muted-foreground/30')}>{isSelected && <Check className="h-3 w-3 text-primary-foreground" />}</div>
                        <span className="flex-1 text-sm text-foreground">{m.name}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{currencySymbol}{price.toLocaleString()}{suffix}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{form.selectedModuleIds.size} selected · Individual total: {currencySymbol}{individualTotal.toLocaleString()}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bundle Price *</label>
                <input type="number" value={form.bundle_price} onChange={e => setForm(p => ({ ...p, bundle_price: e.target.value }))}
                  placeholder={individualTotal > 0 ? `Suggest: ${Math.round(individualTotal * 0.85)}` : '0'}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                {savingsAmount > 0 && <p className="mt-1 text-xs text-[hsl(140,22%,52%)]">Clients save {currencySymbol}{savingsAmount.toLocaleString()} ({Math.round((savingsAmount / individualTotal) * 100)}% off)</p>}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || form.selectedModuleIds.size < 2}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
