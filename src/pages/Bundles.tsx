import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Plus, Package, Trash2, Pencil, X, Save, Check, Library, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBundles, useServiceModules } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { defaultBundles, findDefaultModule, calculateBundlePricing, formatBundlePrice } from '@/lib/defaultBundles';
import { defaultModulesByGroup } from '@/lib/defaultModules';

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

export default function Bundles() {
  const { agency } = useAuth();
  const { data: bundles = [], isLoading } = useBundles();
  const { data: modules = [] } = useServiceModules();
  const queryClient = useQueryClient();
  const currencySymbol = agency?.currency_symbol || '$';
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BundleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bundle?')) return;
    await supabase.from('bundle_modules').delete().eq('bundle_id', id);
    await supabase.from('bundles').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['bundles'] });
    toast.success('Bundle deleted');
  };

  const openCreate = () => { setForm(emptyForm); setShowModal(true); };

  const openEdit = async (bundle: any) => {
    const { data: bms } = await supabase.from('bundle_modules').select('module_id').eq('bundle_id', bundle.id);
    setForm({
      id: bundle.id,
      name: bundle.name,
      tagline: bundle.tagline || '',
      description: bundle.description || '',
      bundle_price: bundle.bundle_price?.toString() || '',
      selectedModuleIds: new Set((bms || []).map((bm: any) => bm.module_id).filter(Boolean)),
    });
    setShowModal(true);
  };

  const toggleModule = (id: string) => {
    setForm(prev => {
      const next = new Set(prev.selectedModuleIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, selectedModuleIds: next };
    });
  };

  const individualTotal = modules
    .filter((m: any) => form.selectedModuleIds.has(m.id))
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
      agency_id: agency.id,
      name: form.name.trim(),
      tagline: form.tagline || null,
      description: form.description || null,
      bundle_price: bundlePrice || null,
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

    const bmInserts = Array.from(form.selectedModuleIds).map(moduleId => ({
      bundle_id: bundleId!,
      module_id: moduleId,
    }));
    if (bmInserts.length > 0) {
      await supabase.from('bundle_modules').insert(bmInserts);
    }

    toast.success(form.id ? 'Bundle updated' : 'Bundle created');
    setShowModal(false);
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['bundles'] });
  };

  // Add template bundle logic
  const addTemplateBundle = async (template: typeof defaultBundles[0]) => {
    if (!agency) return;
    setAddingTemplate(template.name);

    try {
      // 1. Check which services exist/missing
      const { data: allAgencyModules } = await supabase
        .from('service_modules')
        .select('*')
        .eq('agency_id', agency.id);
      const existingNames = new Set((allAgencyModules || []).map((m: any) => m.name));

      // 2. Find missing services and add them
      const missingNames = template.serviceNames.filter(n => !existingNames.has(n));
      const reactivated: string[] = [];
      const added: string[] = [];

      // Get service group IDs
      const { data: groups } = await supabase.from('service_groups').select('id, name');
      const groupIdMap: Record<string, string> = {};
      (groups || []).forEach((g: any) => { groupIdMap[g.name] = g.id; });

      for (const name of missingNames) {
        // Check if inactive
        const { data: inactive } = await supabase
          .from('service_modules')
          .select('id')
          .eq('agency_id', agency.id)
          .eq('name', name)
          .eq('is_active', false)
          .maybeSingle();

        if (inactive) {
          await supabase.from('service_modules').update({ is_active: true }).eq('id', inactive.id);
          reactivated.push(name);
        } else {
          const found = findDefaultModule(name);
          if (found) {
            const groupId = groupIdMap[found.groupName];
            await supabase.from('service_modules').insert({
              agency_id: agency.id,
              group_id: groupId || null,
              name: found.module.name,
              description: found.module.description,
              short_description: found.module.shortDesc,
              pricing_model: found.module.pricingModel,
              price_fixed: found.module.pricingModel === 'fixed' ? found.module.price : null,
              price_monthly: found.module.pricingModel === 'monthly' ? found.module.price : null,
              price_hourly: found.module.pricingModel === 'hourly' ? found.module.price : null,
              service_type: found.module.serviceType,
              deliverables: found.module.deliverables,
              client_responsibilities: found.module.clientResponsibilities,
              out_of_scope: found.module.outOfScope,
              default_timeline: found.module.defaultTimeline,
              suggested_kpis: found.module.suggestedKpis,
              common_tools: found.module.commonTools,
              is_active: true,
            });
            added.push(name);
          }
        }
      }

      // 3. Re-fetch agency modules to get IDs
      const { data: updatedModules } = await supabase
        .from('service_modules')
        .select('id, name, price_fixed, price_monthly')
        .eq('agency_id', agency.id)
        .eq('is_active', true);

      // 4. Calculate pricing using agency module prices
      const pricing = calculateBundlePricing(template.serviceNames, template.discountPercentage, updatedModules);

      // 5. Create the bundle
      const { data: newBundle, error } = await supabase.from('bundles').insert({
        agency_id: agency.id,
        name: template.name,
        tagline: template.tagline,
        description: template.description,
        bundle_price: pricing.bundleFixed + pricing.bundleMonthly,
        individual_total: pricing.totalFixed + pricing.totalMonthly,
        savings_amount: pricing.totalSavings,
        savings_label: pricing.totalSavings > 0 ? `Save ${currencySymbol}${pricing.totalSavings.toLocaleString()}` : null,
        is_active: true,
      }).select('id').single();

      if (error) throw error;

      // 6. Link modules
      const moduleIds = template.serviceNames
        .map(n => (updatedModules || []).find((m: any) => m.name === n)?.id)
        .filter(Boolean);

      if (moduleIds.length > 0) {
        await supabase.from('bundle_modules').insert(
          moduleIds.map(mid => ({ bundle_id: newBundle.id, module_id: mid }))
        );
      }

      // 7. Toast
      let msg = `${template.name} added to your bundles`;
      if (added.length > 0) msg += `. ${added.length} service${added.length > 1 ? 's were' : ' was'} also added to your library: ${added.join(', ')}`;
      if (reactivated.length > 0) msg += `. Reactivated: ${reactivated.join(', ')}`;
      toast.success(msg);

      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      queryClient.invalidateQueries({ queryKey: ['service_modules'] });
    } catch (e) {
      console.error(e);
      toast.error('Failed to add bundle');
    }
    setAddingTemplate(null);
  };

  // Which templates are already added
  const existingBundleNames = new Set(bundles.map((b: any) => b.name));
  const agencyModuleNames = new Set(modules.map((m: any) => m.name));

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bundles</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          <Plus className="h-4 w-4" />
          Create Bundle
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-brand/20 bg-accent p-4">
        <p className="text-sm text-accent-foreground">
          💡 <span className="font-medium">Pro tip:</span> Agencies using bundles close 23% larger deals on average. Package your services for bigger wins.
        </p>
      </div>

      {/* YOUR BUNDLES */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Bundles</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />)}
          </div>
        ) : bundles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No bundles yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your own or add from the templates below</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {bundles.map((bundle: any) => {
              const moduleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id);
              const bundleModules = modules.filter((m: any) => moduleIds.includes(m.id));

              return (
                <div key={bundle.id} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Package className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(bundle)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(bundle.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">{bundle.name}</h3>
                  {bundle.tagline && <p className="mt-1 text-sm text-muted-foreground">{bundle.tagline}</p>}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {bundleModules.map((m: any) => (
                      <span key={m.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{m.name}</span>
                    ))}
                    {bundleModules.length === 0 && moduleIds.length > 0 && (
                      <span className="text-xs text-muted-foreground">{moduleIds.length} services</span>
                    )}
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        {bundle.individual_total > bundle.bundle_price && (
                          <span className="text-sm text-muted-foreground line-through">{currencySymbol}{(bundle.individual_total || 0).toLocaleString()}</span>
                        )}
                        <span className="ml-2 font-display text-xl font-bold tabular-nums text-foreground">{currencySymbol}{(bundle.bundle_price || 0).toLocaleString()}</span>
                      </div>
                      {(bundle.savings_amount || 0) > 0 && (
                        <span className="rounded-full bg-status-success/15 px-2.5 py-0.5 text-xs font-medium text-status-success">
                          Save {currencySymbol}{(bundle.savings_amount || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

            return (
              <div key={template.name} className={cn(
                'rounded-xl border bg-card p-6 transition-shadow',
                alreadyAdded ? 'border-border opacity-60' : 'border-border hover:shadow-sm'
              )}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <Package className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-foreground">{template.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{template.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {template.serviceNames.map(name => {
                    const isMissing = !agencyModuleNames.has(name);
                    return (
                      <span key={name} className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px]',
                        isMissing
                          ? 'border border-dashed border-muted-foreground/30 text-muted-foreground/70'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {name}
                      </span>
                    );
                  })}
                </div>

                {missingServices.length > 0 && !alreadyAdded && (
                  <p className="mb-3 text-[11px] text-muted-foreground">
                    <span className="italic">Dashed = will be added to your service library</span>
                  </p>
                )}

                <div className="border-t border-border pt-3 mb-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatBundlePrice(pricing.totalFixed, pricing.totalMonthly, currencySymbol)}
                      </span>
                      <span className="ml-2 font-display text-base font-bold tabular-nums text-foreground">
                        {formatBundlePrice(pricing.bundleFixed, pricing.bundleMonthly, currencySymbol)}
                      </span>
                    </div>
                    {pricing.totalSavings > 0 && (
                      <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-[11px] font-semibold text-status-success">
                        Save {currencySymbol}{pricing.totalSavings.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {alreadyAdded ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4" />
                    Already in your library
                  </div>
                ) : (
                  <button
                    onClick={() => addTemplateBundle(template)}
                    disabled={isAdding}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
                  >
                    {isAdding ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                    ) : missingServices.length > 0 ? (
                      <>Add bundle + {missingServices.length} service{missingServices.length > 1 ? 's' : ''} <ArrowRight className="h-3.5 w-3.5" /></>
                    ) : (
                      <>Add to my bundles <ArrowRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bundle Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{form.id ? 'Edit Bundle' : 'Create Bundle'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bundle Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Growth Package" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tagline</label>
                <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Everything you need to grow" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional longer description..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Included Services * (min. 2)</label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {modules.map((m: any) => {
                    const isSelected = form.selectedModuleIds.has(m.id);
                    const price = m.price_fixed || m.price_monthly || m.price_hourly || 0;
                    const suffix = m.pricing_model === 'monthly' ? '/mo' : m.pricing_model === 'hourly' ? '/hr' : '';
                    return (
                      <div key={m.id} onClick={() => toggleModule(m.id)}
                        className={cn('flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors', isSelected ? 'bg-accent/50' : 'hover:bg-muted/30')}>
                        <div className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', isSelected ? 'border-brand bg-brand' : 'border-muted-foreground/30')}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
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
                {savingsAmount > 0 && (
                  <p className="mt-1 text-xs text-status-success">
                    Clients save {currencySymbol}{savingsAmount.toLocaleString()} ({Math.round((savingsAmount / individualTotal) * 100)}% off)
                  </p>
                )}
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
