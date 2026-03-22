import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { usePlan, Plan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { useClients, useProposals } from '@/hooks/useAgencyData';
import { Check, X as XIcon, Zap, Crown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/* ─── Feature comparison grid rows ─── */
const featureRows: { label: string; values: Record<string, string> }[] = [
  { label: 'Users', values: { free: '1', starter: '2', pro: '5', business: 'Unlimited' } },
  { label: 'Proposals/mo', values: { free: '1', starter: '10', pro: '40', business: 'Unlimited' } },
  { label: 'Clients', values: { free: '1', starter: '10', pro: '50', business: 'Unlimited' } },
  { label: 'Templates', values: { free: 'Classic', starter: 'Classic +1', pro: 'All 4', business: 'All + custom' } },
  { label: 'PDF Export', values: { free: '✗', starter: '✓', pro: '✓', business: '✓' } },
  { label: 'E-signatures', values: { free: '✗', starter: '✓', pro: '✓', business: '✓' } },
  { label: 'Color Customizer', values: { free: '✗', starter: '✓', pro: '✓', business: '✓' } },
  { label: 'Analytics', values: { free: '✗', starter: 'Basic', pro: 'Full', business: 'Full' } },
  { label: 'Interactive Proposals', values: { free: '✗', starter: '✗', pro: '✓', business: '✓' } },
  { label: 'Portfolio Section', values: { free: '✗', starter: '✗', pro: '✓', business: '✓' } },
  { label: 'Branding', values: { free: 'Watermark', starter: 'No watermark', pro: '+ domain', business: 'White-label' } },
  { label: 'Bundles', values: { free: '0', starter: '3', pro: 'Unlimited', business: 'Unlimited' } },
  { label: 'Packages', values: { free: '0', starter: '3', pro: 'Unlimited', business: 'Unlimited' } },
  { label: 'Follow-up Emails', values: { free: '✗', starter: '1 template', pro: 'All', business: 'All + custom' } },
  { label: 'API Access', values: { free: '✗', starter: '✗', pro: '✗', business: '✓' } },
  { label: 'Support', values: { free: 'Community', starter: 'Email', pro: 'Email+chat', business: 'Priority' } },
];

/* ─── Competitor per-seat prices (monthly) ─── */
const competitors = [
  { name: 'Proposify', perSeat: 49 },
  { name: 'PandaDoc', perSeat: 49 },
  { name: 'Better Proposals', perSeat: 21 },
];

/* ─── Propopad plan for team size ─── */
function propopadPlanForTeam(teamSize: number, plans: Plan[], cycle: 'monthly' | 'annual'): { price: number; planName: string } {
  if (!plans || plans.length === 0) return { price: 0, planName: 'Free' };
  const sorted = [...plans].sort((a, b) => a.display_order - b.display_order);
  for (const p of sorted) {
    if (p.max_users === null || p.max_users >= teamSize) {
      return { price: cycle === 'annual' ? p.annual_price / 100 : p.monthly_price / 100, planName: p.name };
    }
  }
  const last = sorted[sorted.length - 1];
  return { price: cycle === 'annual' ? last.annual_price / 100 : last.monthly_price / 100, planName: last.name };
}

/* ─── Cancel reasons ─── */
const cancelReasons = [
  { id: 'expensive', label: 'Too expensive' },
  { id: 'not_using', label: 'Not using it enough' },
  { id: 'missing', label: 'Missing features I need' },
  { id: 'switching', label: 'Switching to another tool' },
  { id: 'other', label: 'Other' },
];

export default function SettingsBilling() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [teamSize, setTeamSize] = useState(5);
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [cancelStep, setCancelStep] = useState(0);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOther, setCancelOther] = useState('');

  const { plan: currentPlan, effectivePlan, allPlans, isTrialing, trialDaysLeft, proposalsThisMonth, proposalLimit } = usePlan();
  const { agency } = useAuth();
  const { data: clients = [] } = useClients();
  const { data: proposals = [] } = useProposals();

  const isPaid = currentPlan && currentPlan.id !== 'free' && !isTrialing;

  const getPrice = (p: Plan) => {
    const cents = billingCycle === 'annual' ? p.annual_price : p.monthly_price;
    return cents / 100;
  };

  const handleUpgradeClick = () => {
    toast.info("Coming soon — we'll notify you when billing is live.", { duration: 4000 });
  };

  const handleCancelConfirm = () => {
    toast.info("Your subscription will remain active until the end of your billing period.");
    setShowCancelFlow(false);
    setCancelStep(0);
    setCancelReason('');
  };

  // Competitor comparison
  const ppPlan = propopadPlanForTeam(teamSize, allPlans, billingCycle);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-ink mb-1">Plans & Billing</h1>
        <p className="text-sm text-ink-muted mb-8">
          {isTrialing
            ? `You're on a 14-day Pro trial — ${trialDaysLeft} days remaining`
            : `You're on the ${currentPlan?.name || 'Free'} plan`}
        </p>

        {/* ─── PAID PLAN: Current plan info ─── */}
        {isPaid && (
          <div className="mb-10">
            {/* Plan info card */}
            <div className="rounded-xl bg-paper p-6 shadow-card mb-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-3" style={{ color: '#B8B0A5' }}>Your Plan</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: '#8A7F72' }}>Plan</p>
                  <p className="text-lg font-bold text-ink">{currentPlan.name}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#8A7F72' }}>Billing</p>
                  <p className="text-lg font-bold text-ink">${getPrice(currentPlan)}/mo</p>
                </div>
              </div>
            </div>

            {/* Usage this month */}
            <div className="rounded-xl bg-paper p-6 shadow-card mb-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-4" style={{ color: '#B8B0A5' }}>Usage This Month</p>
              <div className="space-y-4">
                <UsageBar label="Proposals" current={proposalsThisMonth} max={currentPlan.max_proposals} />
                <UsageBar label="Clients" current={clients.length} max={currentPlan.max_clients} />
                <UsageBar label="Users" current={1} max={currentPlan.max_users} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleUpgradeClick}
                className="rounded-xl px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-90" style={{ backgroundColor: '#2A2118', color: '#FFFFFF' }}
              >
                Change plan
              </button>
              <button
                onClick={handleUpgradeClick}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#F4F1EB]" style={{ borderColor: '#EEEAE3', color: '#2A2118' }}
              >
                Update payment
              </button>
              <button
                onClick={handleUpgradeClick}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#F4F1EB]" style={{ borderColor: '#EEEAE3', color: '#2A2118' }}
              >
                View invoices
              </button>
            </div>
            <button
              onClick={() => { setShowCancelFlow(true); setCancelStep(0); setCancelReason(''); }}
              className="text-sm hover:underline" style={{ color: '#A87A7A' }}
            >
              Cancel subscription
            </button>
          </div>
        )}

        {/* ─── PLAN COMPARISON GRID ─── */}
        <div className="mb-10">
          {isPaid && (
            <h2 className="text-lg font-bold text-ink mb-4">Compare Plans</h2>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn('text-lg font-bold text-ink', isPaid && 'hidden')}>Choose your plan</h2>
            <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: '#F4F1EB' }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                  billingCycle === 'monthly' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                  billingCycle === 'annual' ? 'bg-white shadow-sm text-ink' : 'text-ink-muted'
                )}
              >
                Annual
              </button>
            </div>
            {billingCycle === 'annual' && (
              <span className="text-[12px] font-medium" style={{ color: '#6E9A7A' }}>Save up to 34%</span>
            )}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:block overflow-x-auto rounded-xl border" style={{ borderColor: '#EEEAE3' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EEEAE3' }}>
                  <th className="text-left py-4 px-4 w-[160px]" />
                  {allPlans.map((p) => {
                    const isCurrent = currentPlan?.id === p.id || (isTrialing && p.id === 'pro');
                    const isPopular = p.id === 'pro';
                    return (
                      <th
                        key={p.id}
                        className="text-center py-4 px-3 relative"
                        style={{
                          borderTop: isPopular ? '2px solid #BE8E5E' : undefined,
                          backgroundColor: isCurrent ? '#FAF9F6' : undefined,
                        }}
                      >
                        <div className="flex flex-col items-center">
                          {isPopular && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase mb-1" style={{ backgroundColor: '#FBF5EE', color: '#BE8E5E' }}>
                              <Crown className="h-3 w-3" /> Popular
                            </span>
                          )}
                          <span className="text-[15px] font-bold" style={{ color: '#2A2118' }}>{p.name}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
                {/* Price row */}
                <tr style={{ borderBottom: '1px solid #EEEAE3' }}>
                  <td className="py-3 px-4 text-[13px] font-medium" style={{ color: '#8A7F72' }}>Price</td>
                  {allPlans.map((p) => {
                    const price = getPrice(p);
                    const isCurrent = currentPlan?.id === p.id || (isTrialing && p.id === 'pro');
                    return (
                      <td key={p.id} className="text-center py-3 px-3" style={{ backgroundColor: isCurrent ? '#FAF9F6' : undefined }}>
                        <span className="text-[20px] font-bold" style={{ color: '#2A2118' }}>{price === 0 ? '$0' : `$${price}`}</span>
                        {price > 0 && <span className="text-[12px]" style={{ color: '#8A7F72' }}>/mo</span>}
                        {billingCycle === 'annual' && p.monthly_price > 0 && (
                          <p className="text-[11px] line-through mt-0.5" style={{ color: '#D1CBC2' }}>${p.monthly_price / 100}/mo</p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, i) => (
                  <tr key={row.label} style={{ borderBottom: i < featureRows.length - 1 ? '1px solid #EEEAE3' : undefined }}>
                    <td className="py-2.5 px-4 text-[13px]" style={{ color: '#8A7F72' }}>{row.label}</td>
                    {allPlans.map((p) => {
                      const val = row.values[p.id] || '—';
                      const isCurrent = currentPlan?.id === p.id || (isTrialing && p.id === 'pro');
                      const isCheck = val === '✓';
                      const isX = val === '✗';
                      return (
                        <td key={p.id} className="text-center py-2.5 px-3 text-[13px]" style={{ backgroundColor: isCurrent ? '#FAF9F6' : undefined }}>
                          {isCheck ? (
                            <Check className="h-4 w-4 mx-auto" style={{ color: '#6E9A7A' }} />
                          ) : isX ? (
                            <XIcon className="h-4 w-4 mx-auto" style={{ color: '#D1CBC2' }} />
                          ) : (
                            <span style={{ color: '#4A3F32' }}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* CTA row */}
                <tr>
                  <td className="py-4 px-4" />
                  {allPlans.map((p) => {
                    const isCurrent = currentPlan?.id === p.id || (isTrialing && p.id === 'pro');
                    const isPopular = p.id === 'pro';
                    return (
                      <td key={p.id} className="text-center py-4 px-3" style={{ backgroundColor: isCurrent ? '#FAF9F6' : undefined }}>
                        {isCurrent ? (
                          <span className="inline-block rounded-lg px-4 py-2 text-[13px] font-medium" style={{ color: '#8A7F72', backgroundColor: '#F4F1EB' }}>
                            {isTrialing ? 'Trial active' : 'Current'}
                          </span>
                        ) : p.id === 'free' ? (
                          <span className="text-[13px]" style={{ color: '#B8B0A5' }}>—</span>
                        ) : (
                          <button
                            onClick={handleUpgradeClick}
                            className={cn(
                              'rounded-xl px-5 py-2 text-[13px] font-medium transition-colors',
                              isPopular ? 'text-white hover:opacity-90' : 'border hover:bg-[#F4F1EB]'
                            )}
                            style={isPopular ? { backgroundColor: '#2A2118' } : { borderColor: '#EEEAE3', color: '#2A2118' }}
                          >
                            Upgrade →
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-4">
            {allPlans.map((p) => {
              const isCurrent = currentPlan?.id === p.id || (isTrialing && p.id === 'pro');
              const isPopular = p.id === 'pro';
              const price = getPrice(p);
              return (
                <div
                  key={p.id}
                  className="rounded-xl bg-paper p-5 shadow-card relative"
                  style={isPopular ? { border: '2px solid #BE8E5E' } : isCurrent ? { border: '2px solid #2A2118' } : {}}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: '#BE8E5E', color: '#FFFFFF' }}>
                      <Crown className="h-3 w-3" /> Popular
                    </span>
                  )}
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-lg font-bold" style={{ color: '#2A2118' }}>{p.name}</h3>
                    <div>
                      <span className="text-2xl font-bold" style={{ color: '#2A2118' }}>${price}</span>
                      {price > 0 && <span className="text-sm" style={{ color: '#8A7F72' }}>/mo</span>}
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {featureRows.slice(0, 8).map((row) => {
                      const val = row.values[p.id];
                      if (val === '✗' || val === '0') return null;
                      return (
                        <li key={row.label} className="flex items-center gap-2 text-[13px]" style={{ color: '#4A3F32' }}>
                          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#6E9A7A' }} />
                          {row.label}: {val === '✓' ? 'Yes' : val}
                        </li>
                      );
                    })}
                  </ul>
                  {isCurrent ? (
                    <span className="block text-center rounded-lg px-4 py-2 text-[13px] font-medium" style={{ color: '#8A7F72', backgroundColor: '#F4F1EB' }}>
                      {isTrialing ? 'Trial active' : 'Current plan'}
                    </span>
                  ) : p.id !== 'free' && (
                    <button
                      onClick={handleUpgradeClick}
                      className="w-full rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#2A2118' }}
                    >
                      Upgrade →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── COMPETITOR COMPARISON ─── */}
        <div className="rounded-xl p-6 mb-10" style={{ backgroundColor: '#2A2118' }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5" style={{ color: '#BE8E5E' }} />
            <h3 className="text-lg font-bold text-white">How much you save vs per-seat pricing</h3>
          </div>
          <p className="text-sm text-white/60 mb-5">
            Flat-team pricing means your whole team uses Propopad for one price.
          </p>

          {/* Team size selector */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[13px] text-white/70">Team size:</span>
            <div className="relative">
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                className="appearance-none rounded-lg px-3 py-1.5 pr-7 text-[13px] font-medium border-0"
                style={{ backgroundColor: '#3D352B', color: '#FFFFFF' }}
              >
                {[1, 2, 3, 5, 10, 15].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'user' : 'users'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <th className="text-left py-2 pr-4" />
                  <th className="text-right py-2 px-3">Propopad</th>
                  {competitors.map(c => (
                    <th key={c.name} className="text-right py-2 px-3">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <td className="py-2.5 pr-4 text-white/60">{billingCycle === 'annual' ? 'Annual' : 'Monthly'}</td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#BE8E5E' }}>
                    ${ppPlan.price}/mo
                  </td>
                  {competitors.map(c => (
                    <td key={c.name} className="py-2.5 px-3 text-right text-white/50">
                      ${c.perSeat * teamSize}/mo
                    </td>
                  ))}
                </tr>
                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <td className="py-2.5 pr-4 text-white/60">You save/yr</td>
                  <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#BE8E5E' }}>—</td>
                  {competitors.map(c => {
                    const compAnnual = c.perSeat * teamSize * 12;
                    const ppAnnual = ppPlan.price * 12;
                    const saving = compAnnual - ppAnnual;
                    return (
                      <td key={c.name} className="py-2.5 px-3 text-right" style={{ color: '#6E9A7A' }}>
                        ${saving.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── CANCEL FLOW MODAL ─── */}
      <Dialog open={showCancelFlow} onOpenChange={setShowCancelFlow}>
        <DialogContent className="max-w-md" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: '#2A2118' }}>
              {cancelStep === 0 && "We're sorry to see you go"}
              {cancelStep === 1 && 'Before you cancel…'}
              {cancelStep === 2 && 'Confirm cancellation'}
            </DialogTitle>
          </DialogHeader>

          {cancelStep === 0 && (
            <div className="space-y-3 mt-2">
              <p className="text-[14px]" style={{ color: '#4A3F32' }}>What's the main reason you're cancelling?</p>
              {cancelReasons.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setCancelReason(r.id); setCancelStep(1); }}
                  className={cn(
                    'w-full text-left rounded-xl border px-4 py-3 text-[14px] transition-colors hover:bg-[#FAF9F6]',
                    cancelReason === r.id ? 'border-[#BE8E5E]' : 'border-[#EEEAE3]'
                  )}
                  style={{ color: '#4A3F32' }}
                >
                  {r.label}
                </button>
              ))}
              {cancelReason === 'other' && (
                <textarea
                  value={cancelOther}
                  onChange={(e) => setCancelOther(e.target.value)}
                  placeholder="Tell us more…"
                  className="w-full rounded-xl border px-4 py-3 text-[14px] resize-none h-20"
                  style={{ borderColor: '#EEEAE3', color: '#4A3F32' }}
                />
              )}
            </div>
          )}

          {cancelStep === 1 && (
            <div className="space-y-4 mt-2">
              {cancelReason === 'expensive' && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#FBF5EE' }}>
                  <p className="text-[14px] font-medium" style={{ color: '#2A2118' }}>
                    Would you like to switch to Starter at $19/mo instead?
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: '#8A7F72' }}>
                    You'll keep PDF exports, e-signatures, and 10 proposals per month.
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    className="mt-3 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                    style={{ backgroundColor: '#2A2118' }}
                  >
                    Switch to Starter →
                  </button>
                </div>
              )}
              {cancelReason === 'not_using' && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#FBF5EE' }}>
                  <p className="text-[14px] font-medium" style={{ color: '#2A2118' }}>
                    You can pause your subscription for up to 3 months.
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: '#8A7F72' }}>
                    Your data will be saved and you can resume anytime.
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    className="mt-3 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                    style={{ backgroundColor: '#2A2118' }}
                  >
                    Pause subscription →
                  </button>
                </div>
              )}
              {cancelReason === 'missing' && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#FBF5EE' }}>
                  <p className="text-[14px] font-medium" style={{ color: '#2A2118' }}>
                    We'd love to hear what you need.
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: '#8A7F72' }}>
                    Our team will reach out within 24 hours to discuss your requirements.
                  </p>
                  <button
                    onClick={() => { toast.success("We'll reach out soon!"); setShowCancelFlow(false); }}
                    className="mt-3 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                    style={{ backgroundColor: '#2A2118' }}
                  >
                    Request a callback →
                  </button>
                </div>
              )}
              {(cancelReason === 'switching' || cancelReason === 'other') && (
                <p className="text-[14px]" style={{ color: '#4A3F32' }}>
                  We understand. You can proceed with cancellation below.
                </p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setCancelStep(0)} className="text-[13px]" style={{ color: '#8A7F72' }}>← Back</button>
                <div className="flex-1" />
                <button
                  onClick={() => setCancelStep(2)}
                  className="text-[13px] hover:underline" style={{ color: '#A87A7A' }}
                >
                  I still want to cancel
                </button>
              </div>
            </div>
          )}

          {cancelStep === 2 && (
            <div className="space-y-4 mt-2">
              <p className="text-[14px]" style={{ color: '#4A3F32' }}>
                Are you sure? You'll keep access until the end of your current billing period.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCancelFlow(false)}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-[14px] font-medium hover:bg-[#F4F1EB]"
                  style={{ borderColor: '#EEEAE3', color: '#2A2118' }}
                >
                  Keep my subscription
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 rounded-xl px-4 py-2.5 text-[14px] font-medium text-white"
                  style={{ backgroundColor: '#A87A7A' }}
                >
                  Confirm cancellation
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ─── Usage bar component ─── */
function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const isUnlimited = max === null;
  const percent = isUnlimited ? 0 : max > 0 ? (current / max) * 100 : 0;
  const barColor = percent >= 100 ? '#D97D7D' : percent >= 80 ? '#D4A843' : '#6E9A7A';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px]" style={{ color: '#4A3F32' }}>{label}</span>
        <span className="text-[13px] font-medium" style={{ color: '#2A2118' }}>
          {current} {isUnlimited ? '(unlimited)' : `of ${max}`}
          {!isUnlimited && <span className="ml-2 text-[11px]" style={{ color: '#8A7F72' }}>{Math.round(percent)}%</span>}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F4F1EB' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, percent)}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </div>
  );
}
