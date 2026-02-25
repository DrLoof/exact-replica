import { AppShell } from '@/components/layout/AppShell';
import { Plus, Package, MoreHorizontal } from 'lucide-react';

const mockBundles = [
  {
    id: '1', name: 'Brand Launch Package', tagline: 'Everything you need to make a powerful first impression',
    services: ['Brand Identity System', 'Brand Messaging & Voice', 'Website Design & Development', 'Website Copywriting'],
    individualTotal: 31500, bundlePrice: 26750, savingsAmount: 4750,
  },
  {
    id: '2', name: 'Digital Growth Package', tagline: 'Dominate organic search and content',
    services: ['SEO Strategy', 'Content Strategy', 'Blog Writing', 'Analytics Setup'],
    individualTotal: 13000, bundlePrice: 11050, savingsAmount: 1950,
  },
  {
    id: '3', name: 'Lead Generation Engine', tagline: 'Turn clicks into customers with paid media',
    services: ['Paid Search (PPC)', 'Paid Social Advertising', 'Landing Page Design', 'Email Marketing'],
    individualTotal: 12000, bundlePrice: 10200, savingsAmount: 1800,
  },
];

export default function Bundles() {
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {mockBundles.map((bundle) => (
          <div key={bundle.id} className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Package className="h-5 w-5 text-accent-foreground" />
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-4 font-display text-base font-semibold text-foreground">{bundle.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{bundle.tagline}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {bundle.services.map((s) => (
                <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{s}</span>
              ))}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-muted-foreground line-through">${bundle.individualTotal.toLocaleString()}</span>
                  <span className="ml-2 font-display text-xl font-bold tabular-nums text-foreground">${bundle.bundlePrice.toLocaleString()}</span>
                </div>
                <span className="rounded-full bg-status-success/15 px-2.5 py-0.5 text-xs font-medium text-status-success">
                  Save ${bundle.savingsAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
