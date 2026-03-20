import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Package, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlinePrice } from './InlinePrice';

interface ServiceZoneProps {
  modules: any[];
  groups: any[];
  bundles: any[];
  packages?: any[];
  selectedModuleIds: Set<string>;
  toggleModule: (id: string) => void;
  selectedBundleId: string | null;
  handleBundleSelect: (id: string) => void;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (id: string) => void;
  priceOverrides: Record<string, number>;
  setPriceOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  currencySymbol: string;
  bundleModuleIdSet: Set<string>;
  selectedBundle: any;
  totalStr: string;
  bundleSavings: number;
  addonCount: number;
}

export function ServiceZone({
  modules, groups, bundles, packages = [],
  selectedModuleIds, toggleModule,
  selectedBundleId, handleBundleSelect,
  expandedGroups, toggleGroup,
  priceOverrides, setPriceOverrides,
  currencySymbol, bundleModuleIdSet,
  selectedBundle, totalStr, bundleSavings, addonCount,
}: ServiceZoneProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const groupedModules = useMemo(() =>
    groups.map((g: any) => ({
      ...g,
      modules: modules.filter((m: any) => m.group_id === g.id),
    })).filter((g: any) => g.modules.length > 0),
  [groups, modules]);

  const getModulePrice = (m: any) => priceOverrides[m.id] ?? m.price_fixed ?? m.price_monthly ?? m.price_hourly ?? 0;
  const priceSuffix: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

  const getBundleModuleNames = (bundle: any) => {
    const moduleIds = (bundle.bundle_modules || []).map((bm: any) => bm.module_id);
    return modules
      .filter((m: any) => moduleIds.includes(m.id))
      .map((m: any) => m.name);
  };

  const handlePackageSelect = (pkg: any) => {
    const pkgModuleIds = (pkg.package_modules || []).map((pm: any) => pm.module_id);
    if (selectedPackageId === pkg.id) {
      setSelectedPackageId(null);
      pkgModuleIds.forEach((id: string) => {
        if (selectedModuleIds.has(id)) toggleModule(id);
      });
    } else {
      setSelectedPackageId(pkg.id);
      pkgModuleIds.forEach((id: string) => {
        if (!selectedModuleIds.has(id)) toggleModule(id);
      });
    }
  };

  return (
    <section className="rounded-xl border border-parchment bg-card p-6 shadow-card">
      <p className="mb-4 text-[14px] font-semibold text-foreground">What are you proposing?</p>

      {/* Bundle cards */}
      {bundles.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 label-overline">Bundles <span className="font-normal text-muted-foreground">save your client money</span></p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.map((b: any) => {
              const bundleModuleNames = getBundleModuleNames(b);
              const isSelected = selectedBundleId === b.id;
              const bundleModuleIds = (b.bundle_modules || []).map((bm: any) => bm.module_id);
              const bundleModules = modules.filter((m: any) => bundleModuleIds.includes(m.id));
              const bFixed = bundleModules.filter((m: any) => m.pricing_model === 'fixed').reduce((s: number, m: any) => s + (m.price_fixed || 0), 0);
              const bMonthly = bundleModules.filter((m: any) => m.pricing_model === 'monthly').reduce((s: number, m: any) => s + (m.price_monthly || 0), 0);

              return (
                <button
                  key={b.id}
                  onClick={() => handleBundleSelect(b.id)}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-all',
                    isSelected
                      ? 'border-foreground bg-ivory'
                      : 'border-parchment hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{b.name}</p>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{bundleModuleNames.length} services</p>
                  <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {b.bundle_price ? `${currencySymbol}${b.bundle_price.toLocaleString()}` : 
                        [bFixed > 0 && `${currencySymbol}${bFixed.toLocaleString()}`, bMonthly > 0 && `${currencySymbol}${bMonthly.toLocaleString()}/mo`].filter(Boolean).join(' + ')}
                    </span>
                    {b.savings_amount > 0 && (
                      <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-[10px] font-medium text-status-success">
                        Save {currencySymbol}{b.savings_amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Package cards */}
      {packages.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 label-overline">Your Packages <span className="font-normal text-muted-foreground">quick-select</span></p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg: any) => {
              const pkgModuleIds = (pkg.package_modules || []).map((pm: any) => pm.module_id);
              const pkgModules = pkgModuleIds.map((mid: string) => modules.find((m: any) => m.id === mid)).filter(Boolean);
              const isSelected = selectedPackageId === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-all',
                    isSelected
                      ? 'border-foreground bg-ivory'
                      : 'border-parchment hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-foreground">{pkg.name}</p>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{pkgModules.length} service{pkgModules.length !== 1 ? 's' : ''}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual services */}
      <div className="flex items-center justify-between mb-3">
        <p className="label-overline">Select Services</p>
        <span className="text-[11px] text-muted-foreground">{modules.length} available</span>
      </div>
      <div className="space-y-2">
        {groupedModules.map((group: any) => {
          const isOpen = expandedGroups[group.id] !== false;
          const selectedInGroup = group.modules.filter((m: any) => selectedModuleIds.has(m.id)).length;
          return (
            <div key={group.id} className="rounded-xl border border-parchment overflow-hidden">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between px-4 py-2.5 border-b border-parchment hover:bg-muted/30 transition-colors"
              >
                <span className="text-[14px] font-semibold text-foreground">{group.name}</span>
                <div className="flex items-center gap-2">
                  {selectedInGroup > 0 && (
                    <span className="rounded-full bg-status-success/10 px-2 py-0.5 text-[11px] font-medium text-status-success">{selectedInGroup}</span>
                  )}
                  <span className="rounded-full bg-parchment-soft px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{group.modules.length}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              {isOpen && (
                <div className="divide-y divide-parchment">
                  {group.modules.map((mod: any) => {
                    const isSelected = selectedModuleIds.has(mod.id);
                    const isBundled = bundleModuleIdSet.has(mod.id);
                    const price = getModulePrice(mod);
                    const isOverridden = priceOverrides[mod.id] !== undefined;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={cn(
                          'group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
                          isSelected ? 'bg-ivory' : 'hover:bg-muted/30'
                        )}
                      >
                        <div className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          isSelected ? 'border-accent-foreground bg-accent-foreground' : 'border-muted-foreground/30'
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] text-foreground">{mod.name}</p>
                            {isBundled && isSelected && (
                              <span className="rounded px-1 py-0.5 text-[9px] font-medium bg-foreground/5 text-muted-foreground">BUNDLED</span>
                            )}
                          </div>
                          {mod.short_description && (
                            <p className="text-[12px] text-muted-foreground mt-0.5">{mod.short_description}</p>
                          )}
                        </div>
                        <span className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                          mod.pricing_model === 'fixed' ? 'bg-parchment-soft text-muted-foreground' :
                          mod.pricing_model === 'monthly' ? 'bg-status-success/10 text-status-success' :
                          'bg-status-warning/10 text-status-warning'
                        )}>
                          {mod.pricing_model}
                        </span>
                        <InlinePrice
                          value={price}
                          onChange={(newPrice) => {
                            setPriceOverrides(prev => ({ ...prev, [mod.id]: newPrice }));
                          }}
                          currencySymbol={currencySymbol}
                          suffix={priceSuffix[mod.pricing_model] || ''}
                          isOverridden={isOverridden}
                          onReset={() => {
                            setPriceOverrides(prev => {
                              const next = { ...prev };
                              delete next[mod.id];
                              return next;
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Running total */}
      {selectedModuleIds.size > 0 && (
        <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selectedBundle
                ? `${selectedBundle.name}${addonCount > 0 ? ` + ${addonCount} add-on${addonCount !== 1 ? 's' : ''}` : ''}`
                : `${selectedModuleIds.size} service${selectedModuleIds.size !== 1 ? 's' : ''} selected`}
            </span>
            <div className="flex items-center gap-2">
              {bundleSavings > 0 && (
                <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-[10px] font-medium text-status-success">
                  Save {currencySymbol}{bundleSavings.toLocaleString()}
                </span>
              )}
              <span className="text-sm font-bold tabular-nums text-foreground">{totalStr}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
