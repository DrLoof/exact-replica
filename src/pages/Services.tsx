import { AppShell } from '@/components/layout/AppShell';
import { Plus, Search, ChevronDown, ChevronRight, MoreHorizontal, Layers } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { useServiceModules, useServiceGroups } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';

const pricingLabels: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

export default function Services() {
  const { agency } = useAuth();
  const { data: modules = [], isLoading: loadingModules } = useServiceModules();
  const { data: groups = [], isLoading: loadingGroups } = useServiceGroups();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const currencySymbol = agency?.currency_symbol || '$';

  // Group modules by service_groups
  const groupedModules = groups
    .map((g: any) => ({
      ...g,
      modules: modules.filter((m: any) => m.group_id === g.id && (
        !search || m.name?.toLowerCase().includes(search.toLowerCase())
      )),
    }))
    .filter((g: any) => g.modules.length > 0);

  // Default expand all groups
  const isExpanded = (id: string) => expanded[id] !== false;
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !isExpanded(id) }));

  const isLoading = loadingModules || loadingGroups;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Services</h1>
        <button className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
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
            const activeCount = group.modules.length;

            return (
              <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => toggle(group.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <IconComp className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">{group.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{activeCount} active</span>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    {group.modules.map((mod: any) => (
                      <div
                        key={mod.id}
                        className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{mod.name}</p>
                            {mod.service_type === 'addon' && (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ADD-ON</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{mod.short_description}</p>
                        </div>
                        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                          {currencySymbol}{(mod.price_fixed || mod.price_monthly || mod.price_hourly || 0).toLocaleString()}{pricingLabels[mod.pricing_model] || ''}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {mod.pricing_model}
                        </span>
                        <button className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
