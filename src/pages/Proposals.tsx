import { AppShell } from '@/components/layout/AppShell';
import { mockProposals } from '@/lib/mockData';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProposalStatus } from '@/types';

const statusConfig: Record<ProposalStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-status-draft/15 text-status-draft' },
  sent: { label: 'Sent', className: 'bg-status-sent/15 text-status-sent' },
  viewed: { label: 'Viewed', className: 'bg-status-viewed/15 text-status-viewed' },
  accepted: { label: 'Accepted', className: 'bg-status-accepted/15 text-status-accepted' },
  declined: { label: 'Declined', className: 'bg-status-declined/15 text-status-declined' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

const filters: ProposalStatus[] = ['draft', 'sent', 'viewed', 'accepted', 'declined'];

export default function Proposals() {
  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
        <Link
          to="/proposals/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          New Proposal
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search proposals..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            All
          </button>
          {filters.map((f) => (
            <button
              key={f}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {statusConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Value</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</th>
              <th className="w-12 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {mockProposals.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/50">
                <td className="px-5 py-4">
                  <Link to={`/proposals/${p.id}`} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {p.client?.company_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.client?.company_name}</p>
                      <p className="text-xs text-muted-foreground">{p.title}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-muted-foreground">{p.reference_number}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig[p.status].className)}>
                    {statusConfig[p.status].label}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="text-sm font-semibold tabular-nums text-foreground">${p.grand_total.toLocaleString()}</span>
                  {p.total_monthly > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">+ ${p.total_monthly.toLocaleString()}/mo</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td className="px-5 py-4">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
