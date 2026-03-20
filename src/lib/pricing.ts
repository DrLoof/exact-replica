/**
 * Resolves the correct price for a service module based on its pricing_model.
 * Avoids the bug where fallback chains (price_fixed ?? price_monthly ?? price_hourly)
 * pick the wrong field when a module has stale values in non-active price columns.
 */
export function getModulePriceByModel(mod: {
  pricing_model?: string | null;
  price_fixed?: number | null;
  price_monthly?: number | null;
  price_hourly?: number | null;
}): number {
  if (!mod) return 0;
  switch (mod.pricing_model) {
    case 'monthly':
      return mod.price_monthly ?? 0;
    case 'hourly':
      return mod.price_hourly ?? 0;
    case 'fixed':
    default:
      return mod.price_fixed ?? 0;
  }
}

export function pricingSuffix(model: string | null | undefined): string {
  if (model === 'monthly') return '/mo';
  if (model === 'hourly') return '/hr';
  return '';
}
