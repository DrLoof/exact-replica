import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface Agency {
  id: string;
  name: string;
  website: string | null;
  created_at: string;
  onboarding_complete: boolean;
  onboarding_step: number | null;
  proposal_count: number;
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#E8F5E9', text: '#2E7D32' },
  Inactive: { bg: '#FFF8E1', text: '#F57F17' },
  Stalled: { bg: '#FFEBEE', text: '#C62828' },
  New: { bg: '#E3F2FD', text: '#1565C0' },
};

export function AdminUsers({ agencies, growthData }: { agencies: Agency[]; growthData: { date: string; count: number }[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('all');

  const filteredGrowth = (() => {
    if (timeRange === 'all') return growthData;
    const days = timeRange === '30d' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return growthData.filter(d => d.date >= cutoff);
  })();

  return (
    <div className="space-y-6">
      {/* Recent signups table */}
      <div className="rounded-xl bg-paper shadow-card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: '#EEEAE3' }}>
          <p className="text-sm font-semibold text-ink">Recent Agencies</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Signed Up</th>
                <th className="px-4 py-3">Onboarding</th>
                <th className="px-4 py-3">Proposals</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a, i) => {
                const expanded = expandedId === a.id;
                const sc = statusColors[a.status] || statusColors.New;
                return (
                  <>
                    <tr
                      key={a.id}
                      onClick={() => setExpandedId(expanded ? null : a.id)}
                      className="cursor-pointer hover:bg-parchment-soft/50 transition-colors"
                      style={{ backgroundColor: i % 2 === 0 ? '#FAF9F6' : '#FFFFFF' }}
                    >
                      <td className="px-4 py-3">
                        {expanded ? <ChevronDown className="h-4 w-4 text-ink-faint" /> : <ChevronRight className="h-4 w-4 text-ink-faint" />}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{a.name}</td>
                      <td className="px-4 py-3 text-ink-muted">{a.website || '—'}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        {a.onboarding_complete ? (
                          <span style={{ color: '#6E9A7A' }}>✓ Complete</span>
                        ) : (
                          <span style={{ color: '#D4A053' }}>✗ Step {a.onboarding_step || 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink">{a.proposal_count}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${a.id}-expand`}>
                        <td colSpan={7} className="px-8 py-4 bg-parchment-soft/30">
                          <div className="text-xs text-ink-muted space-y-1">
                            <p><span className="font-medium">Proposals:</span> {a.proposal_count}</p>
                            <p><span className="font-medium">Onboarding step:</span> {a.onboarding_step || 1}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth chart */}
      <div className="rounded-xl bg-paper p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-ink">Agency Growth</p>
          <div className="flex gap-1">
            {(['30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeRange === r ? 'bg-ink text-ivory' : 'text-ink-muted hover:bg-parchment-soft'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={filteredGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEAE3" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#B8B0A5' }} />
            <YAxis tick={{ fontSize: 10, fill: '#B8B0A5' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#FAFAF8', border: '1px solid #EEEAE3', borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="count" stroke="#2A2118" fill="#2A211810" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
