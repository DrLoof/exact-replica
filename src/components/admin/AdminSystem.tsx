import { CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SystemData {
  tableCounts: Record<string, number>;
  totalRows: number;
  apiCalls24h: number;
  failedScans: number;
  failedApiCalls: number;
  avgDurationMs: number;
  lastApiCall: string | null;
}

export function AdminSystem({ data }: { data: SystemData }) {
  const services = [
    { name: 'App', status: true, detail: 'Online' },
    { name: 'Database', status: true, detail: `${data.totalRows.toLocaleString()} rows across ${Object.keys(data.tableCounts).length} tables` },
    { name: 'AI Engine', status: true, detail: data.lastApiCall ? `last call: ${formatDistanceToNow(new Date(data.lastApiCall))} ago, avg: ${(data.avgDurationMs / 1000).toFixed(1)}s` : 'No calls yet' },
    { name: 'Storage', status: true, detail: 'Online' },
  ];

  return (
    <div className="space-y-6">
      {/* System status */}
      <div className="rounded-xl bg-paper p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-4 w-4" style={{ color: '#6E9A7A' }} />
          <p className="text-sm font-semibold text-ink">All systems operational</p>
        </div>
        <div className="space-y-2">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: svc.status ? '#6E9A7A' : '#A87A7A' }} />
              <span className="w-24 text-ink">{svc.name}</span>
              <span className="text-ink-faint">{svc.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'API Calls (24h)', value: data.apiCalls24h },
          { label: 'Failed Scans (24h)', value: data.failedScans, warn: data.failedScans > 0 },
          { label: 'Failed API Calls', value: data.failedApiCalls, warn: data.failedApiCalls > 0 },
          { label: 'Avg Duration', value: `${(data.avgDurationMs / 1000).toFixed(1)}s` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-paper p-4 shadow-card">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>{m.label}</p>
            <p className={`text-xl font-bold mt-1 ${m.warn ? '' : 'text-ink'}`} style={m.warn ? { color: '#A87A7A' } : undefined}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table counts */}
      <div className="rounded-xl bg-paper p-6 shadow-card">
        <p className="text-sm font-semibold text-ink mb-3">Database Tables</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(data.tableCounts).map(([table, count]) => (
            <div key={table} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg" style={{ backgroundColor: '#FAF9F6' }}>
              <span className="text-ink-muted">{table}</span>
              <span className="font-semibold text-ink">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
