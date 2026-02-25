import { useState } from 'react';
import { FileText, Send, Trophy, DollarSign, Plus, ArrowRight, Users, Layers, Package, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProposals, useDashboardStats, useBundles, useClients } from '@/hooks/useAgencyData';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-status-draft/15 text-status-draft' },
  sent: { label: 'Sent', className: 'bg-status-sent/15 text-status-sent' },
  viewed: { label: 'Viewed', className: 'bg-status-viewed/15 text-status-viewed' },
  accepted: { label: 'Accepted', className: 'bg-status-accepted/15 text-status-accepted' },
  declined: { label: 'Declined', className: 'bg-status-declined/15 text-status-declined' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
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
  const navigate = useNavigate();
  const firstName = userProfile?.full_name?.split(' ')[0] || 'there';
  const currencySymbol = agency?.currency_symbol || '$';

  const [showBundlePicker, setShowBundlePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const recentProposals = proposals.slice(0, 5);

  const statCards = [
    { label: 'Total Proposals', value: String(stats?.total || 0), sub: 'All time', icon: FileText, color: 'border-brand' },
    { label: 'Active Proposals', value: String(stats?.active || 0), sub: 'Sent & viewed', icon: Send, color: 'border-status-info' },
    { label: 'Win Rate', value: `${stats?.winRate || 0}%`, sub: 'Accepted / sent', icon: Trophy, color: 'border-status-success' },
    { label: 'Total Value', value: `${currencySymbol}${(stats?.totalValue || 0).toLocaleString()}`, sub: 'Accepted proposals', icon: DollarSign, color: 'border-status-warning' },
  ];

  const filteredClients = clientSearch
    ? clients.filter((c: any) => c.company_name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5)
    : clients.slice(0, 5);

  return (
    <AppShell>
      {/* Greeting */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your proposals</p>
        </div>
        <Link to="/proposals/new" className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> New Proposal
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={cn('rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm', `border-l-[3px] ${stat.color}`)}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Create Section */}
      <div className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Create</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/proposals/new" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-brand/30 hover:shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
              <FileText className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">New Proposal</p>
              <p className="text-xs text-muted-foreground">Blank canvas</p>
            </div>
          </Link>
          <button onClick={() => setShowBundlePicker(true)} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-brand/30 hover:shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
              <Layers className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Use a Package</p>
              <p className="text-xs text-muted-foreground">Pre-selected services</p>
            </div>
          </button>
          <button onClick={() => setShowClientPicker(true)} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-brand/30 hover:shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Repeat for Client</p>
              <p className="text-xs text-muted-foreground">Same services as last proposal</p>
            </div>
          </button>
        </div>
      </div>

      {/* Bundle Quick Start */}
      {bundles.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Your Packages</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {bundles.map((b: any) => (
              <button
                key={b.id}
                onClick={() => navigate(`/proposals/new?bundle=${b.id}`)}
                className="min-w-[220px] flex-shrink-0 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-brand/30 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent-foreground" />
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                </div>
                {b.tagline && <p className="mt-1 text-xs text-muted-foreground">{b.tagline}</p>}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-base font-bold tabular-nums text-foreground">{currencySymbol}{(b.bundle_price || 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{(b.bundle_modules || []).length} services</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Proposals */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Proposals</h2>
          <Link to="/proposals" className="flex items-center gap-1 text-sm text-brand hover:text-brand-hover">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loadingProposals ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />)}</div>
        ) : recentProposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No proposals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first proposal to get started</p>
            <Link to="/proposals/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
              <Plus className="h-4 w-4" /> New Proposal
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentProposals.map((p: any) => {
              const sc = statusConfig[p.status || 'draft'] || statusConfig.draft;
              return (
                <Link key={p.id} to={`/proposals/${p.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {p.client?.company_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.client?.company_name || 'Unknown Client'}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.title || 'Untitled Proposal'}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{p.reference_number}</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', sc.className)}>{sc.label}</span>
                  <span className="min-w-[80px] text-right text-sm font-semibold tabular-nums text-foreground">
                    {currencySymbol}{(p.grand_total || 0).toLocaleString()}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bundle Picker Modal */}
      {showBundlePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowBundlePicker(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Choose a Package</h3>
            {bundles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No packages created yet. Create one in Bundles.</p>
            ) : (
              <div className="space-y-2">
                {bundles.map((b: any) => (
                  <button key={b.id} onClick={() => { setShowBundlePicker(false); navigate(`/proposals/new?bundle=${b.id}`); }}
                    className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-all hover:border-brand/30">
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
