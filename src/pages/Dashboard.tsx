import { FileText, Send, Trophy, DollarSign, Eye, CheckCircle, XCircle, Clock, Plus, ArrowRight, Users, Layers } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { mockProposals, mockActivityFeed } from '@/lib/mockData';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ProposalStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const statusConfig: Record<ProposalStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-status-draft/15 text-status-draft' },
  sent: { label: 'Sent', className: 'bg-status-sent/15 text-status-sent' },
  viewed: { label: 'Viewed', className: 'bg-status-viewed/15 text-status-viewed' },
  accepted: { label: 'Accepted', className: 'bg-status-accepted/15 text-status-accepted' },
  declined: { label: 'Declined', className: 'bg-status-declined/15 text-status-declined' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

const activityIcons: Record<string, typeof Eye> = {
  viewed: Eye,
  accepted: CheckCircle,
  sent: Send,
  created: Plus,
  declined: XCircle,
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const firstName = userProfile?.full_name?.split(' ')[0] || 'there';
  const stats = [
    { label: 'Total Proposals', value: '47', sub: 'All time', icon: FileText, color: 'border-brand' },
    { label: 'Active Proposals', value: '8', sub: 'Sent & viewed', icon: Send, color: 'border-status-info' },
    { label: 'Win Rate', value: '68%', sub: 'Accepted / sent', icon: Trophy, color: 'border-status-success' },
    { label: 'Total Value', value: '$186,500', sub: 'Accepted proposals', icon: DollarSign, color: 'border-status-warning' },
  ];

  return (
    <AppShell>
      {/* Greeting */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your proposals</p>
        </div>
        <Link
          to="/proposals/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          New Proposal
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm',
              `border-l-[3px] ${stat.color}`
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-[1fr_380px] gap-6">
        {/* Recent Proposals */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Proposals</h2>
            <Link to="/proposals" className="flex items-center gap-1 text-sm text-brand hover:text-brand-hover">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {mockProposals.map((p, i) => (
              <Link
                key={p.id}
                to={`/proposals/${p.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {p.client?.company_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.client?.company_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.title}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{p.reference_number}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig[p.status].className)}>
                  {statusConfig[p.status].label}
                </span>
                <span className="min-w-[80px] text-right text-sm font-semibold tabular-nums text-foreground">
                  ${p.grand_total.toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Create Proposal', icon: FileText, path: '/proposals/new', desc: 'Start a new proposal' },
                { label: 'Add Client', icon: Users, path: '/clients', desc: 'Add to your client database' },
                { label: 'Manage Services', icon: Layers, path: '/services', desc: 'Edit your service catalog' },
              ].map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-brand/30 hover:shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <action.icon className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Recent Activity</h3>
            <div className="space-y-1">
              {mockActivityFeed.map((event) => {
                const Icon = activityIcons[event.type] || Clock;
                return (
                  <div key={event.id} className="flex gap-3 rounded-lg p-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{event.text}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
