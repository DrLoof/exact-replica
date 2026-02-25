import { cn } from '@/lib/utils';

interface Step5PricingProps {
  data: any;
  onChange: (data: any) => void;
}

const currencies = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

const paymentTemplates = [
  { id: '50-50', name: '50/50', desc: '50% upfront, 50% on completion', milestones: [{ label: 'Upfront', pct: 50 }, { label: 'Completion', pct: 50 }] },
  { id: 'thirds', name: 'Equal Thirds', desc: '33% start, 33% midpoint, 33% delivery', milestones: [{ label: 'Start', pct: 33 }, { label: 'Midpoint', pct: 33 }, { label: 'Delivery', pct: 34 }] },
  { id: 'quarterly', name: 'Quarterly', desc: '25% × 4 milestones', milestones: [{ label: 'Q1', pct: 25 }, { label: 'Q2', pct: 25 }, { label: 'Q3', pct: 25 }, { label: 'Q4', pct: 25 }] },
];

const validityOptions = [14, 30, 45, 60, 90];

export function Step5Pricing({ data, onChange }: Step5PricingProps) {
  const update = (field: string, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Set your pricing defaults</h1>
      <p className="mt-2 text-sm text-muted-foreground">These are your standard rates and terms. You can override them per proposal.</p>

      {/* Section A: Currency & Rates */}
      <div className="mt-8">
        <h3 className="label-overline mb-4">Currency & Rates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Currency</label>
            <select
              value={data.currency || 'USD'}
              onChange={(e) => {
                const cur = currencies.find((c) => c.code === e.target.value);
                update('currency', e.target.value);
                if (cur) update('currency_symbol', cur.symbol);
              }}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Default Hourly Rate</label>
            <input
              type="number"
              placeholder="150"
              value={data.hourly_rate || ''}
              onChange={(e) => update('hourly_rate', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>

      {/* Section B: Payment Terms */}
      <div className="mt-8 border-t border-border pt-8">
        <h3 className="label-overline mb-4">Default Payment Terms</h3>
        <div className="space-y-2">
          {paymentTemplates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => update('payment_template', tmpl.id)}
              className={cn(
                'flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-all',
                (data.payment_template || '50-50') === tmpl.id
                  ? 'border-brand bg-accent'
                  : 'border-border bg-card hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                (data.payment_template || '50-50') === tmpl.id ? 'border-brand' : 'border-muted-foreground/30'
              )}>
                {(data.payment_template || '50-50') === tmpl.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tmpl.name}</p>
                <p className="text-xs text-muted-foreground">{tmpl.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Section C: Proposal Defaults */}
      <div className="mt-8 border-t border-border pt-8">
        <h3 className="label-overline mb-4">Proposal Defaults</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Reference Prefix</label>
            <input
              type="text"
              placeholder="VCT"
              maxLength={5}
              value={data.proposal_prefix || ''}
              onChange={(e) => update('proposal_prefix', e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground uppercase placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">e.g. VCT-2026-0001</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Validity Period</label>
            <select
              value={data.default_validity_days || 30}
              onChange={(e) => update('default_validity_days', parseInt(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {validityOptions.map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Default Revision Rounds</label>
            <input
              type="number"
              min={0}
              max={10}
              value={data.default_revision_rounds ?? 2}
              onChange={(e) => update('default_revision_rounds', parseInt(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Notice Period</label>
            <input
              type="text"
              placeholder="30 days"
              value={data.default_notice_period || '30 days'}
              onChange={(e) => update('default_notice_period', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
