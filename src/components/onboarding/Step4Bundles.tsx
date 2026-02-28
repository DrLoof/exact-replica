import { Package } from 'lucide-react';
import { defaultBundles, calculateBundlePricing, formatBundlePrice } from '@/lib/defaultBundles';

export function Step4Bundles() {
  const bundles = defaultBundles.slice(0, 3).map(b => {
    const pricing = calculateBundlePricing(b.serviceNames, b.discountPercentage);
    return {
      name: b.name,
      tagline: b.tagline,
      services: b.serviceNames,
      individualTotal: pricing.totalFixed + pricing.totalMonthly,
      bundlePrice: pricing.bundleFixed + pricing.bundleMonthly,
    };
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Package your services for bigger deals</h1>
      <p className="mt-2 text-sm text-muted-foreground">Bundles let you present services as strategic packages with built-in savings.</p>

      <div className="mt-3 rounded-xl border border-brand/20 bg-accent p-4">
        <p className="text-sm text-accent-foreground">
          💡 Agencies using bundles close <span className="font-semibold">23% larger deals</span> on average.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <div key={bundle.name} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="mt-3 font-display text-sm font-semibold text-foreground">{bundle.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{bundle.tagline}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              {bundle.services.map((s) => (
                <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted-foreground line-through">${bundle.individualTotal.toLocaleString()}</span>
                <span className="ml-2 font-display text-lg font-bold tabular-nums text-foreground">${bundle.bundlePrice.toLocaleString()}</span>
              </div>
              <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-[10px] font-medium text-status-success">
                Save ${(bundle.individualTotal - bundle.bundlePrice).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
