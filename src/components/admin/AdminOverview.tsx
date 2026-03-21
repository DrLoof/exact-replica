import { TrendingUp, TrendingDown } from 'lucide-react';

interface OverviewData {
  totalAgencies: number;
  activeThisWeek: number;
  activePercentage: number;
  onboardingComplete: number;
  onboardingPercentage: number;
  totalProposals: number;
  proposalsThisWeek: number;
  proposalsPrevWeek: number;
  payingUsers: number;
}

export function AdminOverview({ data }: { data: OverviewData }) {
  const proposalTrend = data.proposalsThisWeek - data.proposalsPrevWeek;

  const cards = [
    { label: 'Total Agencies', value: data.totalAgencies, sub: 'agencies' },
    { label: 'Active This Week', value: data.activeThisWeek, sub: `${data.activePercentage}% of total` },
    { label: 'Onboarding Done', value: data.onboardingComplete, sub: `${data.onboardingPercentage}% of total` },
    { label: 'Total Proposals', value: data.totalProposals, sub: 'proposals' },
    {
      label: 'Proposals This Week',
      value: data.proposalsThisWeek,
      sub: `${proposalTrend >= 0 ? '+' : ''}${proposalTrend} vs prev week`,
      trend: proposalTrend,
    },
    { label: 'Paying Users', value: data.payingUsers, sub: 'paying' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-paper p-4 shadow-card">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>
            {card.label}
          </p>
          <p className="text-[28px] font-bold text-ink mt-1">{card.value}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {card.trend !== undefined && card.trend !== 0 && (
              card.trend > 0
                ? <TrendingUp className="h-3 w-3" style={{ color: '#6E9A7A' }} />
                : <TrendingDown className="h-3 w-3" style={{ color: '#A87A7A' }} />
            )}
            <p className="text-xs" style={{ color: '#8A7F72' }}>{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
