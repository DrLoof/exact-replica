import { useState } from 'react';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';

export interface ModuleData {
  name: string;
  shortDesc: string;
  pricingModel: string;
  price: number;
  selected: boolean;
  deliverables?: string[];
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [editingDeliverable, setEditingDeliverable] = useState<{ moduleId: string; index: number } | null>(null);
  const [deliverableDraft, setDeliverableDraft] = useState('');

  const allModules = selectedGroupNames.flatMap((gn) =>
    getDefaultModulesForGroup(gn).map((m, i) => ({
      ...m,
      ...moduleOverrides[`${gn}-${i}`],
      id: `${gn}-${i}`,
      groupName: gn,
    }))
  );

  if (Object.keys(selectedModules).length === 0 && allModules.length > 0) {
    const init: Record<string, boolean> = {};
    allModules.forEach((m) => { init[m.id] = true; });
    onChange(init);
  }

  const toggleModule = (id: string) => {
    onChange({ ...selectedModules, [id]: !selectedModules[id] });
  };

  const toggleModuleExpand = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateOverride = (id: string, field: string, value: string | number | string[]) => {
    onOverride({
      ...moduleOverrides,
      [id]: { ...moduleOverrides[id], [field]: value },
    });
  };

  const getDeliverables = (mod: any): string[] => {
    return moduleOverrides[mod.id]?.deliverables ?? mod.deliverables ?? [];
  };

  const updateDeliverable = (moduleId: string, index: number, value: string) => {
    const current = getDeliverables(allModules.find(m => m.id === moduleId)!);
    const updated = [...current];
    updated[index] = value;
    updateOverride(moduleId, 'deliverables', updated);
  };

  const removeDeliverable = (moduleId: string, index: number) => {
    const current = getDeliverables(allModules.find(m => m.id === moduleId)!);
    updateOverride(moduleId, 'deliverables', current.filter((_, i) => i !== index));
  };

  const addDeliverable = (moduleId: string) => {
    const current = getDeliverables(allModules.find(m => m.id === moduleId)!);
    updateOverride(moduleId, 'deliverables', [...current, 'New deliverable']);
    setEditingDeliverable({ moduleId, index: current.length });
    setDeliverableDraft('New deliverable');
  };

  const commitPrice = (modId: string) => {
    const num = parseFloat(priceDraft);
    if (!isNaN(num) && num >= 0) updateOverride(modId, 'price', num);
    setEditingPrice(null);
  };

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;
  const pricingLabels: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your Services</p>
        <p className="text-sm text-muted-foreground">{selectedCount} selected</p>
      </div>

      <div className="mt-4 space-y-6">
        {selectedGroupNames.map((groupName) => {
          const modules = getDefaultModulesForGroup(groupName).map((m, i) => ({
            ...m,
            ...moduleOverrides[`${groupName}-${i}`],
            id: `${groupName}-${i}`,
          }));
          if (modules.length === 0) return null;

          return (
            <div key={groupName}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {groupName}
              </p>

              <div className="space-y-0 divide-y divide-border">
                {modules.map((mod) => {
                  const isExpanded = expandedModules.has(mod.id);
                  const deliverables = getDeliverables(mod);

                  return (
                    <div key={mod.id} className="py-3 first:pt-0 last:pb-0">
                      {/* Service row */}
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

                        <button
                          className="flex-1 min-w-0 text-left flex items-center gap-1.5"
                          onClick={() => toggleModuleExpand(mod.id)}
                        >
                          <span className={cn(
                            'text-sm font-medium',
                            selectedModules[mod.id] ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {mod.name}
                          </span>
                          <ChevronDown className={cn(
                            'h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform',
                            isExpanded && 'rotate-180'
                          )} />
                        </button>

                        {/* Clickable price */}
                        {editingPrice === mod.id ? (
                          <input
                            autoFocus
                            type="number"
                            value={priceDraft}
                            onChange={(e) => setPriceDraft(e.target.value)}
                            onBlur={() => commitPrice(mod.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitPrice(mod.id);
                              if (e.key === 'Escape') setEditingPrice(null);
                            }}
                            className="w-24 shrink-0 rounded border border-brand bg-background px-2 py-0.5 text-right text-sm font-medium tabular-nums text-foreground focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPriceDraft(String(mod.price));
                              setEditingPrice(mod.id);
                            }}
                            className="shrink-0 text-sm font-medium tabular-nums text-foreground hover:text-foreground/60 transition-colors cursor-text"
                            title="Click to edit price"
                          >
                            {currencySymbol}{mod.price.toLocaleString()}{pricingLabels[mod.pricingModel]}
                          </button>
                        )}
                      </div>

                      {/* Expanded deliverables */}
                      {isExpanded && (
                        <div className="mt-2 ml-8 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Deliverables</p>
                          {deliverables.map((d, idx) => {
                            const isEditingThis = editingDeliverable?.moduleId === mod.id && editingDeliverable?.index === idx;
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
                                      if (deliverableDraft.trim()) updateDeliverable(mod.id, idx, deliverableDraft.trim());
                                      setEditingDeliverable(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (deliverableDraft.trim()) updateDeliverable(mod.id, idx, deliverableDraft.trim());
                                        setEditingDeliverable(null);
                                      }
                                      if (e.key === 'Escape') setEditingDeliverable(null);
                                    }}
                                    className="flex-1 rounded border border-brand bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                                  />
                                ) : (
                                  <span
                                    className="flex-1 text-xs text-muted-foreground cursor-text hover:text-foreground transition-colors"
                                    onClick={() => {
                                      setEditingDeliverable({ moduleId: mod.id, index: idx });
                                      setDeliverableDraft(d);
                                    }}
                                  >
                                    {d}
                                  </span>
                                )}
                                <button
                                  onClick={() => removeDeliverable(mod.id, idx)}
                                  className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-destructive transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => addDeliverable(mod.id)}
                            className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            Add deliverable
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
