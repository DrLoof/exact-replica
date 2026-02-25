import { AppShell } from '@/components/layout/AppShell';
import { Plus, Search, ChevronDown, ChevronRight, MoreHorizontal, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface ServiceModule {
  id: string;
  name: string;
  shortDesc: string;
  pricingModel: 'fixed' | 'monthly' | 'hourly';
  price: number;
  isActive: boolean;
}

interface ServiceGroupData {
  id: string;
  name: string;
  icon: string;
  modules: ServiceModule[];
}

const serviceGroups: ServiceGroupData[] = [
  {
    id: '1', name: 'Brand & Creative', icon: 'Palette',
    modules: [
      { id: '1', name: 'Brand Identity System', shortDesc: 'Logo, typography, color palette, and brand guidelines', pricingModel: 'fixed', price: 8500, isActive: true },
      { id: '2', name: 'Brand Messaging & Voice', shortDesc: 'Brand positioning, messaging framework, and tone of voice', pricingModel: 'fixed', price: 4500, isActive: true },
      { id: '3', name: 'Graphic Design Retainer', shortDesc: 'Ongoing design support for marketing materials', pricingModel: 'monthly', price: 2500, isActive: true },
    ],
  },
  {
    id: '2', name: 'Website & Digital', icon: 'Globe',
    modules: [
      { id: '4', name: 'Website Design & Development', shortDesc: 'Custom website design, development, and launch', pricingModel: 'fixed', price: 15000, isActive: true },
      { id: '5', name: 'Website Copywriting', shortDesc: 'Conversion-focused copy for all website pages', pricingModel: 'fixed', price: 3500, isActive: true },
      { id: '6', name: 'Website Maintenance', shortDesc: 'Ongoing updates, security patches, and hosting management', pricingModel: 'monthly', price: 800, isActive: false },
    ],
  },
  {
    id: '3', name: 'Content & Copywriting', icon: 'PenTool',
    modules: [
      { id: '7', name: 'Content Strategy', shortDesc: 'Audience research, content pillars, and editorial calendar', pricingModel: 'fixed', price: 5000, isActive: true },
      { id: '8', name: 'Blog Writing', shortDesc: 'SEO-optimized blog posts with keyword research', pricingModel: 'monthly', price: 2000, isActive: true },
      { id: '9', name: 'Email Copywriting', shortDesc: 'Email sequences, campaigns, and newsletter content', pricingModel: 'fixed', price: 3000, isActive: true },
    ],
  },
  {
    id: '4', name: 'SEO & Organic Growth', icon: 'TrendingUp',
    modules: [
      { id: '10', name: 'SEO Strategy & Implementation', shortDesc: 'Technical SEO, on-page optimization, and link building', pricingModel: 'monthly', price: 3500, isActive: true },
      { id: '11', name: 'Technical SEO Audit', shortDesc: 'Comprehensive site audit with actionable recommendations', pricingModel: 'fixed', price: 2500, isActive: true },
    ],
  },
  {
    id: '5', name: 'Paid Advertising', icon: 'Megaphone',
    modules: [
      { id: '12', name: 'Paid Search (PPC)', shortDesc: 'Google Ads management with keyword strategy', pricingModel: 'monthly', price: 3000, isActive: true },
      { id: '13', name: 'Paid Social Advertising', shortDesc: 'Meta, LinkedIn, and TikTok ad campaigns', pricingModel: 'monthly', price: 2500, isActive: true },
      { id: '14', name: 'Landing Page Design', shortDesc: 'High-converting landing pages for campaigns', pricingModel: 'fixed', price: 3500, isActive: true },
    ],
  },
  {
    id: '6', name: 'Social Media', icon: 'Share2',
    modules: [
      { id: '15', name: 'Social Media Management', shortDesc: 'Content creation, scheduling, and community management', pricingModel: 'monthly', price: 3000, isActive: true },
      { id: '16', name: 'Short-Form Video', shortDesc: 'Reels, TikToks, and YouTube Shorts production', pricingModel: 'monthly', price: 2500, isActive: true },
    ],
  },
];

const pricingLabels = { fixed: '', monthly: '/mo', hourly: '/hr' };

export default function Services() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(serviceGroups.map((g) => [g.id, true]))
  );

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

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
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="space-y-3">
        {serviceGroups.map((group) => {
          const IconComp = (Icons as any)[group.icon] || Icons.Layers;
          const isOpen = expanded[group.id];
          const activeCount = group.modules.filter((m) => m.isActive).length;

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
                  {group.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className={cn(
                        'flex items-center gap-4 border-b border-border px-5 py-3 last:border-0 transition-colors hover:bg-muted/30',
                        !mod.isActive && 'opacity-50'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{mod.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{mod.shortDesc}</p>
                      </div>
                      <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                        ${mod.price.toLocaleString()}{pricingLabels[mod.pricingModel]}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {mod.pricingModel}
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
    </AppShell>
  );
}
