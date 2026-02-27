import { useState } from 'react';
import {
  FileText, Send, Trophy, DollarSign, Plus, ArrowRight, Users, Layers, Package,
  ChevronRight, TrendingUp, TrendingDown, Eye, Check, X, Clock, Zap, Bell,
  BarChart3,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProposals, useDashboardStats, useBundles, useClients, useServiceModules } from '@/hooks/useAgencyData';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { label: string; icon: any; bg: string; text: string }> = {
  draft: { label: 'Draft', icon: FileText, bg: '#F3F2F0', text: '#A8A49E' },
  sent: { label: 'Sent', icon: Send, bg: '#EFF6FF', text: '#3B82F6' },
  viewed: { label: 'Viewed', icon: Eye, bg: '#F5F3FF', text: '#8B5CF6' },
  accepted: { label: 'Won', icon: Check, bg: '#F0FDF4', text: '#22C55E' },
  declined: { label: 'Declined', icon: X, bg: '#FEF2F2', text: '#EF4444' },
  expired: { label: 'Expired', icon: Clock, bg: '#F3F2F0', text: '#A8A49E' },
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
  const monthSent = monthProposals.filter((p: any) => p.status !== 'draft').length;
  const monthAwaiting = monthProposals.filter((p: any) => p.status === 'sent').length;
  const monthWon = monthProposals.filter((p: any) => p.status === 'accepted');
  const monthRevenue = monthWon.reduce((s: number, p: any) => s + (p.grand_total || 0), 0);

  // Activity feed — recent events
  const activityEvents = proposals
    .filter((p: any) => p.status !== 'draft')
    .slice(0, 5)
    .map((p: any) => {
      const status = p.status || 'sent';
      const date = p.sent_at || p.viewed_at || p.accepted_at || p.created_at;
      return {
        id: p.id,
        client: p.client?.company_name || 'Unknown',
        status,
        date,
        value: p.grand_total || 0,
      };
    });

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

  const activityIconConfig: Record<string, { bg: string; icon: any }> = {
    sent: { bg: '#3B82F6', icon: Send },
    viewed: { bg: '#8B5CF6', icon: Eye },
    accepted: { bg: '#22C55E', icon: Check },
    declined: { bg: '#EF4444', icon: X },
  };

  return (
    <AppShell hideHeader>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">{getGreeting()}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your proposal pipeline at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-xl p-2.5 text-muted-foreground transition-all duration-200 hover:bg-card">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />
          </button>
          <Link to="/proposals/new" className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-lg">
            <Plus className="h-4 w-4" /> New Proposal
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hero Card — Pipeline */}
        <div className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ background: 'linear-gradient(145deg, #fc956e, #e87a52)' }}>
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-[28px] font-bold tabular-nums text-white">{currencySymbol}{pipelineValue.toLocaleString()}</p>
          <p className="mt-1 text-[13px] font-medium text-white/80">Sent & viewed proposals</p>
        </div>

        {/* Dark Card — Win Rate */}
        <div className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ background: 'linear-gradient(145deg, #1A1917, #2A2925)' }}>
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Trophy className="h-5 w-5 text-white" />
            </div>
            {winRate > 0 && (
              <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(34,197,94,0.2)', color: '#22C55E' }}>
                <TrendingUp className="h-3 w-3" /> {winRate}%
              </span>
            )}
          </div>
          <p className="mt-4 text-[28px] font-bold tabular-nums text-white">{winRate}%</p>
          <p className="mt-1 text-[13px] font-medium text-white/60">Accepted / total sent</p>
        </div>

        {/* Light Card — Avg Deal Size */}
        <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
              <BarChart3 className="h-5 w-5 text-brand" />
            </div>
          </div>
          <p className="mt-4 text-[28px] font-bold tabular-nums text-foreground">{currencySymbol}{avgDeal.toLocaleString()}</p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">Average deal size</p>
        </div>

        {/* Light Card — Active Proposals */}
        <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Send className="h-5 w-5 text-accent-foreground" />
            </div>
          </div>
          <p className="mt-4 text-[28px] font-bold tabular-nums text-foreground">{sentAndViewed.length}</p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">Awaiting response</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Create */}
          <div>
            <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Quick Create</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link to="/proposals/new" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #fc956e, #e87a52)' }}>
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">New Proposal</p>
                  <p className="text-[11px] text-muted-foreground">Blank canvas</p>
                </div>
              </Link>
              <button onClick={() => setShowBundlePicker(true)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Use a Package</p>
                  <p className="text-[11px] text-muted-foreground">Pre-selected services</p>
                </div>
              </button>
              <button onClick={() => setShowClientPicker(true)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Repeat for Client</p>
                  <p className="text-[11px] text-muted-foreground">Same as last proposal</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Proposals */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent Proposals</h2>
              <Link to="/proposals" className="flex items-center gap-1 text-sm text-brand hover:text-brand-hover transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loadingProposals ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />)}</div>
            ) : recentProposals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">No proposals yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create your first proposal to get started</p>
                <Link to="/proposals/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
                  <Plus className="h-4 w-4" /> New Proposal
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProposals.map((p: any) => {
                  const sc = statusConfig[p.status || 'draft'] || statusConfig.draft;
                  const StatusIcon = sc.icon;
                  const monthlyTotal = p.total_monthly || 0;
                  const fixedTotal = p.total_fixed || p.grand_total || 0;
                  return (
                    <Link key={p.id} to={`/proposals/${p.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:bg-card/80 hover:shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-brand" style={{ background: 'rgba(252,149,110,0.15)' }}>
                        {p.client?.company_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-foreground">{p.client?.company_name || 'Unknown Client'}</p>
                          <span className="font-mono text-[11px] text-muted-foreground">{p.reference_number}</span>
                        </div>
                        <p className="truncate text-[12px] text-muted-foreground">{p.title || 'Untitled Proposal'}</p>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium" style={{ background: sc.bg, color: sc.text }}>
                        <StatusIcon className="h-3 w-3" />
                        {sc.label}
                      </span>
                      <div className="min-w-[90px] text-right">
                        <p className="text-[15px] font-bold tabular-nums text-foreground">{currencySymbol}{fixedTotal.toLocaleString()}</p>
                        {monthlyTotal > 0 && (
                          <p className="text-[11px] text-muted-foreground">+ {currencySymbol}{monthlyTotal.toLocaleString()}/mo</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(p.updated_at || p.created_at), { addSuffix: true })}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Select Services */}
          {modules.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Quick Select Services</h2>
                {selectedServiceIds.size > 0 && (
                  <button
                    onClick={handleCreateFromServices}
                    className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-[12px] font-medium text-primary-foreground hover:bg-brand-hover transition-all duration-200"
                  >
                    Create with {selectedServiceIds.size} service{selectedServiceIds.size > 1 ? 's' : ''} <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {modules.slice(0, 6).map((m: any) => {
                  const isSelected = selectedServiceIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleService(m.id)}
                      className={cn(
                        'rounded-xl px-3.5 py-2 text-[12px] font-medium transition-all duration-200',
                        isSelected
                          ? 'bg-brand text-white shadow-[0_2px_8px_rgba(252,149,110,0.3)]'
                          : 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                      )}
                    >
                      {isSelected && <Check className="mr-1 inline h-3 w-3" />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Activity Feed */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">Activity</h3>
            {activityEvents.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activityEvents.map((event) => {
                  const config = activityIconConfig[event.status] || activityIconConfig.sent;
                  const EventIcon = config.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: config.bg }}>
                        <EventIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-foreground">
                          <span className="font-medium">{event.client}</span>
                          <span className="text-muted-foreground"> — {event.status}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* This Month */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">This Month</h3>
            <div className="space-y-0 divide-y divide-border">
              <div className="pb-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Proposals Sent</p>
                <p className="text-[18px] font-bold text-foreground">{monthSent}</p>
                <p className="text-[11px] text-muted-foreground">{monthAwaiting} awaiting response</p>
              </div>
              <div className="py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Revenue Won</p>
                <p className="text-[18px] font-bold text-foreground">{currencySymbol}{monthRevenue.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{monthWon.length} deal{monthWon.length !== 1 ? 's' : ''} closed</p>
              </div>
              <div className="pt-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Proposals</p>
                <p className="text-[18px] font-bold text-foreground">{stats?.total || 0}</p>
                <p className="text-[11px] text-muted-foreground">All time</p>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg, #fff8f5, #FFF1EB)', borderColor: 'rgba(252,149,110,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3.5 w-3.5 text-brand-hover" />
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-hover">Tip</p>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">
              Agencies using bundles close <strong>23% larger deals</strong> on average.
            </p>
            <Link to="/bundles" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-hover transition-colors">
              Create a bundle <ArrowRight className="h-3 w-3" />
            </Link>
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
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
