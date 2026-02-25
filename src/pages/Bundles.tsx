import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Plus, Package, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { useBundles, useServiceModules } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Bundles() {
  const { agency } = useAuth();
  const { data: bundles = [], isLoading } = useBundles();
  const { data: modules = [] } = useServiceModules();
  const queryClient = useQueryClient();
  const currencySymbol = agency?.currency_symbol || '$';

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bundle?')) return;
    await supabase.from('bundle_modules').delete().eq('bundle_id', id);
    await supabase.from('bundles').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['bundles'] });
    toast.success('Bundle deleted');
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bundles</h1>
        <button className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          <Plus className="h-4 w-4" />
          Create Bundle
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-brand/20 bg-accent p-4">
        <p className="text-sm text-accent-foreground">
          💡 <span className="font-medium">Pro tip:</span> Agencies using bundles close 23% larger deals on average. Package your services for bigger wins.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : bundles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No bundles yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first bundle to offer packaged services</p>
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
                  <button onClick={() => handleDelete(bundle.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
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
    </AppShell>
  );
}
