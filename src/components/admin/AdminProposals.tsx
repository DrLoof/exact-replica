import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProposalData {
  total: number;
  thisWeek: number;
  avgPerAgency: string;
  templateCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  avgServices: string;
  bundlePercentage: number;
  sentCount: number;
  sentPercentage: number;
  acceptedCount: number;
  acceptedPercentage: number;
  avgValue: number;
  totalPipeline: number;
  topServices: { id: string; name: string; proposals: number; agencies: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#B8B0A5',
  sent: '#2A2118',
  viewed: '#BE8E5E',
  accepted: '#6E9A7A',
  declined: '#A87A7A',
  expired: '#D4A053',
};

export function AdminProposals({ data }: { data: ProposalData }) {
  const statusData = Object.entries(data.statusCounts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#B8B0A5',
  }));

  const metrics = [
    ['Total proposals', data.total],
    ['This week', data.thisWeek],
    ['Avg per agency', data.avgPerAgency],
    ['Avg services/proposal', data.avgServices],
    ['With bundles', `${data.bundlePercentage}%`],
    ['Sent to clients', `${data.sentCount} (${data.sentPercentage}%)`],
    ['Accepted', `${data.acceptedCount} (${data.acceptedPercentage}% of sent)`],
    ['Avg proposal value', `$${data.avgValue.toLocaleString()}`],
    ['Total pipeline', `$${data.totalPipeline.toLocaleString()}`],
  ];

  const templateEntries = Object.entries(data.templateCounts)
    .sort((a, b) => b[1] - a[1]);
  const templateTotal = templateEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics table */}
        <div className="rounded-xl bg-paper p-6 shadow-card">
          <p className="text-sm font-semibold text-ink mb-4">Proposal Metrics</p>
          <table className="w-full text-sm">
            <tbody>
              {metrics.map(([label, val]) => (
                <tr key={label as string} className="border-b last:border-b-0" style={{ borderColor: '#EEEAE3' }}>
                  <td className="py-2 text-ink-muted">{label}</td>
                  <td className="py-2 text-right font-semibold text-ink">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: '#EEEAE3' }}>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-2" style={{ color: '#B8B0A5' }}>
              Most Popular Template
            </p>
            {templateEntries.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-ink capitalize">{name}</span>
                <span className="text-ink-faint">{templateTotal > 0 ? Math.round((count / templateTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status donut */}
        <div className="rounded-xl bg-paper p-6 shadow-card">
          <p className="text-sm font-semibold text-ink mb-4">Status Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#FAFAF8', border: '1px solid #EEEAE3', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-ink-muted capitalize">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top services */}
      <div className="rounded-xl bg-paper p-6 shadow-card">
        <p className="text-sm font-semibold text-ink mb-4">Top Services</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>
              <th className="px-2 py-2 w-8">#</th>
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2 text-right">Proposals</th>
              <th className="px-2 py-2 text-right">Agencies</th>
            </tr>
          </thead>
          <tbody>
            {data.topServices.map((svc, i) => (
              <tr key={svc.id} className="border-t" style={{ borderColor: '#EEEAE3' }}>
                <td className="px-2 py-2 text-ink-faint">{i + 1}.</td>
                <td className="px-2 py-2 font-medium text-ink">{svc.name}</td>
                <td className="px-2 py-2 text-right text-ink">{svc.proposals}</td>
                <td className="px-2 py-2 text-right text-ink-faint">{svc.agencies}</td>
              </tr>
            ))}
            {data.topServices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-ink-faint">No data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
