import { useState } from 'react';
import { Check, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';

export interface ModuleData {
  name: string;
  shortDesc: string;
  pricingModel: string;
  price: number;
  selected: boolean;
}

interface Step3ModulesProps {
  selectedGroupNames: string[];
  selectedModules: Record<string, boolean>;
  moduleOverrides: Record<string, Partial<ModuleData>>;
  currencySymbol: string;
  onChange: (modules: Record<string, boolean>) => void;
  onOverride: (overrides: Record<string, Partial<ModuleData>>) => void;
}

export function Step3Modules({ selectedGroupNames, selectedModules, moduleOverrides, currencySymbol, onChange, onOverride }: Step3ModulesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(selectedGroupNames[0] || null);

  const allModules = selectedGroupNames.flatMap((gn) =>
    getDefaultModulesForGroup(gn).map((m, i) => ({
      ...m,
      ...moduleOverrides[`${gn}-${i}`],
      id: `${gn}-${i}`,
      groupName: gn,
    }))
  );

  // Initialize all as selected if not set
  if (Object.keys(selectedModules).length === 0 && allModules.length > 0) {
    const init: Record<string, boolean> = {};
    allModules.forEach((m) => { init[m.id] = true; });
    onChange(init);
  }

  const toggleModule = (id: string) => {
    onChange({ ...selectedModules, [id]: !selectedModules[id] });
  };

  const updateOverride = (id: string, field: string, value: string | number) => {
    onOverride({
      ...moduleOverrides,
      [id]: { ...moduleOverrides[id], [field]: value },
    });
  };

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;
  const pricingModels = allModules.filter((m) => selectedModules[m.id]);
  const fixedCount = pricingModels.filter((m) => m.pricingModel === 'fixed').length;
  const monthlyCount = pricingModels.filter((m) => m.pricingModel === 'monthly').length;
  const hourlyCount = pricingModels.filter((m) => m.pricingModel === 'hourly').length;

  const pricingLabels: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Customize your services</h1>
        <p className="mt-2 text-sm text-muted-foreground">Toggle, edit names, descriptions, and prices. Click the pencil to edit a service.</p>

        <div className="mt-6 space-y-4">
          {selectedGroupNames.map((groupName) => {
            const modules = getDefaultModulesForGroup(groupName).map((m, i) => ({
              ...m,
              ...moduleOverrides[`${groupName}-${i}`],
              id: `${groupName}-${i}`,
            }));
            if (modules.length === 0) return null;
            const isExpanded = expandedGroup === groupName;

            return (
              <div key={groupName} className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                  className="flex w-full items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <h3 className="text-sm font-semibold text-foreground">{groupName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {modules.filter(m => selectedModules[m.id]).length}/{modules.length}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-2 space-y-1.5">
                    {modules.map((mod) => {
                      const isEditing = editingId === mod.id;

                      return (
                        <div
                          key={mod.id}
                          className={cn(
                            'rounded-lg border px-4 py-3 transition-all',
                            selectedModules[mod.id]
                              ? 'border-brand/30 bg-accent'
                              : 'border-border bg-card opacity-60'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleModule(mod.id)}
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                                selectedModules[mod.id]
                                  ? 'border-brand bg-brand'
                                  : 'border-muted-foreground/30'
                              )}
                            >
                              {selectedModules[mod.id] && <Check className="h-3 w-3 text-primary-foreground" />}
                            </button>

                            {isEditing ? (
                              <div className="flex-1 min-w-0 space-y-2">
                                <input
                                  type="text"
                                  value={mod.name}
                                  onChange={(e) => updateOverride(mod.id, 'name', e.target.value)}
                                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-medium text-foreground focus:border-brand focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={mod.shortDesc}
                                  onChange={(e) => updateOverride(mod.id, 'shortDesc', e.target.value)}
                                  className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground focus:border-brand focus:outline-none"
                                />
                                <div className="flex gap-2">
                                  <select
                                    value={mod.pricingModel}
                                    onChange={(e) => updateOverride(mod.id, 'pricingModel', e.target.value)}
                                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-brand focus:outline-none"
                                  >
                                    <option value="fixed">Fixed</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="hourly">Hourly</option>
                                  </select>
                                  <input
                                    type="number"
                                    value={mod.price}
                                    onChange={(e) => updateOverride(mod.id, 'price', Number(e.target.value))}
                                    className="w-28 rounded border border-border bg-background px-2 py-1 text-xs text-foreground tabular-nums focus:border-brand focus:outline-none"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{mod.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{mod.shortDesc}</p>
                              </div>
                            )}

                            {!isEditing && (
                              <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-medium tabular-nums text-foreground">
                                {currencySymbol}{mod.price.toLocaleString()}{pricingLabels[mod.pricingModel]}
                              </span>
                            )}

                            <button
                              onClick={() => setEditingId(isEditing ? null : mod.id)}
                              className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Panel */}
      <div className="hidden lg:block">
        <div className="sticky top-8 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Summary</h3>
          <p className="mt-3 text-2xl font-bold text-foreground tabular-nums">{selectedCount}</p>
          <p className="text-xs text-muted-foreground">services selected</p>

          <div className="mt-4 space-y-1.5 border-t border-border pt-4">
            {fixedCount > 0 && <p className="text-xs text-muted-foreground">{fixedCount} Fixed-price</p>}
            {monthlyCount > 0 && <p className="text-xs text-muted-foreground">{monthlyCount} Monthly retainer</p>}
            {hourlyCount > 0 && <p className="text-xs text-muted-foreground">{hourlyCount} Hourly</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
