import { AppShell } from '@/components/layout/AppShell';
import { Plus, Search, ChevronDown, ChevronRight, MoreHorizontal, Layers, Pencil, Trash2, X, Save } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { useServiceModules, useServiceGroups } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const pricingLabels: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

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

export default function Services() {
  const { agency } = useAuth();
  const { data: modules = [], isLoading: loadingModules } = useServiceModules();
  const { data: groups = [], isLoading: loadingGroups } = useServiceGroups();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ModuleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const currencySymbol = agency?.currency_symbol || '$';

  const groupedModules = groups
    .map((g: any) => ({
      ...g,
      modules: modules.filter((m: any) => m.group_id === g.id && (
        !search || m.name?.toLowerCase().includes(search.toLowerCase())
      )),
    }))
    .filter((g: any) => g.modules.length > 0 || !search);

  const isExpanded = (id: string) => expanded[id] !== false;
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !isExpanded(id) }));
  const isLoading = loadingModules || loadingGroups;

  const openCreate = () => {
    setForm({ ...emptyForm, group_id: groups[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (mod: any) => {
    setForm({
      id: mod.id,
      name: mod.name || '',
      short_description: mod.short_description || '',
      description: mod.description || '',
      group_id: mod.group_id || '',
      pricing_model: mod.pricing_model || 'fixed',
      price_fixed: mod.price_fixed?.toString() || '',
      price_monthly: mod.price_monthly?.toString() || '',
      price_hourly: mod.price_hourly?.toString() || '',
      estimated_hours: mod.estimated_hours?.toString() || '',
      default_timeline: mod.default_timeline || '',
      deliverables: mod.deliverables || [],
      service_type: mod.service_type || 'core',
      client_responsibilities: mod.client_responsibilities || [],
      out_of_scope: mod.out_of_scope || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency || !form.name.trim()) return;
    setSaving(true);

    const payload = {
      agency_id: agency.id,
      name: form.name.trim(),
      short_description: form.short_description || null,
      description: form.description || null,
      group_id: form.group_id || null,
      pricing_model: form.pricing_model,
      price_fixed: form.price_fixed ? parseFloat(form.price_fixed) : null,
      price_monthly: form.price_monthly ? parseFloat(form.price_monthly) : null,
      price_hourly: form.price_hourly ? parseFloat(form.price_hourly) : null,
      estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours) : null,
      default_timeline: form.default_timeline || null,
      deliverables: form.deliverables.length > 0 ? form.deliverables : null,
      client_responsibilities: form.client_responsibilities.length > 0 ? form.client_responsibilities : null,
      out_of_scope: form.out_of_scope.length > 0 ? form.out_of_scope : null,
      service_type: form.service_type,
      is_active: true,
    };

    if (form.id) {
      const { error } = await supabase.from('service_modules').update(payload).eq('id', form.id);
      if (error) toast.error('Failed to update'); else toast.success('Service updated');
    } else {
      const { error } = await supabase.from('service_modules').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Service created');
    }

    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service module?')) return;
    await supabase.from('service_modules').update({ is_active: false }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    toast.success('Service removed');
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
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
        <div className="space-y-3">
          {groupedModules.map((group: any) => {
            const IconComp = (Icons as any)[group.icon] || Icons.Layers;
            const isOpen = isExpanded(group.id);
            return (
              <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button onClick={() => toggle(group.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <IconComp className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">{group.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{group.modules.length} active</span>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="border-t border-border">
                    {group.modules.length === 0 ? (
                      <div className="px-5 py-4 text-center text-xs text-muted-foreground">No services in this group</div>
                    ) : group.modules.map((mod: any) => (
                      <div key={mod.id} className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0 transition-colors hover:bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{mod.name}</p>
                            {mod.service_type === 'addon' && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ADD-ON</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{mod.short_description}</p>
                        </div>
                        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                          {currencySymbol}{(mod.price_fixed || mod.price_monthly || mod.price_hourly || 0).toLocaleString()}{pricingLabels[mod.pricing_model] || ''}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{mod.pricing_model}</span>
                        <button onClick={() => openEdit(mod)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(mod.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Service Module Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{form.id ? 'Edit Service' : 'New Service'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <F label="Service Name">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Brand Identity System" className={inputCls} />
              </F>
              <F label="Category">
                <select value={form.group_id} onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))} className={inputCls}>
                  {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </F>
              <F label="Short Description">
                <input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="One-line description" className={inputCls} />
              </F>
              <F label="Full Description">
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed description..." className={inputCls} />
              </F>

              <div className="grid grid-cols-2 gap-4">
                <F label="Pricing Model">
                  <select value={form.pricing_model} onChange={e => setForm(p => ({ ...p, pricing_model: e.target.value }))} className={inputCls}>
                    <option value="fixed">Fixed</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </F>
                <F label="Service Type">
                  <select value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))} className={inputCls}>
                    <option value="core">Core</option>
                    <option value="addon">Add-on</option>
                  </select>
                </F>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <F label="Fixed Price">
                  <input type="number" value={form.price_fixed} onChange={e => setForm(p => ({ ...p, price_fixed: e.target.value }))} placeholder="0" className={inputCls} />
                </F>
                <F label="Monthly Price">
                  <input type="number" value={form.price_monthly} onChange={e => setForm(p => ({ ...p, price_monthly: e.target.value }))} placeholder="0" className={inputCls} />
                </F>
                <F label="Hourly Rate">
                  <input type="number" value={form.price_hourly} onChange={e => setForm(p => ({ ...p, price_hourly: e.target.value }))} placeholder="0" className={inputCls} />
                </F>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <F label="Estimated Hours">
                  <input type="number" value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} placeholder="40" className={inputCls} />
                </F>
                <F label="Default Timeline">
                  <input value={form.default_timeline} onChange={e => setForm(p => ({ ...p, default_timeline: e.target.value }))} placeholder="2-3 weeks" className={inputCls} />
                </F>
              </div>

              <F label="Deliverables (one per line)">
                <textarea value={form.deliverables} onChange={e => setForm(p => ({ ...p, deliverables: e.target.value }))} rows={3} placeholder="Logo design&#10;Brand guidelines&#10;Color palette" className={inputCls} />
              </F>
              <F label="Client Responsibilities (one per line)">
                <textarea value={form.client_responsibilities} onChange={e => setForm(p => ({ ...p, client_responsibilities: e.target.value }))} rows={3} placeholder="Provide brand guidelines&#10;Designate decision-maker&#10;Provide timely feedback" className={inputCls} />
              </F>
              <F label="Out of Scope (one per line)">
                <textarea value={form.out_of_scope} onChange={e => setForm(p => ({ ...p, out_of_scope: e.target.value }))} rows={3} placeholder="Copywriting&#10;Photography&#10;Ongoing maintenance" className={inputCls} />
              </F>
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
