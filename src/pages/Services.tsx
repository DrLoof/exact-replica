import { AppShell } from '@/components/layout/AppShell';
import { Plus, Search, ChevronDown, ChevronRight, MoreVertical, Layers, Pencil, X, Save, Copy, ArrowRight, GripVertical, Check, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { useAllServiceModules, useServiceGroups } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { defaultModulesByGroup } from '@/lib/defaultModules';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useIsMobile } from '@/hooks/use-mobile';

const pricingLabels: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };
const priceFieldMap: Record<string, string> = { fixed: 'price_fixed', monthly: 'price_monthly', hourly: 'price_hourly' };

interface ModuleForm {
  id?: string;
  name: string;
  short_description: string;
  description: string;
  group_id: string;
  pricing_model: string;
  price_fixed: string;
  price_monthly: string;
  price_hourly: string;
  estimated_hours: string;
  default_timeline: string;
  deliverables: string[];
  service_type: string;
  client_responsibilities: string[];
  out_of_scope: string[];
}

const emptyForm: ModuleForm = {
  name: '', short_description: '', description: '', group_id: '',
  pricing_model: 'fixed', price_fixed: '', price_monthly: '', price_hourly: '',
  estimated_hours: '', default_timeline: '', deliverables: [], service_type: 'core',
  client_responsibilities: [], out_of_scope: [],
};

type FilterMode = 'all' | 'active' | 'inactive';

/* ─── Inline Price Editor ─── */
function InlinePriceEditor({ mod, currencySymbol, onSave }: { mod: any; currencySymbol: string; onSave: (id: string, field: string, value: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const priceValue = mod.price_fixed || mod.price_monthly || mod.price_hourly || 0;
  const [draft, setDraft] = useState(priceValue.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(priceValue.toString());
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, priceValue]);

  const commitSave = async () => {
    const numVal = parseFloat(draft) || 0;
    const field = priceFieldMap[mod.pricing_model] || 'price_fixed';
    setEditing(false);
    if (numVal !== priceValue) {
      await onSave(mod.id, field, numVal);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitSave(); }
    if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{currencySymbol}</span>
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitSave}
          onKeyDown={handleKeyDown}
          className="w-[100px] rounded border border-border bg-background px-2 py-1 text-right text-[13px] font-semibold text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group/price relative rounded-lg bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-foreground hover:bg-accent transition-colors cursor-text"
      title="Click to edit price"
    >
      {currencySymbol}{priceValue.toLocaleString()}{pricingLabels[mod.pricing_model] || ''}
      {saved && (
        <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-green-600 animate-in fade-in zoom-in duration-200">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

/* ─── Sortable Service Row ─── */
function SortableServiceRow({
  mod, currencySymbol, groups, isMobile,
  onToggleActive, onEdit, onDuplicate, onMove, onDelete, onPriceSave, onMoveOrder,
  totalInGroup,
  index,
}: {
  mod: any; currencySymbol: string; groups: any[]; isMobile: boolean;
  onToggleActive: (m: any) => void; onEdit: (m: any) => void; onDuplicate: (m: any) => void;
  onMove: (id: string, gid: string) => void; onDelete: (m: any) => void;
  onPriceSave: (id: string, field: string, value: number) => Promise<void>;
  onMoveOrder: (id: string, dir: 'up' | 'down') => void;
  totalInGroup: number;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    boxShadow: isDragging ? '0 4px 12px rgba(42,33,24,0.08)' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/row flex items-center gap-3 border-b border-border px-5 py-3 last:border-0 transition-colors hover:bg-muted/30",
        !mod.is_active && "opacity-50"
      )}
    >
      {/* Drag handle or mobile arrows */}
      {isMobile ? (
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveOrder(mod.id, 'up')} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
          <button onClick={() => onMoveOrder(mod.id, 'down')} disabled={index === totalInGroup - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button {...attributes} {...listeners} className="cursor-grab text-[hsl(34,14%,77%)] opacity-0 group-hover/row:opacity-100 transition-opacity active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium text-foreground", !mod.is_active && "line-through decoration-muted-foreground/50")}>{mod.name}</p>
          {mod.service_type === 'addon' && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ADD-ON</span>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{mod.short_description}</p>
      </div>

      <InlinePriceEditor mod={mod} currencySymbol={currencySymbol} onSave={onPriceSave} />
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{mod.pricing_model}</span>

      <Switch
        checked={!!mod.is_active}
        onCheckedChange={() => onToggleActive(mod)}
        className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted-foreground/30"
      />

      <button onClick={() => onEdit(mod)} className="text-muted-foreground hover:text-foreground">
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onDuplicate(mod)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRight className="mr-2 h-4 w-4" /> Move to…
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {groups.filter((g: any) => g.id !== mod.group_id).map((g: any) => (
                <DropdownMenuItem key={g.id} onClick={() => onMove(mod.id, g.id)}>
                  {g.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(mod)} className="text-[hsl(0,30%,56%)] focus:text-[hsl(0,30%,56%)]">
            <X className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ─── Sortable Group ─── */
function SortableGroupHeader({ group, children, isMobile, onMoveGroup, index, total }: {
  group: any; children: React.ReactNode; isMobile: boolean;
  onMoveGroup: (id: string, dir: 'up' | 'down') => void; index: number; total: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `group-${group.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    boxShadow: isDragging ? '0 4px 12px rgba(42,33,24,0.08)' : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

/* ─── Main ─── */
export default function Services() {
  const { agency } = useAuth();
  const { data: modules = [], isLoading: loadingModules } = useAllServiceModules();
  const { data: groups = [], isLoading: loadingGroups } = useServiceGroups();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState<string | null>(null);
  const [form, setForm] = useState<ModuleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeServiceDrag, setActiveServiceDrag] = useState<string | null>(null);
  const [activeGroupDrag, setActiveGroupDrag] = useState<string | null>(null);
  const currencySymbol = agency?.currency_symbol || '$';

  const activeCount = modules.filter((m: any) => m.is_active).length;
  const inactiveCount = modules.filter((m: any) => !m.is_active).length;

  // Sort groups by display_order
  const sortedGroups = [...groups].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const filterModule = (m: any) => {
    if (filter === 'active' && !m.is_active) return false;
    if (filter === 'inactive' && m.is_active) return false;
    if (search && !m.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  const groupedModules = sortedGroups
    .map((g: any) => ({
      ...g,
      modules: modules
        .filter((m: any) => m.group_id === g.id && filterModule(m))
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    }))
    .filter((g: any) => g.modules.length > 0 || (!search && filter === 'all'));

  const isExpanded = (id: string) => expanded[id] !== false;
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !isExpanded(id) }));
  const isLoading = loadingModules || loadingGroups;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openCreate = (groupId?: string) => {
    setForm({ ...emptyForm, group_id: groupId || sortedGroups[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (mod: any) => {
    setForm({
      id: mod.id, name: mod.name || '', short_description: mod.short_description || '',
      description: mod.description || '', group_id: mod.group_id || '',
      pricing_model: mod.pricing_model || 'fixed',
      price_fixed: mod.price_fixed?.toString() || '', price_monthly: mod.price_monthly?.toString() || '',
      price_hourly: mod.price_hourly?.toString() || '', estimated_hours: mod.estimated_hours?.toString() || '',
      default_timeline: mod.default_timeline || '', deliverables: mod.deliverables || [],
      service_type: mod.service_type || 'core',
      client_responsibilities: mod.client_responsibilities || [], out_of_scope: mod.out_of_scope || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      agency_id: agency.id, name: form.name.trim(),
      short_description: form.short_description || null, description: form.description || null,
      group_id: form.group_id || null, pricing_model: form.pricing_model,
      price_fixed: form.price_fixed ? parseFloat(form.price_fixed) : null,
      price_monthly: form.price_monthly ? parseFloat(form.price_monthly) : null,
      price_hourly: form.price_hourly ? parseFloat(form.price_hourly) : null,
      estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours) : null,
      default_timeline: form.default_timeline || null,
      deliverables: form.deliverables.length > 0 ? form.deliverables : null,
      client_responsibilities: form.client_responsibilities.length > 0 ? form.client_responsibilities : null,
      out_of_scope: form.out_of_scope.length > 0 ? form.out_of_scope : null,
      service_type: form.service_type, is_active: true,
    };
    if (form.id) {
      const { error } = await supabase.from('service_modules').update(payload).eq('id', form.id);
      if (error) toast.error('Failed to update'); else toast.success('Service updated');
    } else {
      const { error } = await supabase.from('service_modules').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Service created');
    }
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    setShowModal(false);
    setSaving(false);
  };

  const handleToggleActive = async (mod: any) => {
    const newActive = !mod.is_active;
    await supabase.from('service_modules').update({ is_active: newActive }).eq('id', mod.id);
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    toast.success(newActive ? 'Service activated' : 'Service deactivated');
  };

  const handleDuplicate = async (mod: any) => {
    if (!agency) return;
    const { id, service_groups, ...rest } = mod;
    const { error } = await supabase.from('service_modules').insert({ ...rest, name: `${mod.name} (copy)`, agency_id: agency.id });
    if (error) toast.error('Failed to duplicate'); else toast.success('Service duplicated');
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
  };

  const handleMove = async (modId: string, newGroupId: string) => {
    await supabase.from('service_modules').update({ group_id: newGroupId }).eq('id', modId);
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    toast.success('Service moved');
  };

  const handleDelete = async (mod: any) => {
    if (!confirm(`Delete ${mod.name}? This can't be undone.`)) return;
    await supabase.from('service_modules').delete().eq('id', mod.id);
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    toast.success('Service deleted');
  };

  const handlePriceSave = async (id: string, field: string, value: number) => {
    const { error } = await supabase.from('service_modules').update({ [field]: value }).eq('id', id);
    if (error) toast.error('Failed to save price');
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
  };

  const handleActivateFromLibrary = async (groupName: string, libModule: any) => {
    if (!agency) return;
    const group = sortedGroups.find((g: any) => g.name === groupName);
    if (!group) return;
    const { error } = await supabase.from('service_modules').insert({
      agency_id: agency.id, name: libModule.name, short_description: libModule.shortDesc,
      description: libModule.description, group_id: group.id, pricing_model: libModule.pricingModel,
      price_fixed: libModule.pricingModel === 'fixed' ? libModule.price : null,
      price_monthly: libModule.pricingModel === 'monthly' ? libModule.price : null,
      price_hourly: libModule.pricingModel === 'hourly' ? libModule.price : null,
      deliverables: libModule.deliverables, client_responsibilities: libModule.clientResponsibilities,
      out_of_scope: libModule.outOfScope, default_timeline: libModule.defaultTimeline,
      service_type: libModule.serviceType, is_active: true,
    });
    if (error) toast.error('Failed to add service'); else toast.success(`${libModule.name} added`);
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
  };

  /* ─── Drag handlers for services ─── */
  const handleServiceDragEnd = async (event: DragEndEvent, groupModules: any[]) => {
    const { active, over } = event;
    setActiveServiceDrag(null);
    if (!over || active.id === over.id) return;
    const oldIndex = groupModules.findIndex((m: any) => m.id === active.id);
    const newIndex = groupModules.findIndex((m: any) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(groupModules, oldIndex, newIndex);
    const updates = reordered.map((m: any, i: number) => supabase.from('service_modules').update({ display_order: i }).eq('id', m.id));
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
  };

  /* ─── Drag handlers for groups ─── */
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGroupDrag(null);
    if (!over || active.id === over.id) return;
    const oldIndex = sortedGroups.findIndex((g: any) => `group-${g.id}` === active.id);
    const newIndex = sortedGroups.findIndex((g: any) => `group-${g.id}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sortedGroups, oldIndex, newIndex);
    const updates = reordered.map((g: any, i: number) => supabase.from('service_groups').update({ display_order: i }).eq('id', g.id));
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['service_groups'] });
  };

  /* ─── Mobile reorder helpers ─── */
  const handleMoveServiceOrder = async (modId: string, dir: 'up' | 'down') => {
    // find the group this module belongs to
    const mod = modules.find((m: any) => m.id === modId);
    if (!mod) return;
    const groupMods = modules
      .filter((m: any) => m.group_id === mod.group_id)
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const idx = groupMods.findIndex((m: any) => m.id === modId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= groupMods.length) return;
    const reordered = arrayMove(groupMods, idx, swapIdx);
    const updates = reordered.map((m: any, i: number) => supabase.from('service_modules').update({ display_order: i }).eq('id', m.id));
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['all_service_modules'] });
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
  };

  const handleMoveGroupOrder = async (groupId: string, dir: 'up' | 'down') => {
    const idx = sortedGroups.findIndex((g: any) => g.id === groupId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedGroups.length) return;
    const reordered = arrayMove(sortedGroups, idx, swapIdx);
    const updates = reordered.map((g: any, i: number) => supabase.from('service_groups').update({ display_order: i }).eq('id', g.id));
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['service_groups'] });
  };

  const getGroupName = (groupId: string) => sortedGroups.find((g: any) => g.id === groupId)?.name || '';
  const getLibraryModules = (groupName: string) => {
    const lib = defaultModulesByGroup[groupName] || [];
    const existingNames = modules.filter((m: any) => getGroupName(m.group_id) === groupName).map((m: any) => m.name.toLowerCase());
    return lib.filter(l => !existingNames.includes(l.name.toLowerCase()));
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  const ListField = ({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string }) => {
    const [draft, setDraft] = useState('');
    const addItem = () => { const val = draft.trim(); if (val && !items.includes(val)) { onChange([...items, val]); setDraft(''); } };
    return (
      <F label={label}>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="group flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm text-foreground">
              <span className="flex-1">{item}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }} placeholder={placeholder} className={inputCls} />
            <button type="button" onClick={addItem} disabled={!draft.trim()} className="shrink-0 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-40"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </F>
    );
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <span className="text-[13px] text-[hsl(24,8%,49%)]">
            {activeCount} active{inactiveCount > 0 && ` · ${inactiveCount} inactive`}
          </span>
        </div>
        <button onClick={() => openCreate()} className="flex items-center gap-2 rounded-lg border border-[hsl(34,14%,91%)] bg-transparent px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-[hsl(40,20%,97%)] hover:border-[hsl(34,14%,83%)]">
          <Plus className="h-4 w-4 text-[hsl(24,8%,49%)]" /> Add Service
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="relative flex items-center gap-1.5">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as FilterMode)}
            className="appearance-none rounded-lg border border-[hsl(34,14%,91%)] bg-card px-3 py-2 pr-7 text-[12px] text-[hsl(24,8%,49%)] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="all">All</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[hsl(24,8%,49%)]" />
          {filter !== 'all' && (
            <span className="ml-1 h-2 w-2 rounded-full bg-brand" title="Filter active" />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />)}</div>
      ) : groupedModules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">{search ? 'No services match your search' : 'No services yet'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{search ? 'Try a different search term' : 'Complete onboarding to set up your service catalog'}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e: DragStartEvent) => {
          if (String(e.active.id).startsWith('group-')) setActiveGroupDrag(String(e.active.id));
        }} onDragEnd={handleGroupDragEnd}>
          <SortableContext items={groupedModules.map((g: any) => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {groupedModules.map((group: any, groupIndex: number) => {
                const IconComp = (Icons as any)[group.icon] || Icons.Layers;
                const isOpen = isExpanded(group.id);
                const groupActiveCount = group.modules.filter((m: any) => m.is_active).length;
                const groupName = group.name;
                const libraryModules = getLibraryModules(groupName);

                return (
                  <SortableGroupHeader key={group.id} group={group} isMobile={isMobile} onMoveGroup={handleMoveGroupOrder} index={groupIndex} total={groupedModules.length}>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {/* Group header */}
                      <div className="group flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50">
                        {/* Group drag handle */}
                        {isMobile ? (
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => handleMoveGroupOrder(group.id, 'up')} disabled={groupIndex === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                            <button onClick={() => handleMoveGroupOrder(group.id, 'down')} disabled={groupIndex === groupedModules.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                          </div>
                        ) : (
                          <SortableGroupGrip groupId={group.id} />
                        )}

                        <button onClick={() => toggle(group.id)} className="flex flex-1 items-center gap-3 text-left">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                            <IconComp className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-foreground">{group.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{groupActiveCount} active</span>
                          </div>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openCreate(group.id); }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[hsl(24,8%,49%)] transition-colors hover:bg-[hsl(34,14%,94%)]"
                          title={`Add service to ${group.name}`}>
                          <Plus className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggle(group.id)} className="text-muted-foreground">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="border-t border-border">
                          {group.modules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
                              <p className="text-[13px] font-medium text-[hsl(24,19%,24%)]">No services yet.</p>
                              <p className="mt-1 text-[12px] text-[hsl(24,8%,49%)]">
                                Add your {groupName.toLowerCase()} services, or activate from our pre-built library.
                              </p>
                              <div className="mt-4 flex items-center gap-4">
                                <button onClick={() => openCreate(group.id)} className="flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline">
                                  <Plus className="h-3.5 w-3.5" /> Add service
                                </button>
                                {libraryModules.length > 0 && (
                                  <button onClick={() => setShowLibrary(group.id)} className="flex items-center gap-1.5 text-[13px] text-[hsl(24,8%,49%)] hover:text-foreground">
                                    Browse library <ArrowRight className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter}
                              onDragStart={(e: DragStartEvent) => setActiveServiceDrag(String(e.active.id))}
                              onDragEnd={(e) => handleServiceDragEnd(e, group.modules)}>
                              <SortableContext items={group.modules.map((m: any) => m.id)} strategy={verticalListSortingStrategy}>
                                {group.modules.map((mod: any, idx: number) => (
                                  <SortableServiceRow
                                    key={mod.id}
                                    mod={mod}
                                    currencySymbol={currencySymbol}
                                    groups={sortedGroups}
                                    isMobile={isMobile}
                                    onToggleActive={handleToggleActive}
                                    onEdit={openEdit}
                                    onDuplicate={handleDuplicate}
                                    onMove={handleMove}
                                    onDelete={handleDelete}
                                    onPriceSave={handlePriceSave}
                                    onMoveOrder={handleMoveServiceOrder}
                                    totalInGroup={group.modules.length}
                                    index={idx}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      )}
                    </div>
                  </SortableGroupHeader>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Browse Library Modal */}
      {showLibrary && (() => {
        const group = sortedGroups.find((g: any) => g.id === showLibrary);
        const groupName = group?.name || '';
        const libMods = getLibraryModules(groupName);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowLibrary(null)}>
            <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{groupName} Library</h3>
                  <p className="text-xs text-muted-foreground mt-1">Pre-built services you can activate with one click</p>
                </div>
                <button onClick={() => setShowLibrary(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              {libMods.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">All library services have been added.</p>
              ) : (
                <div className="space-y-2">
                  {libMods.map((lm, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-foreground">{lm.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lm.shortDesc}</p>
                      </div>
                      <button onClick={() => handleActivateFromLibrary(groupName, lm)} className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">+ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Service Module Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{form.id ? 'Edit Service' : 'New Service'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <F label="Service Name"><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Brand Identity System" className={inputCls} /></F>
              <F label="Category"><select value={form.group_id} onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))} className={inputCls}>{sortedGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></F>
              <F label="Short Description"><input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="One-line description" className={inputCls} /></F>
              <F label="Full Description"><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed description..." className={inputCls} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Pricing Model"><select value={form.pricing_model} onChange={e => setForm(p => ({ ...p, pricing_model: e.target.value }))} className={inputCls}><option value="fixed">Fixed</option><option value="monthly">Monthly</option><option value="hourly">Hourly</option></select></F>
                <F label="Service Type"><select value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))} className={inputCls}><option value="core">Core</option><option value="addon">Add-on</option></select></F>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <F label="Fixed Price"><input type="number" value={form.price_fixed} onChange={e => setForm(p => ({ ...p, price_fixed: e.target.value }))} placeholder="0" className={inputCls} /></F>
                <F label="Monthly Price"><input type="number" value={form.price_monthly} onChange={e => setForm(p => ({ ...p, price_monthly: e.target.value }))} placeholder="0" className={inputCls} /></F>
                <F label="Hourly Rate"><input type="number" value={form.price_hourly} onChange={e => setForm(p => ({ ...p, price_hourly: e.target.value }))} placeholder="0" className={inputCls} /></F>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Estimated Hours"><input type="number" value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} placeholder="40" className={inputCls} /></F>
                <F label="Default Timeline"><input value={form.default_timeline} onChange={e => setForm(p => ({ ...p, default_timeline: e.target.value }))} placeholder="2-3 weeks" className={inputCls} /></F>
              </div>
              <ListField label="Deliverables" items={form.deliverables} onChange={items => setForm(p => ({ ...p, deliverables: items }))} placeholder="Add deliverable..." />
              <ListField label="Client Responsibilities" items={form.client_responsibilities} onChange={items => setForm(p => ({ ...p, client_responsibilities: items }))} placeholder="Add responsibility..." />
              <ListField label="Out of Scope" items={form.out_of_scope} onChange={items => setForm(p => ({ ...p, out_of_scope: items }))} placeholder="Add item..." />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ─── Grip handle for sortable groups (needs access to useSortable of parent) ─── */
function SortableGroupGrip({ groupId }: { groupId: string }) {
  const { attributes, listeners } = useSortable({ id: `group-${groupId}` });
  return (
    <button {...attributes} {...listeners} className="cursor-grab text-[hsl(34,14%,77%)] opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing">
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
