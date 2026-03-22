import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Lightbulb, Layers, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { usePackages, useServiceModules, useServiceGroups, useProposals } from '@/hooks/useAgencyData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

export default function Packages() {
  const navigate = useNavigate();
  const { agency } = useAuth();
  const { data: packages = [], isLoading } = usePackages();
  const { data: modules = [] } = useServiceModules();
  const { data: groups = [] } = useServiceGroups();
  const { data: proposals = [] } = useProposals();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

  const currencySymbol = agency?.currency_symbol || '$';

  const groupedModules = useMemo(() =>
    groups.map((g: any) => ({
      ...g,
      modules: modules.filter((m: any) => m.group_id === g.id),
    })).filter((g: any) => g.modules.length > 0),
  [groups, modules]);

  // Suggested packages from proposal history
  const suggestedPackages = useMemo(() => {
    if (proposals.length < 2) return [];
    // We need proposal_services data — fetch is async, so we'll skip for now
    // This is computed from proposal_services junction which isn't loaded here
    // For simplicity, return empty and we can enhance later
    return [];
  }, [proposals, packages]);

  const getModuleById = (id: string) => modules.find((m: any) => m.id === id);

  const getPackageTotal = (pkg: any) => {
    const moduleIds = (pkg.package_modules || []).map((pm: any) => pm.module_id);
    let fixed = 0, monthly = 0;
    moduleIds.forEach((mid: string) => {
      const m = getModuleById(mid);
      if (!m) return;
      if (m.pricing_model === 'fixed') fixed += m.price_fixed || 0;
      else if (m.pricing_model === 'monthly') monthly += m.price_monthly || 0;
      else if (m.pricing_model === 'hourly') fixed += (m.price_hourly || 0) * (m.estimated_hours || 0);
    });
    return { fixed, monthly };
  };

  const getSelectedTotal = () => {
    let fixed = 0, monthly = 0;
    selectedModules.forEach((mid) => {
      const m = getModuleById(mid);
      if (!m) return;
      if (m.pricing_model === 'fixed') fixed += m.price_fixed || 0;
      else if (m.pricing_model === 'monthly') monthly += m.price_monthly || 0;
    });
    return { fixed, monthly };
  };

  const formatPrice = (f: number, m: number) => {
    const parts = [];
    if (f > 0) parts.push(`${currencySymbol}${f.toLocaleString()}`);
    if (m > 0) parts.push(`${currencySymbol}${m.toLocaleString()}/mo`);
    return parts.join(' + ') || `${currencySymbol}0`;
  };

  const openCreate = () => {
    setEditingPackage(null);
    setName('');
    setDescription('');
    setSelectedModules(new Set());
    setShowCreate(true);
  };

  const openEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setDescription(pkg.description || '');
    setSelectedModules(new Set((pkg.package_modules || []).map((pm: any) => pm.module_id)));
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!agency?.id || !name.trim() || selectedModules.size < 2) return;

    try {
      if (editingPackage) {
        // Update package
        const { error } = await supabase
          .from('packages')
          .update({ name: name.trim(), description: description.trim() || null, updated_at: new Date().toISOString() })
          .eq('id', editingPackage.id);
        if (error) throw error;

        // Replace modules
        await supabase.from('package_modules').delete().eq('package_id', editingPackage.id);
        const moduleRows = Array.from(selectedModules).map((mid, i) => ({
          package_id: editingPackage.id,
          module_id: mid,
          display_order: i,
        }));
        if (moduleRows.length > 0) {
          const { error: modErr } = await supabase.from('package_modules').insert(moduleRows);
          if (modErr) throw modErr;
        }
        toast.success('Package updated');
      } else {
        // Create package
        const { data: newPkg, error } = await supabase
          .from('packages')
          .insert({ agency_id: agency.id, name: name.trim(), description: description.trim() || null })
          .select('id')
          .single();
        if (error) throw error;

        const moduleRows = Array.from(selectedModules).map((mid, i) => ({
          package_id: newPkg.id,
          module_id: mid,
          display_order: i,
        }));
        if (moduleRows.length > 0) {
          const { error: modErr } = await supabase.from('package_modules').insert(moduleRows);
          if (modErr) throw modErr;
        }
        toast.success('Package created');
      }

      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save package');
    }
  };

  const handleDuplicate = async (pkg: any) => {
    if (!agency?.id) return;
    try {
      const { data: newPkg, error } = await supabase
        .from('packages')
        .insert({ agency_id: agency.id, name: `${pkg.name} (copy)`, description: pkg.description })
        .select('id')
        .single();
      if (error) throw error;

      const moduleIds = (pkg.package_modules || []).map((pm: any) => pm.module_id);
      if (moduleIds.length > 0) {
        await supabase.from('package_modules').insert(
          moduleIds.map((mid: string, i: number) => ({ package_id: newPkg.id, module_id: mid, display_order: i }))
        );
      }
      toast.success('Package duplicated');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (pkg: any) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('packages').delete().eq('id', pkg.id);
      if (error) throw error;
      toast.success('Package deleted');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleModule = (id: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasInactiveModules = (pkg: any) => {
    const moduleIds = (pkg.package_modules || []).map((pm: any) => pm.module_id);
    return moduleIds.some((mid: string) => !getModuleById(mid));
  };

  const selectedTotal = getSelectedTotal();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-foreground">Packages</h1>
            {packages.length > 0 && (
              <span className="text-[13px]" style={{ color: '#8A7F72' }}>
                {packages.length} package{packages.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Package
          </Button>
        </div>

        {/* Empty state */}
        {!isLoading && packages.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment bg-card py-16 px-8 text-center shadow-card">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#F4F1EB' }}>
              <Layers className="h-6 w-6" style={{ color: '#8A7F72' }} />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">No packages yet</p>
            <p className="max-w-md text-sm" style={{ color: '#8A7F72' }}>
              Save your most common service combinations as packages to speed up proposal creation. Unlike bundles, packages don't include a discount — they're just a faster way to select services.
            </p>
            <Button variant="outline" onClick={openCreate} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Create your first package
            </Button>
          </div>
        )}

        {/* Package cards */}
        {packages.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg: any) => {
              const moduleIds = (pkg.package_modules || []).map((pm: any) => pm.module_id);
              const pkgModules = moduleIds.map((mid: string) => getModuleById(mid)).filter(Boolean);
              const total = getPackageTotal(pkg);
              const inactive = hasInactiveModules(pkg);

              return (
                <div
                  key={pkg.id}
                  onClick={() => navigate(`/proposals/new?package=${pkg.id}`)}
                  className="group relative cursor-pointer rounded-xl bg-card p-5 shadow-card transition-shadow hover:shadow-md"
                  style={{ border: '1px solid transparent' }}
                >
                  {/* More menu */}
                  <div className="absolute right-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-parchment-soft">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => openEdit(pkg)}>Edit services</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/proposals/new?package=${pkg.id}`)}>Create proposal with this package</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(pkg)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(pkg)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <p className="text-[16px] font-semibold pr-8" style={{ color: '#2A2118' }}>{pkg.name}</p>
                  {pkg.description && (
                    <p className="mt-1 text-[13px]" style={{ color: '#8A7F72' }}>{pkg.description}</p>
                  )}

                  {/* Service pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pkgModules.map((m: any) => (
                      <span key={m.id} className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: '#F4F1EB', color: '#4A3F32' }}>
                        {m.name}
                      </span>
                    ))}
                    {inactive && (
                      <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-status-warning/10 text-status-warning">
                        <AlertTriangle className="h-3 w-3" /> Inactive service
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-3" style={{ borderTop: '1px solid #EEEAE3' }} />

                  {/* Stats */}
                  <p className="text-[13px]" style={{ color: '#4A3F32' }}>
                    {pkgModules.length} service{pkgModules.length !== 1 ? 's' : ''} · {formatPrice(total.fixed, total.monthly)}
                  </p>
                  {pkg.usage_count > 0 && (
                    <p className="mt-0.5 text-[11px]" style={{ color: '#B8B0A5' }}>
                      Used {pkg.usage_count} time{pkg.usage_count !== 1 ? 's' : ''}
                      {pkg.last_used_at && ` · Last used ${new Date(pkg.last_used_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., SEO & Content Starter, Full Website Project"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Our go-to combo for new clients"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div style={{ borderTop: '1px solid #EEEAE3' }} className="pt-4">
                <p className="label-overline mb-3">Select Services</p>
                <div className="space-y-3">
                  {groupedModules.map((group: any) => (
                    <div key={group.id}>
                      <p className="text-[13px] font-semibold text-foreground mb-1.5">{group.name}</p>
                      <div className="space-y-1">
                        {group.modules.map((mod: any) => {
                          const checked = selectedModules.has(mod.id);
                          const price = mod.pricing_model === 'fixed' ? mod.price_fixed : mod.pricing_model === 'monthly' ? mod.price_monthly : mod.price_hourly;
                          const suffix = mod.pricing_model === 'monthly' ? '/mo' : mod.pricing_model === 'hourly' ? '/hr' : '';
                          return (
                            <label key={mod.id} className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                              <Checkbox checked={checked} onCheckedChange={() => toggleModule(mod.id)} />
                              <span className="flex-1 text-[13px] text-foreground">{mod.name}</span>
                              <span className="text-[12px] tabular-nums text-muted-foreground">
                                {currencySymbol}{(price || 0).toLocaleString()}{suffix}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Running total */}
              <div style={{ borderTop: '1px solid #EEEAE3' }} className="pt-3">
                <p className="text-[13px] text-foreground">
                  {selectedModules.size} service{selectedModules.size !== 1 ? 's' : ''} · {formatPrice(selectedTotal.fixed, selectedTotal.monthly)}
                </p>
                {selectedModules.size > 0 && selectedModules.size < 2 && (
                  <p className="text-[11px] text-status-warning mt-1">Select at least 2 services</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || selectedModules.size < 2}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {editingPackage ? 'Save Changes' : 'Save Package'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
