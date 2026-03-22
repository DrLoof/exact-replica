import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { usePlan, Plan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { Check, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const planFeatureList: Record<string, string[]> = {
  free: [
    '1 user',
    '1 proposal/month (view only)',
    'Classic template',
    'Basic dashboard',
    '1 client',
  ],
  starter: [
    '2 users',
    '10 proposals/month',
    'Classic + 1 premium template',
    'PDF export',
    'E-signatures',
    'Color customizer',
    'Remove watermark',
    '10 clients, 3 bundles, 3 packages',
  ],
  pro: [
    '5 users',
    '40 proposals/month',
    'All 4 templates',
    'Interactive proposals',
    'Full analytics & tracking',
    'Portfolio section',
    'Custom domain',
    'Follow-up emails',
    '50 clients, unlimited bundles',
  ],
  business: [
    'Unlimited users',
    'Unlimited proposals',
    'All templates + custom',
    'White-label branding',
    'API access',
    'Priority support + onboarding',
    'Unlimited everything',
  ],
};

export default function SettingsBilling() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { plan: currentPlan, allPlans, isTrialing, trialDaysLeft, proposalsThisMonth, proposalLimit } = usePlan();
  const { agency } = useAuth();

  const getPrice = (p: Plan) => {
    const cents = billingCycle === 'annual' ? p.annual_price : p.monthly_price;
    return cents / 100;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink mb-1">Plans & Billing</h1>
        <p className="text-sm text-ink-muted mb-8">
          {isTrialing
            ? `You're on a 14-day Pro trial — ${trialDaysLeft} days remaining`
            : `You're on the ${currentPlan?.name || 'Free'} plan`}
        </p>

        {/* Usage summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-paper p-4 shadow-card">
            <p className="text-xs text-ink-faint">Proposals this month</p>
            <p className="text-xl font-bold text-ink mt-1">
              {proposalsThisMonth}
              {proposalLimit !== null && <span className="text-sm font-normal text-ink-muted"> / {proposalLimit}</span>}
              {proposalLimit === null && <span className="text-sm font-normal text-ink-muted"> (unlimited)</span>}
            </p>
          </div>
          <div className="rounded-xl bg-paper p-4 shadow-card">
            <p className="text-xs text-ink-faint">Current plan</p>
            <p className="text-xl font-bold text-ink mt-1 flex items-center gap-2">
              {currentPlan?.name || 'Free'}
              {isTrialing && <Badge variant="outline" className="text-brass border-brass text-[10px]">Trial</Badge>}
            </p>
          </div>
          <div className="rounded-xl bg-paper p-4 shadow-card">
            <p className="text-xs text-ink-faint">Billing</p>
            <p className="text-xl font-bold text-ink mt-1">
              {currentPlan?.id === 'free' ? 'Free' : `$${getPrice(currentPlan!)}/mo`}
            </p>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              billingCycle === 'monthly' ? 'bg-ink text-ivory' : 'text-ink-muted hover:bg-parchment-soft'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              billingCycle === 'annual' ? 'bg-ink text-ivory' : 'text-ink-muted hover:bg-parchment-soft'
            )}
          >
            Annual <span className="text-brass ml-1">Save 30%+</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-4 gap-4">
          {allPlans.map((p) => {
            const isCurrent = currentPlan?.id === p.id;
            const isPopular = p.id === 'pro';
            const price = getPrice(p);
            const features = planFeatureList[p.id] || [];

            return (
              <div
                key={p.id}
                className={cn(
                  'relative rounded-xl bg-paper p-5 shadow-card transition-all',
                  isPopular && 'ring-2 ring-brass',
                  isCurrent && 'ring-2 ring-ink'
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-brass text-ivory text-[10px] px-3">
                      <Crown className="h-3 w-3 mr-1" /> Most Popular
                    </Badge>
                  </div>
                )}

                <h3 className="text-lg font-bold text-ink">{p.name}</h3>

                <div className="mt-3 mb-4">
                  {price === 0 ? (
                    <span className="text-3xl font-bold text-ink">$0</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-ink">${price}</span>
                      <span className="text-sm text-ink-muted">/mo</span>
                    </>
                  )}
                  {billingCycle === 'annual' && p.monthly_price > 0 && (
                    <p className="text-xs text-ink-faint mt-1 line-through">
                      ${p.monthly_price / 100}/mo
                    </p>
                  )}
                </div>

                <p className="text-xs text-ink-faint mb-1">
                  {p.max_users ? `${p.max_users} user${p.max_users > 1 ? 's' : ''}` : 'Unlimited users'}
                  {' · '}
                  {p.max_proposals ? `${p.max_proposals} proposals/mo` : 'Unlimited'}
                </p>

                <ul className="mt-4 space-y-2 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-ink-muted">
                      <Check className="h-3.5 w-3.5 text-brass mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    'w-full',
                    isCurrent
                      ? 'bg-parchment-soft text-ink-muted cursor-default hover:bg-parchment-soft'
                      : isPopular
                        ? 'bg-ink text-ivory hover:bg-ink-soft'
                        : 'bg-paper text-ink border border-parchment hover:bg-parchment-soft'
                  )}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current plan' : p.id === 'free' ? 'Downgrade' : 'Upgrade'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Competitor comparison */}
        <div className="mt-12 rounded-xl bg-espresso p-6 text-ivory">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Zap className="h-5 w-5 text-brass" />
            Why agencies choose Propopad
          </h3>
          <p className="text-sm text-ivory/70 mb-4">
            Flat-team pricing means your whole team uses Propopad for one price. No per-seat surprises.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ivory/50 text-xs">
                  <th className="text-left py-2 pr-4">5-person team</th>
                  <th className="text-right py-2 px-3">Propopad</th>
                  <th className="text-right py-2 px-3">Proposify</th>
                  <th className="text-right py-2 px-3">PandaDoc</th>
                  <th className="text-right py-2 px-3">Better Proposals</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-ivory/10">
                  <td className="py-2 pr-4 text-ivory/70">Monthly</td>
                  <td className="py-2 px-3 text-right font-bold text-brass">$59/mo</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$245/mo</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$245/mo</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$105/mo</td>
                </tr>
                <tr className="border-t border-ivory/10">
                  <td className="py-2 pr-4 text-ivory/70">Annual</td>
                  <td className="py-2 px-3 text-right font-bold text-brass">$39/mo</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$190/mo</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$245/mo</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$84/mo</td>
                </tr>
                <tr className="border-t border-ivory/10">
                  <td className="py-2 pr-4 text-ivory/70">You save/yr</td>
                  <td className="py-2 px-3 text-right font-bold text-brass">—</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$2,472</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$2,472</td>
                  <td className="py-2 px-3 text-right text-ivory/50">$540</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
