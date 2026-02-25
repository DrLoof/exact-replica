import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceModule {
  id: string;
  name: string;
  shortDesc: string;
  groupName: string;
  pricingModel: string;
  price: number;
  selected: boolean;
}

// Default service modules per group
const defaultModules: Record<string, Omit<ServiceModule, 'id' | 'selected'>[]> = {
  'Brand & Creative': [
    { name: 'Brand Identity System', shortDesc: 'Logo, typography, color palette, and brand guidelines', groupName: 'Brand & Creative', pricingModel: 'fixed', price: 8500 },
    { name: 'Brand Messaging & Voice', shortDesc: 'Brand positioning, messaging framework, and tone of voice', groupName: 'Brand & Creative', pricingModel: 'fixed', price: 4500 },
    { name: 'Graphic Design Retainer', shortDesc: 'Ongoing design support for marketing materials', groupName: 'Brand & Creative', pricingModel: 'monthly', price: 2500 },
  ],
  'Website & Digital': [
    { name: 'Website Design & Development', shortDesc: 'Custom website design, development, and launch', groupName: 'Website & Digital', pricingModel: 'fixed', price: 15000 },
    { name: 'Website Copywriting', shortDesc: 'Conversion-focused copy for all website pages', groupName: 'Website & Digital', pricingModel: 'fixed', price: 3500 },
    { name: 'Website Maintenance', shortDesc: 'Ongoing updates, security, and hosting management', groupName: 'Website & Digital', pricingModel: 'monthly', price: 800 },
  ],
  'Content & Copywriting': [
    { name: 'Content Strategy', shortDesc: 'Audience research, content pillars, and editorial calendar', groupName: 'Content & Copywriting', pricingModel: 'fixed', price: 5000 },
    { name: 'Blog Writing', shortDesc: 'SEO-optimized blog posts with keyword research', groupName: 'Content & Copywriting', pricingModel: 'monthly', price: 2000 },
    { name: 'Email Copywriting', shortDesc: 'Email sequences, campaigns, and newsletter content', groupName: 'Content & Copywriting', pricingModel: 'fixed', price: 3000 },
  ],
  'SEO & Organic Growth': [
    { name: 'SEO Strategy & Implementation', shortDesc: 'Technical SEO, on-page optimization, and link building', groupName: 'SEO & Organic Growth', pricingModel: 'monthly', price: 3500 },
    { name: 'Technical SEO Audit', shortDesc: 'Comprehensive site audit with actionable recommendations', groupName: 'SEO & Organic Growth', pricingModel: 'fixed', price: 2500 },
  ],
  'Paid Advertising': [
    { name: 'Paid Search (PPC)', shortDesc: 'Google Ads management with keyword strategy', groupName: 'Paid Advertising', pricingModel: 'monthly', price: 3000 },
    { name: 'Paid Social Advertising', shortDesc: 'Meta, LinkedIn, and TikTok ad campaigns', groupName: 'Paid Advertising', pricingModel: 'monthly', price: 2500 },
    { name: 'Landing Page Design', shortDesc: 'High-converting landing pages for campaigns', groupName: 'Paid Advertising', pricingModel: 'fixed', price: 3500 },
  ],
  'Social Media': [
    { name: 'Social Media Management', shortDesc: 'Content creation, scheduling, and community management', groupName: 'Social Media', pricingModel: 'monthly', price: 3000 },
    { name: 'Short-Form Video', shortDesc: 'Reels, TikToks, and YouTube Shorts production', groupName: 'Social Media', pricingModel: 'monthly', price: 2500 },
  ],
  'Email Marketing': [
    { name: 'Email Marketing Strategy', shortDesc: 'Full email strategy with segmentation and automation', groupName: 'Email Marketing', pricingModel: 'fixed', price: 4000 },
    { name: 'Email Automation', shortDesc: 'Automated sequences for nurture, onboarding, and retention', groupName: 'Email Marketing', pricingModel: 'fixed', price: 3500 },
  ],
  'Analytics & Data': [
    { name: 'Analytics Setup', shortDesc: 'GA4, Tag Manager, and conversion tracking implementation', groupName: 'Analytics & Data', pricingModel: 'fixed', price: 2500 },
    { name: 'Conversion Rate Optimization', shortDesc: 'A/B testing, user research, and funnel optimization', groupName: 'Analytics & Data', pricingModel: 'monthly', price: 3000 },
  ],
  'Marketing Strategy': [
    { name: 'Marketing Strategy & Consulting', shortDesc: 'Strategic planning, market analysis, and growth roadmap', groupName: 'Marketing Strategy', pricingModel: 'fixed', price: 8000 },
  ],
};

interface Step3ModulesProps {
  selectedGroupNames: string[];
  selectedModules: Record<string, boolean>;
  onChange: (modules: Record<string, boolean>) => void;
}

export function Step3Modules({ selectedGroupNames, selectedModules, onChange }: Step3ModulesProps) {
  const allModules = selectedGroupNames.flatMap((gn) =>
    (defaultModules[gn] || []).map((m, i) => ({ ...m, id: `${gn}-${i}` }))
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
        <p className="mt-2 text-sm text-muted-foreground">These are the services we've set up based on your selections. Edit, remove, or add more.</p>

        <div className="mt-6 space-y-6">
          {selectedGroupNames.map((groupName) => {
            const modules = (defaultModules[groupName] || []).map((m, i) => ({ ...m, id: `${groupName}-${i}` }));
            if (modules.length === 0) return null;

            return (
              <div key={groupName}>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{groupName}</h3>
                <div className="space-y-1.5">
                  {modules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all',
                        selectedModules[mod.id]
                          ? 'border-brand/30 bg-accent'
                          : 'border-border bg-card opacity-60'
                      )}
                    >
                      <div className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        selectedModules[mod.id]
                          ? 'border-brand bg-brand'
                          : 'border-muted-foreground/30'
                      )}>
                        {selectedModules[mod.id] && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{mod.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{mod.shortDesc}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-medium tabular-nums text-foreground">
                        ${mod.price.toLocaleString()}{pricingLabels[mod.pricingModel]}
                      </span>
                    </button>
                  ))}
                </div>
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
            {fixedCount > 0 && <p className="text-xs text-muted-foreground">{fixedCount} Fixed</p>}
            {monthlyCount > 0 && <p className="text-xs text-muted-foreground">{monthlyCount} Monthly</p>}
            {hourlyCount > 0 && <p className="text-xs text-muted-foreground">{hourlyCount} Hourly</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
