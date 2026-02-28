import { useState, useRef, useMemo } from 'react';
import { Check, Pencil, X, Plus, Upload, Loader2, Quote, Target, BarChart3, Users, Trophy, Zap, Layers, Package, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDefaultModulesForGroup } from '@/lib/defaultModules';
import { defaultBundles, findDefaultModule, calculateBundlePricing, formatBundlePrice } from '@/lib/defaultBundles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const iconMap: Record<string, any> = { Target, BarChart3, Users, Trophy, Zap, Layers };

interface ReviewScreenProps {
  agencyIdentity: any;
  onAgencyChange: (data: any) => void;
  selectedModuleKeys: Set<string>;
  onModuleKeysChange: (keys: Set<string>) => void;
  testimonials: any[];
  onTestimonialsChange: (t: any[]) => void;
  differentiators: any[];
  onDifferentiatorsChange: (d: any[]) => void;
  diffIntro: string;
  onDiffIntroChange: (s: string) => void;
  groupNameMap: Record<string, string>;
  onFinish: () => void;
  saving: boolean;
  addedBundles?: Set<string>;
  onAddBundle?: (bundleName: string) => void;
}

export function ReviewScreen({
  agencyIdentity,
  onAgencyChange,
  selectedModuleKeys,
  onModuleKeysChange,
  testimonials,
  onTestimonialsChange,
  differentiators,
  onDifferentiatorsChange,
  diffIntro,
  onDiffIntroChange,
  groupNameMap,
  onFinish,
  saving,
  addedBundles = new Set(),
  onAddBundle,
}: ReviewScreenProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All available services grouped
  const allGroupNames = Object.values(groupNameMap);
  const allModules = allGroupNames.flatMap(gn =>
    getDefaultModulesForGroup(gn).map((m, i) => ({
      ...m,
      key: `${gn}-${i}`,
      groupName: gn,
    }))
  );

  const selectedModules = allModules.filter(m => selectedModuleKeys.has(m.key));
  const unselectedModules = allModules.filter(m => !selectedModuleKeys.has(m.key));

  const toggleModule = (key: string) => {
    const next = new Set(selectedModuleKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onModuleKeysChange(next);
  };

  // Suggested bundles based on selected services
  const selectedModuleNames = new Set(selectedModules.map(m => m.name));
  const suggestedBundles = useMemo(() => {
    const scored = defaultBundles.map(b => {
      const matchCount = b.serviceNames.filter(n => selectedModuleNames.has(n)).length;
      const missingCount = b.serviceNames.length - matchCount;
      return { ...b, matchCount, missingCount };
    });
    const full = scored.filter(b => b.missingCount === 0).sort((a, b) => b.serviceNames.length - a.serviceNames.length);
    const partial = scored.filter(b => b.missingCount === 1 && b.matchCount >= 2).sort((a, b) => b.matchCount - a.matchCount);
    return [...full, ...partial].slice(0, 3);
  }, [selectedModuleNames.size]);

  const pricingLabel: Record<string, string> = { fixed: '', monthly: '/mo', hourly: '/hr' };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PNG, SVG, or WebP file');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
    onAgencyChange({ ...agencyIdentity, logo_url: urlData.publicUrl });
    setUploading(false);
  };

  const removeTestimonial = (idx: number) => {
    onTestimonialsChange(testimonials.filter((_, i) => i !== idx));
  };

  const addTestimonial = () => {
    onTestimonialsChange([...testimonials, { quote: '', client_name: '', client_title: '', client_company: '', metric_value: '', metric_label: '' }]);
  };

  const updateTestimonial = (idx: number, field: string, value: string) => {
    const updated = [...testimonials];
    updated[idx] = { ...updated[idx], [field]: value };
    onTestimonialsChange(updated);
  };

  return (
    <div className="mx-auto max-w-[680px] px-6 py-10">
      {/* Section: Agency */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Your Agency</h2>
          <button
            onClick={() => setEditingSection(editingSection === 'agency' ? null : 'agency')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {editingSection === 'agency' ? 'Done' : 'Edit'}
          </button>
        </div>

        {editingSection === 'agency' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={agencyIdentity.name || ''}
              onChange={e => onAgencyChange({ ...agencyIdentity, name: e.target.value })}
              placeholder="Agency Name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input type="email" value={agencyIdentity.email || ''} onChange={e => onAgencyChange({ ...agencyIdentity, email: e.target.value })} placeholder="Email" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
              <input type="tel" value={agencyIdentity.phone || ''} onChange={e => onAgencyChange({ ...agencyIdentity, phone: e.target.value })} placeholder="Phone" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            </div>
            <input type="text" value={agencyIdentity.tagline || ''} onChange={e => onAgencyChange({ ...agencyIdentity, tagline: e.target.value })} placeholder="Tagline" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Brand Color</label>
              <input type="color" value={agencyIdentity.brand_color || '#E8825C'} onChange={e => onAgencyChange({ ...agencyIdentity, brand_color: e.target.value })} className="h-8 w-8 cursor-pointer rounded border border-border" />
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".png,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {agencyIdentity.logo_url ? 'Replace logo' : 'Upload logo'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {agencyIdentity.logo_url ? (
              <div className="h-12 w-12 rounded-xl border border-border bg-muted/50 p-1.5 shrink-0">
                <img src={agencyIdentity.logo_url} alt="" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground shrink-0" style={{ backgroundColor: agencyIdentity.brand_color || '#E8825C' }}>
                {(agencyIdentity.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-foreground truncate">{agencyIdentity.name || 'Your Agency'}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {agencyIdentity.brand_color && (
                  <>
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: agencyIdentity.brand_color }} />
                    <span>{agencyIdentity.brand_color}</span>
                    <span>·</span>
                  </>
                )}
                {agencyIdentity.email && <span>{agencyIdentity.email}</span>}
                {agencyIdentity.phone && <><span>·</span><span>{agencyIdentity.phone}</span></>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section: Services */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Your Services</h2>
          <span className="text-xs text-muted-foreground">{selectedModuleKeys.size} selected</span>
        </div>

        <div className="space-y-1">
          {selectedModules.map(mod => (
            <div key={mod.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleModule(mod.key)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-brand bg-brand">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </button>
                <span className="text-sm text-foreground">{mod.name}</span>
              </div>
              <span className="text-sm font-medium tabular-nums text-foreground">
                ${mod.price.toLocaleString()}{pricingLabel[mod.pricingModel]}
              </span>
            </div>
          ))}

          {!showAllServices && unselectedModules.length > 0 && (
            <button
              onClick={() => setShowAllServices(true)}
              className="mt-2 text-xs text-brand hover:text-brand-hover font-medium"
            >
              + {unselectedModules.length} more available
            </button>
          )}

          {showAllServices && unselectedModules.map(mod => (
            <div key={mod.key} className="flex items-center justify-between py-2 border-b border-border last:border-0 opacity-50">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleModule(mod.key)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-muted-foreground/30">
                </button>
                <span className="text-sm text-muted-foreground">{mod.name}</span>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                ${mod.price.toLocaleString()}{pricingLabel[mod.pricingModel]}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Each service has full deliverables, timelines, and scope pre-filled. Customize in Settings later.
        </p>
      </section>

      {/* Section: Testimonials */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Testimonials</h2>
          <span className="text-xs text-muted-foreground">
            {testimonials.length > 0 ? `${testimonials.length} found from website` : 'None found'}
          </span>
        </div>

        {testimonials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No testimonials found on your website. Add them here or in Settings later.</p>
        ) : (
          <div className="space-y-4">
            {testimonials.map((t, idx) => (
              <div key={idx} className="relative rounded-xl bg-background p-4">
                <button onClick={() => removeTestimonial(idx)} className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
                <Quote className="h-4 w-4 text-brand mb-2" />
                <p className="text-sm text-foreground italic leading-relaxed">"{t.quote}"</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  — {t.client_name}{t.client_title ? `, ${t.client_title}` : ''}{t.client_company ? `, ${t.client_company}` : ''}
                </p>
                {t.metric_value && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                    {t.metric_value} {t.metric_label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={addTestimonial} className="mt-4 flex items-center gap-2 text-xs text-brand hover:text-brand-hover font-medium">
          <Plus className="h-3.5 w-3.5" /> Add testimonial
        </button>
      </section>

      {/* Section: Why Choose You */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-overline">Why Choose You</h2>
          <span className="text-xs text-muted-foreground">Generated from your site</span>
        </div>

        {diffIntro && (
          <p className="text-sm text-foreground leading-relaxed mb-4">"{diffIntro}"</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {differentiators.map((d, i) => {
            const Icon = iconMap[d.icon] || Target;
            return (
              <div key={i} className="rounded-xl border border-border bg-background p-3">
                <p className="font-display text-lg font-bold text-foreground">{d.stat_value}</p>
                <p className="text-[10px] text-muted-foreground">{d.stat_label}</p>
                <p className="mt-1 text-xs font-medium text-foreground">{d.title}</p>
                {d.source === 'generated' && (
                  <span className="mt-1 inline-block text-[9px] text-muted-foreground/60 italic">AI-generated</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          These appear in your proposals. Edit anytime in Settings.
        </p>
      </section>

      {/* CTA */}
      <div className="mt-10 text-center pb-10">
        <button
          onClick={onFinish}
          disabled={saving}
          className="rounded-xl bg-brand px-8 py-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? 'Setting up...' : 'Looks good — create my first proposal'}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          Everything can be edited later in Settings
        </p>
      </div>
    </div>
  );
}
