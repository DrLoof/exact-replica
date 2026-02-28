import { useState } from 'react';
import {
  FileText, Plus, ChevronRight, Bell,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProposals, useDashboardStats, useBundles, useClients, useServiceModules } from '@/hooks/useAgencyData';
import { formatDistanceToNow } from 'date-fns';

/* ── Status config ── */
const statusConfig: Record<string, { label: string; dotColor: string; bgColor: string }> = {
  draft:    { label: 'Draft',   dotColor: '#B8B0A5', bgColor: '#F4F1EB' },
  sent:     { label: 'Sent',    dotColor: '#7A8FA8', bgColor: '#F0F3F7' },
  viewed:   { label: 'Viewed',  dotColor: '#8A7BA8', bgColor: '#F2F0F7' },
  accepted: { label: 'Won',     dotColor: '#6E9A7A', bgColor: '#F0F5F1' },
  declined: { label: 'Lost',    dotColor: '#A87A7A', bgColor: '#F7F0F0' },
  expired:  { label: 'Expired', dotColor: '#B8B0A5', bgColor: '#F4F1EB' },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { userProfile, agency } = useAuth();
  const { data: proposals = [], isLoading: loadingProposals } = useProposals();
  const { data: stats } = useDashboardStats();
  const { data: bundles = [] } = useBundles();
  const { data: clients = [] } = useClients();
  const { data: modules = [] } = useServiceModules();
  const navigate = useNavigate();
  const firstName = userProfile?.full_name?.split(' ')[0] || 'there';
  const currencySymbol = agency?.currency_symbol || '$';

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [showBundlePicker, setShowBundlePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const recentProposals = proposals.slice(0, 5);

  // Compute stats
  const sentAndViewed = proposals.filter((p: any) => p.status === 'sent' || p.status === 'viewed');
  const pipelineValue = sentAndViewed.reduce((sum: number, p: any) => sum + (p.grand_total || 0), 0);
  const totalSent = proposals.filter((p: any) => ['sent', 'viewed', 'accepted', 'declined'].includes(p.status)).length;
  const accepted = proposals.filter((p: any) => p.status === 'accepted');
  const winRate = totalSent > 0 ? Math.round((accepted.length / totalSent) * 100) : 0;
  const avgDeal = accepted.length > 0 ? Math.round(accepted.reduce((s: number, p: any) => s + (p.grand_total || 0), 0) / accepted.length) : 0;

  // Monthly stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const monthWon = proposals.filter((p: any) => new Date(p.created_at) >= thisMonth && p.status === 'accepted');
  const monthRevenue = monthWon.reduce((s: number, p: any) => s + (p.grand_total || 0), 0);

  // Activity feed
  const activityEvents = proposals
    .filter((p: any) => p.status !== 'draft')
    .slice(0, 4)
    .map((p: any) => {
      const status = p.status || 'sent';
      const date = p.sent_at || p.viewed_at || p.accepted_at || p.created_at;
      const sc = statusConfig[status] || statusConfig.draft;
      return {
        id: p.id,
        client: p.client?.company_name || 'Unknown',
        status,
        statusLabel: sc.label,
        date,
        dotColor: sc.dotColor,
      };
    });

  // Top services
  const topModules = modules.slice(0, 4).map((m: any) => ({
    name: m.name,
    count: proposals.filter((p: any) => p.proposal_services?.some((ps: any) => ps.module_id === m.id)).length,
  }));
  const maxCount = Math.max(...topModules.map((m: any) => m.count), 1);

  const filteredClients = clientSearch
    ? clients.filter((c: any) => c.company_name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5)
    : clients.slice(0, 5);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreateFromServices = () => {
    const ids = Array.from(selectedServiceIds).join(',');
    navigate(`/proposals/new?services=${ids}`);
  };

  return (
    <AppShell hideHeader>
      <div className="mx-auto max-w-[1080px]">

        {/* ─── Header ─── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[23px] font-bold tracking-[-0.03em] text-ink">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {sentAndViewed.length} proposal{sentAndViewed.length !== 1 ? 's' : ''} awaiting response · {currencySymbol}{pipelineValue.toLocaleString()} in pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-[8px] p-2.5 text-ink-faint transition-colors hover:bg-parchment-soft hover:text-ink-muted">
              <Bell className="h-5 w-5" />
              {proposals.some((p: any) => p.status === 'viewed') && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brass" />
              )}
            </button>
            <Link
              to="/proposals/new"
              className="flex items-center gap-2 rounded-[8px] bg-ink px-4 py-2 text-[13px] font-medium text-ivory transition-all hover:bg-ink-soft"
            >
              <span className="text-[16px] font-light">+</span>
              New Proposal
            </Link>
          </div>
        </div>

        {/* ─── Metrics — Single Paper Card with Compartments ─── */}
        <div className="mb-8 rounded-[12px] bg-paper shadow-card">
          <div className="grid grid-cols-4 divide-x divide-parchment">
            {/* Pipeline — with brass bar */}
            <div className="relative px-5 py-5">
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-brass" />
              <MetricLabel>Pipeline</MetricLabel>
              <MetricValue>{currencySymbol}{pipelineValue >= 1000 ? (pipelineValue / 1000).toFixed(1) + 'K' : pipelineValue.toLocaleString()}</MetricValue>
              <MetricSub>{sentAndViewed.length} awaiting</MetricSub>
            </div>
            {/* Won this month */}
            <div className="px-5 py-5">
              <MetricLabel>Won</MetricLabel>
              <MetricValue>{currencySymbol}{monthRevenue >= 1000 ? (monthRevenue / 1000).toFixed(0) + 'K' : monthRevenue.toLocaleString()}</MetricValue>
              <MetricSub>{monthWon.length} deal{monthWon.length !== 1 ? 's' : ''} this month</MetricSub>
            </div>
            {/* Win rate */}
            <div className="px-5 py-5">
              <MetricLabel>Win rate</MetricLabel>
              <MetricValue>{winRate}%</MetricValue>
              <MetricSub>{accepted.length} of {totalSent} sent</MetricSub>
            </div>
            {/* Avg deal */}
            <div className="px-5 py-5">
              <MetricLabel>Avg deal</MetricLabel>
              <MetricValue>{currencySymbol}{avgDeal >= 1000 ? Math.round(avgDeal / 1000) + 'K' : avgDeal}</MetricValue>
              <MetricSub>{accepted.length} won</MetricSub>
            </div>
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-12 gap-6">

          {/* ── Left: Proposals ── */}
          <div className="col-span-12 lg:col-span-8">

            {/* Quick actions — minimal text links */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">Proposals</span>
              <div className="flex-1 h-px bg-parchment" />
              <Link to="/proposals/new" className="text-[11px] font-medium text-ink-muted hover:text-ink transition-colors">New</Link>
              <button onClick={() => setShowBundlePicker(true)} className="text-[11px] font-medium text-ink-muted hover:text-ink transition-colors">From bundle</button>
              <button onClick={() => setShowClientPicker(true)} className="text-[11px] font-medium text-ink-muted hover:text-ink transition-colors">Repeat</button>
            </div>

            {/* Proposal cards */}
            <div className="space-y-2.5">
              {loadingProposals ? (
                [1, 2, 3].map(i => <div key={i} className="h-[80px] animate-pulse rounded-[12px] bg-parchment-soft" />)
              ) : recentProposals.length === 0 ? (
                <div className="rounded-[12px] bg-paper p-12 text-center shadow-card">
                  <FileText className="mx-auto h-8 w-8 text-ink-faint" />
                  <p className="mt-3 text-sm font-semibold text-ink">No proposals yet</p>
                  <p className="mt-1 text-xs text-ink-muted">Create your first proposal to get started</p>
                  <Link to="/proposals/new" className="mt-4 inline-flex items-center gap-2 rounded-[8px] bg-ink px-4 py-2 text-sm font-medium text-ivory">
                    <Plus className="h-4 w-4" /> New Proposal
                  </Link>
                </div>
              ) : (
                recentProposals.map((p: any) => {
                  const sc = statusConfig[p.status || 'draft'] || statusConfig.draft;
                  const fixedTotal = p.total_fixed || p.grand_total || 0;
                  const monthlyTotal = p.total_monthly || 0;
                  const initial = (p.client?.company_name || '?').charAt(0).toUpperCase();
                  const refNum = p.reference_number || '';
                  const isHot = p.status === 'viewed';

                  return (
                    <Link
                      key={p.id}
                      to={`/proposals/${p.id}`}
                      className="group flex items-center gap-4 rounded-[12px] bg-paper px-5 py-4 shadow-card transition-all duration-200 hover:-translate-y-px hover:shadow-card-hover"
                    >
                      {/* Client monogram */}
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-cream">
                        <span className="text-[15px] font-bold text-ink">{initial}</span>
                        <span className="text-[7px] font-medium uppercase text-ink-faint">{refNum.slice(-4)}</span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-ink">{p.client?.company_name || 'Unknown Client'}</span>
                          {isHot && (
                            <span className="h-[6px] w-[6px] rounded-full bg-brass" style={{ boxShadow: '0 0 6px #ffb18060' }} />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-ink-muted">{p.title || 'Untitled Proposal'}</p>
                      </div>

                      {/* Status badge */}
                      <div className="flex shrink-0 items-center gap-1.5 rounded-[6px] px-2.5 py-1" style={{ background: sc.bgColor }}>
                        <div className="h-[5px] w-[5px] rounded-full" style={{ background: sc.dotColor }} />
                        <span className="text-[11px] font-medium" style={{ color: sc.dotColor }}>{sc.label}</span>
                      </div>

                      {/* Value */}
                      <div className="w-24 shrink-0 text-right" style={{ borderLeft: '1px solid hsl(var(--parchment))', paddingLeft: '16px' }}>
                        <p className="text-[16px] font-bold tabular-nums text-ink">{currencySymbol}{fixedTotal.toLocaleString()}</p>
                        {monthlyTotal > 0 && (
                          <p className="text-[10px] text-ink-faint">+ {currencySymbol}{monthlyTotal.toLocaleString()}/mo</p>
                        )}
                      </div>

                      {/* Time */}
                      <span className="w-12 shrink-0 text-right text-[10px] text-ink-faint">
                        {formatDistanceToNow(new Date(p.updated_at || p.created_at), { addSuffix: false })}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            {/* View all link */}
            {recentProposals.length > 0 && (
              <div className="mt-3 text-right">
                <Link to="/proposals" className="text-[11px] font-medium text-ink-muted hover:text-ink transition-colors">View all proposals →</Link>
              </div>
            )}

            {/* Service chips — Quick Start */}
            {modules.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">Quick start</span>
                  <div className="flex-1 h-px bg-parchment" />
                  {selectedServiceIds.size > 0 && (
                    <button
                      onClick={handleCreateFromServices}
                      className="rounded-[8px] bg-ink px-3 py-1.5 text-[11px] font-medium text-ivory transition-colors hover:bg-ink-soft"
                    >
                      Create proposal ({selectedServiceIds.size}) →
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {modules.slice(0, 6).map((m: any) => {
                    const isSelected = selectedServiceIds.has(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleService(m.id)}
                        className="transition-all duration-150"
                        style={{
                          borderRadius: '7px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: isSelected ? 600 : 500,
                          background: isSelected ? '#2A2118' : '#FFFFFF',
                          color: isSelected ? '#FAF9F6' : '#4A3F32',
                          boxShadow: isSelected ? 'none' : '0 1px 3px rgba(42,33,24,0.05), 0 1px 2px rgba(42,33,24,0.03)',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Context ── */}
          <div className="col-span-12 space-y-5 lg:col-span-4">

            {/* Activity */}
            <div className="rounded-[12px] bg-paper p-5 shadow-card">
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">Activity</p>
              {activityEvents.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-ink-muted">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activityEvents.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="mt-1.5 shrink-0">
                        <div className="h-[5px] w-[5px] rounded-full" style={{ background: event.dotColor }} />
                      </div>
                      <div>
                        <p className="text-[12px] leading-relaxed text-ink-soft">
                          <span className="font-medium">{event.client}</span>
                          <span className="text-ink-muted"> — {event.statusLabel}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-faint">
                          {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance (Top services) */}
            {topModules.length > 0 && (
              <div className="rounded-[12px] bg-paper p-5 shadow-card">
                <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">Performance</p>
                <div className="space-y-3">
                  {topModules.map((s: any, i: number) => (
                    <div key={s.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-ink-soft">{s.name}</span>
                        <span className="text-[11px] tabular-nums text-ink-muted">{s.count}</span>
                      </div>
                      <div className="h-[3px] rounded-full bg-parchment">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${maxCount > 0 ? (s.count / maxCount) * 100 : 0}%`,
                            background: '#2A2118',
                            opacity: i === 0 ? 0.35 : 0.15 + (0.05 * (3 - i)),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insight card — THE ONE DARK ELEMENT */}
            <div className="relative overflow-hidden rounded-[12px] p-5" style={{ background: '#2A2118' }}>
              {/* Brass top line */}
              <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #ffb180, transparent)' }} />
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">Insight</p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#B8B0A5' }}>
                Agencies using <span className="font-semibold" style={{ color: '#FAF9F6' }}>service bundles</span> close{' '}
                <span className="font-semibold" style={{ color: '#ffb180' }}>23% larger deals</span> on average.
              </p>
              <Link to="/bundles" className="mt-3 inline-block text-[11px] font-medium text-brass transition-colors hover:opacity-80">
                Create a bundle →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Picker Modal */}
      {showBundlePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm" onClick={() => setShowBundlePicker(false)}>
          <div className="w-full max-w-md rounded-[12px] bg-paper p-6 shadow-card-hover" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink mb-4">Choose a Package</h3>
            {bundles.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">No packages created yet.</p>
            ) : (
              <div className="space-y-2">
                {bundles.map((b: any) => (
                  <button key={b.id} onClick={() => { setShowBundlePicker(false); navigate(`/proposals/new?bundle=${b.id}`); }}
                    className="flex w-full items-center justify-between rounded-[10px] bg-paper p-4 text-left shadow-card transition-all duration-200 hover:shadow-card-hover">
                    <div>
                      <p className="text-sm font-semibold text-ink">{b.name}</p>
                      <p className="text-xs text-ink-muted">{currencySymbol}{(b.bundle_price || 0).toLocaleString()}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-faint" />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowBundlePicker(false)} className="mt-4 w-full rounded-[8px] py-2 text-sm text-ink-muted hover:text-ink" style={{ border: '1px solid hsl(var(--parchment))' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Client Repeat Picker Modal */}
      {showClientPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm" onClick={() => setShowClientPicker(false)}>
          <div className="w-full max-w-md rounded-[12px] bg-paper p-6 shadow-card-hover" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink mb-4">Repeat for Client</h3>
            <input type="text" placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              className="mb-3 w-full rounded-[8px] bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brass/30" />
            {filteredClients.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">No clients found</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredClients.map((c: any) => (
                  <button key={c.id} onClick={() => { setShowClientPicker(false); navigate(`/proposals/new?client=${c.id}&repeat=true`); }}
                    className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-parchment-soft">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-cream text-xs font-semibold text-ink">
                      {c.company_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{c.company_name}</p>
                      {c.contact_name && <p className="text-xs text-ink-muted">{c.contact_name}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowClientPicker(false)} className="mt-4 w-full rounded-[8px] py-2 text-sm text-ink-muted hover:text-ink" style={{ border: '1px solid hsl(var(--parchment))' }}>Cancel</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ── Metric helpers ── */
function MetricLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">{children}</p>;
}
function MetricValue({ children }: { children: React.ReactNode }) {
  return <p className="text-[22px] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink">{children}</p>;
}
function MetricSub({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] font-medium text-ink-muted">{children}</p>;
}
