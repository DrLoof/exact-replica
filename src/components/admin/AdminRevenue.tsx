export function AdminRevenue() {
  return (
    <div className="rounded-xl bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-ink">Revenue</p>
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF8E1', color: '#F57F17' }}>
          Coming soon
        </span>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>MRR</p>
          <p className="text-2xl font-bold text-ink mt-1">$0</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>Paying Agencies</p>
          <p className="text-2xl font-bold text-ink mt-1">0</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>Avg Revenue/Agency</p>
          <p className="text-2xl font-bold text-ink mt-1">$0</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] mb-3" style={{ color: '#B8B0A5' }}>Plan Distribution</p>
        {['Free', 'Starter', 'Pro', 'Business'].map((plan) => (
          <div key={plan} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0" style={{ borderColor: '#EEEAE3' }}>
            <span className="text-ink">{plan}</span>
            <span className="text-ink-faint">{plan === 'Free' ? '100%' : '0'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
