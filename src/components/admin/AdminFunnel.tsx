import { AlertTriangle } from 'lucide-react';

interface FunnelStep {
  label: string;
  count: number;
}

export function AdminFunnel({ data }: { data: FunnelStep[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Calculate drop-offs
  const dropOffs = data.map((step, i) => {
    if (i === 0) return null;
    const prev = data[i - 1].count;
    if (prev === 0) return null;
    return Math.round(((prev - step.count) / prev) * 100);
  });

  const biggestDropIdx = dropOffs.reduce((maxIdx, val, idx) => {
    if (val === null) return maxIdx;
    if (maxIdx === -1) return idx;
    return (val > (dropOffs[maxIdx] || 0)) ? idx : maxIdx;
  }, -1);

  // Gradient colors from dark to light
  const colors = data.map((_, i) => {
    const ratio = i / Math.max(data.length - 1, 1);
    const r = Math.round(42 + (238 - 42) * ratio);
    const g = Math.round(33 + (234 - 33) * ratio);
    const b = Math.round(24 + (227 - 24) * ratio);
    return `rgb(${r},${g},${b})`;
  });

  return (
    <div className="rounded-xl bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-semibold text-ink">Conversion Funnel</p>
        <p className="text-xs text-ink-faint">Last 30 days</p>
      </div>

      <div className="space-y-1">
        {data.map((step, i) => {
          const pct = maxCount > 0 ? Math.round((step.count / maxCount) * 100) : 0;
          const dropOff = dropOffs[i];

          return (
            <div key={step.label}>
              {dropOff !== null && dropOff > 0 && (
                <div className="flex items-center gap-2 py-1 pl-2">
                  {i === biggestDropIdx && <AlertTriangle className="h-3 w-3" style={{ color: '#A87A7A' }} />}
                  <span className="text-[10px] font-medium" style={{ color: '#A87A7A' }}>
                    {dropOff}% drop-off
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="w-48 shrink-0 text-xs text-ink-muted truncate">{step.label}</span>
                <div className="flex-1 h-6 rounded bg-parchment-soft overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: colors[i] }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-semibold text-ink">{step.count.toLocaleString()}</span>
                <span className="w-12 text-right text-xs text-ink-faint">
                  {maxCount > 0 ? `${pct}%` : '0%'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
