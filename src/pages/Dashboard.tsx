import { useState } from 'react';
import {
  FileText, Send, Trophy, DollarSign, Plus, ArrowRight, Users, Layers,
  ChevronRight, Eye, Check, X, Clock, Bell,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProposals, useDashboardStats, useBundles, useClients, useServiceModules } from '@/hooks/useAgencyData';
import { formatDistanceToNow } from 'date-fns';

/* ── Status: dot + label only (V3: minimal, no pill backgrounds) ── */
const statusConfig: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draft',   color: 'hsl(var(--status-draft))' },
  sent:     { label: 'Sent',    color: 'hsl(var(--status-sent))' },
  viewed:   { label: 'Viewed',  color: 'hsl(var(--status-viewed))' },
  accepted: { label: 'Won',     color: 'hsl(var(--status-accepted))' },
  declined: { label: 'Lost',    color: 'hsl(var(--status-declined))' },
  expired:  { label: 'Expired', color: 'hsl(var(--status-draft))' },
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
  const monthProposals = proposals.filter((p: any) => new Date(p.created_at) >= thisMonth);
  const monthWon = monthProposals.filter((p: any) => p.status === 'accepted');
  const monthRevenue = monthWon.reduce((s: number, p: any) => s + (p.grand_total || 0), 0);

  // Activity feed
  const activityEvents = proposals
    .filter((p: any) => p.status !== 'draft')
    .slice(0, 4)
    .map((p: any) => {
      const status = p.status || 'sent';
      const date = p.sent_at || p.viewed_at || p.accepted_at || p.created_at;
      return {
        id: p.id,
        client: p.client?.company_name || 'Unknown',
        status,
        statusLabel: statusConfig[status]?.label || status,
        date,
        color: statusConfig[status]?.color || 'hsl(var(--status-draft))',
      };
    });

  // Top services (count how many proposals use each module)
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
            <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} · {currencySymbol}{pipelineValue.toLocaleString()} in pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-surface-card-alt">
              <Bell className="h-5 w-5" />
              {proposals.some((p: any) => p.status === 'viewed') && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
              )}
            </button>
            <Link
              to="/proposals/new"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-all hover:shadow-md"
              style={{ background: 'hsl(var(--surface-dark))' }}
            >
              <span className="text-[16px] font-light">+</span>
              New Proposal
            </Link>
          </div>
        </div>

        {/* ─── Metrics Row ─── */}
        <div className="mb-8 grid grid-cols-12 gap-4">
          {/* Dark summary card — 5 cols */}
          <div
            className="relative col-span-12 overflow-hidden rounded-2xl p-6 lg:col-span-5"
            style={{ background: 'linear-gradient(160deg, hsl(var(--surface-dark)), hsl(var(--surface-dark-end)))' }}
          >
            <div className="grid grid-cols-2 gap-6">
              <MetricBlock label="Pipeline" value={`${currencySymbol}${pipelineValue.toLocaleString()}`} sub={`${sentAndViewed.length} awaiting response`} highlight />
              <MetricBlock label="Won this month" value={`${currencySymbol}${monthRevenue.toLocaleString()}`} sub={`${monthWon.length} deal${monthWon.length !== 1 ? 's' : ''} closed`} highlight />
            </div>
            {/* Subtle decorative glow */}
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-brand opacity-[0.06] blur-[30px]" />
          </div>

          {/* Light metric cards — 7 cols */}
          <div className="col-span-12 grid grid-cols-3 gap-4 lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-5">
              <MetricBlock label="Win rate" value={`${winRate}%`} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <MetricBlock label="Avg deal" value={`${currencySymbol}${avgDeal >= 1000 ? Math.round(avgDeal / 1000) + 'K' : avgDeal}`} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <MetricBlock label="Total proposals" value={`${stats?.total || proposals.length}`} />
            </div>
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-12 gap-6">

          {/* ── Left: Proposals (the core) ── */}
          <div className="col-span-12 lg:col-span-8">

            {/* Quick actions — minimal inline buttons */}
            <div className="mb-4 flex items-center gap-2">
              <span className="mr-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Quick</span>
              <Link to="/proposals/new" className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:-translate-y-px hover:text-foreground">
                <span className="opacity-50">+</span> New proposal
              </Link>
              <button onClick={() => setShowBundlePicker(true)} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:-translate-y-px hover:text-foreground">
                <span className="opacity-50">◇</span> From package
              </button>
              <button onClick={() => setShowClientPicker(true)} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:-translate-y-px hover:text-foreground">
                <span className="opacity-50">↺</span> Repeat for client
              </button>
            </div>

            {/* Proposal list — contained card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Recent proposals</span>
                <Link to="/proposals" className="text-[11px] font-medium text-brand-text hover:text-brand-hover transition-colors">View all →</Link>
              </div>

              {loadingProposals ? (
                <div className="space-y-0">{[1, 2, 3].map(i => <div key={i} className="h-[68px] animate-pulse border-b border-border/40 bg-surface-card-alt" />)}</div>
              ) : recentProposals.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">No proposals yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create your first proposal to get started</p>
                  <Link to="/proposals/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white">
                    <Plus className="h-4 w-4" /> New Proposal
                  </Link>
                </div>
              ) : (
                recentProposals.map((p: any, i: number) => {
                  const sc = statusConfig[p.status || 'draft'] || statusConfig.draft;
                  const fixedTotal = p.total_fixed || p.grand_total || 0;
                  const monthlyTotal = p.total_monthly || 0;
                  const initials = (p.client?.company_name || '??').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <Link
                      key={p.id}
                      to={`/proposals/${p.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-all duration-150 hover:bg-black/[0.015]"
                      style={{ borderBottom: i < recentProposals.length - 1 ? '1px solid hsl(var(--border-soft))' : 'none' }}
                    >
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-[11px] font-semibold text-muted-foreground">
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{p.client?.company_name || 'Unknown Client'}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{p.reference_number}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{p.title || 'Untitled Proposal'}</p>
                      </div>

                      {/* Status dot + label */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: sc.color }} />
                        <span className="text-[11px] font-medium" style={{ color: sc.color }}>{sc.label}</span>
                      </div>

                      {/* Value */}
                      <div className="w-24 shrink-0 text-right">
                        <p className="text-[14px] font-semibold tabular-nums text-foreground">{currencySymbol}{fixedTotal.toLocaleString()}</p>
                        {monthlyTotal > 0 && (
                          <p className="text-[10px] text-muted-foreground">+ {currencySymbol}{monthlyTotal.toLocaleString()}/mo</p>
                        )}
                      </div>

                      {/* Time */}
                      <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(p.updated_at || p.created_at), { addSuffix: false })}
                      </span>

                      {/* Hover arrow */}
                      <span className="shrink-0 text-[14px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-40">→</span>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Service quick select */}
            {modules.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Services</span>
                  {selectedServiceIds.size > 0 && (
                    <button
                      onClick={handleCreateFromServices}
                      className="ml-auto rounded-md bg-brand px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-brand-hover"
                    >
                      Create with {selectedServiceIds.size} →
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
                        className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-150"
                        style={{
                          background: isSelected ? 'hsl(var(--surface-dark))' : 'hsl(var(--surface-card))',
                          color: isSelected ? 'white' : 'hsl(var(--text-secondary))',
                          border: `1px solid ${isSelected ? 'hsl(var(--surface-dark))' : 'hsl(var(--border-default))'}`,
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
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Activity</p>
              {activityEvents.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {activityEvents.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="mt-1.5 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: event.color }} />
                      </div>
                      <div>
                        <p className="text-[12px] leading-relaxed text-foreground">
                          <span className="font-medium">{event.client}</span>
                          <span className="text-muted-foreground"> — {event.statusLabel}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top services */}
            {topModules.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Top services</p>
                <div className="space-y-3">
                  {topModules.map((s: any, i: number) => (
                    <div key={s.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-foreground">{s.name}</span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{s.count} proposal{s.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'hsl(var(--border-soft))' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${maxCount > 0 ? (s.count / maxCount) * 100 : 0}%`,
                            background: i === 0 ? 'hsl(var(--surface-dark))' : 'hsl(var(--text-muted))',
                            opacity: i === 0 ? 1 : 0.4,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insight card — dark */}
            <div className="rounded-2xl p-5" style={{ background: 'hsl(var(--surface-dark))' }}>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Insight</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Agencies using <span className="font-semibold text-white">service bundles</span> close{' '}
                <span className="font-semibold text-white">23% larger deals</span> on average. Consider leading with a package.
              </p>
              <Link to="/bundles" className="mt-3 inline-block text-[11px] font-medium text-brand transition-colors hover:text-brand-hover">
                Create a bundle →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Picker Modal */}
      {showBundlePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowBundlePicker(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Choose a Package</h3>
            {bundles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No packages created yet.</p>
            ) : (
              <div className="space-y-2">
                {bundles.map((b: any) => (
                  <button key={b.id} onClick={() => { setShowBundlePicker(false); navigate(`/proposals/new?bundle=${b.id}`); }}
                    className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-all duration-200 hover:border-brand/30 hover:shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{currencySymbol}{(b.bundle_price || 0).toLocaleString()}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowBundlePicker(false)} className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Client Repeat Picker Modal */}
      {showClientPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowClientPicker(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Repeat for Client</h3>
            <input type="text" placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            {filteredClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No clients found</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredClients.map((c: any) => (
                  <button key={c.id} onClick={() => { setShowClientPicker(false); navigate(`/proposals/new?client=${c.id}&repeat=true`); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-xs font-semibold text-muted-foreground border border-border">
                      {c.company_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.company_name}</p>
                      {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowClientPicker(false)} className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ── Metric Block (reusable) ── */
function MetricBlock({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div>
      <p
        className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em]"
        style={{ color: highlight ? 'rgba(255,255,255,0.4)' : 'hsl(var(--text-muted))' }}
      >
        {label}
      </p>
      <p
        className="text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
        style={{ color: highlight ? 'white' : 'hsl(var(--text-primary))' }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[11px]" style={{ color: highlight ? 'rgba(255,255,255,0.55)' : 'hsl(var(--text-secondary))' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
