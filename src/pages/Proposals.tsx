import { useState } from 'react';
import { syncProposalToHubSpot } from '@/lib/hubspotSync';
import { AppShell } from '@/components/layout/AppShell';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, FileText, Copy, Trash2, Send, Eye, LayoutList, Columns3 } from 'lucide-react';
import { HubSpotBadge } from '@/components/integrations/HubSpotBadge';
import { cn } from '@/lib/utils';
import { useProposals } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { FollowUpModal } from '@/components/proposals/FollowUpModal';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-status-draft/15 text-status-draft' },
  sent: { label: 'Sent', className: 'bg-status-sent/15 text-status-sent' },
  viewed: { label: 'Viewed', className: 'bg-status-viewed/15 text-status-viewed' },
  accepted: { label: 'Accepted', className: 'bg-status-accepted/15 text-status-accepted' },
  declined: { label: 'Declined', className: 'bg-status-declined/15 text-status-declined' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

const filters = ['all', 'draft', 'sent', 'viewed', 'accepted', 'declined'] as const;
const kanbanColumns = ['draft', 'sent', 'viewed', 'accepted', 'declined'] as const;

export default function Proposals() {
  const { agency, userProfile } = useAuth();
  const { data: proposals = [], isLoading } = useProposals();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [followUpProposal, setFollowUpProposal] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const currencySymbol = agency?.currency_symbol || '$';
  const { canCreateProposal, proposalsThisMonth, proposalLimit } = usePlan();

  const filtered = proposals.filter((p: any) => {
    const matchesSearch = !search ||
      p.client?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleDuplicate = async (p: any) => {
    if (!agency) return;
    const counter = (agency.proposal_counter || 0) + 1;
    const prefix = agency.proposal_prefix || 'PRO';
    const refNum = `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(4, '0')}`;

    const { data: newP, error } = await supabase.from('proposals').insert({
      agency_id: agency.id,
      client_id: p.client_id,
      reference_number: refNum,
      title: `${p.title || 'Proposal'} (Copy)`,
      subtitle: p.subtitle,
      status: 'draft',
      total_fixed: p.total_fixed,
      total_monthly: p.total_monthly,
      grand_total: p.grand_total,
      executive_summary: p.executive_summary,
      created_by: userProfile?.id,
      project_start_date: p.project_start_date,
      validity_days: p.validity_days,
      revision_rounds: p.revision_rounds,
      notice_period: p.notice_period,
      phases: p.phases,
    }).select('id').single();

    if (error) { toast.error('Failed to duplicate'); return; }

    const { data: svcs } = await supabase.from('proposal_services').select('*').eq('proposal_id', p.id);
    if (svcs?.length) {
      await supabase.from('proposal_services').insert(
        svcs.map((s: any) => ({ ...s, id: undefined, proposal_id: newP.id }))
      );
    }

    await supabase.from('agencies').update({ proposal_counter: counter }).eq('id', agency.id);
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    toast.success('Proposal duplicated');
    navigate(`/proposals/${newP.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this proposal?')) return;
    await supabase.from('proposal_services').delete().eq('proposal_id', id);
    await supabase.from('proposals').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    toast.success('Proposal deleted');
  };

  const handleStatusDrop = async (proposalId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'accepted') updates.accepted_at = new Date().toISOString();
    if (newStatus === 'declined') updates.declined_at = new Date().toISOString();
    if (newStatus === 'sent' && !proposals.find((p: any) => p.id === proposalId)?.sent_at) {
      updates.sent_at = new Date().toISOString();
    }
    await supabase.from('proposals').update(updates).eq('id', proposalId);
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    toast.success(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`);
  };

  const timeAgo = (date: string) => {
    if (!date) return '';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card">
            <button
              onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-sm transition-colors',
                viewMode === 'list' ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={cn('flex items-center gap-1.5 rounded-r-lg px-3 py-2 text-sm transition-colors',
                viewMode === 'pipeline' ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <Columns3 className="h-3.5 w-3.5" /> Pipeline
            </button>
          </div>
          <button
            onClick={() => {
              if (!canCreateProposal) { setShowUpgrade(true); return; }
              navigate('/proposals/new');
            }}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" /> New Proposal
          </button>
        </div>
      </div>

      {/* Search + Filters (list view only) */}
      {viewMode === 'list' && (
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </div>
          <div className="flex items-center gap-1.5">
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={cn('rounded-lg px-3 py-2 text-sm transition-colors', activeFilter === f
                  ? 'border border-border bg-card font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {f === 'all' ? 'All' : statusConfig[f]?.label || f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline search */}
      {viewMode === 'pipeline' && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />)}</div>
      ) : viewMode === 'pipeline' ? (
        /* Pipeline / Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const sc = statusConfig[col];
            const columnProposals = (search ? filtered : proposals).filter((p: any) => p.status === col);
            const totalValue = columnProposals.reduce((sum: number, p: any) => sum + (p.grand_total || 0), 0);
            return (
              <div
                key={col}
                className="min-w-[240px] flex-1 rounded-xl border border-border bg-muted/30 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('proposalId');
                  if (id) handleStatusDrop(id, col);
                }}
              >
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', sc.className)}>{sc.label}</span>
                    <span className="text-xs text-muted-foreground">{columnProposals.length}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {currencySymbol}{totalValue.toLocaleString()}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {columnProposals.map((p: any) => {
                    const daysInStage = Math.floor((Date.now() - new Date(p.updated_at || p.created_at).getTime()) / 86400000);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('proposalId', p.id)}
                        className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                      >
                        <Link to={`/proposals/${p.id}`} className="block">
                          <p className="text-sm font-medium text-foreground truncate">{p.client?.company_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{p.title || 'Untitled'}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {currencySymbol}{(p.grand_total || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{daysInStage}d</span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                  {columnProposals.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground">No proposals</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {search || activeFilter !== 'all' ? 'No proposals match your search' : 'No proposals yet'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || activeFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first proposal to get started'}
          </p>
          {!search && activeFilter === 'all' && (
            <button
              onClick={() => {
                if (!canCreateProposal) { setShowUpgrade(true); return; }
                navigate('/proposals/new');
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" /> New Proposal
            </button>
          )}
        </div>
      ) : (
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
              {filtered.map((p: any) => {
                const sc = statusConfig[p.status || 'draft'] || statusConfig.draft;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/50">
                    <td className="px-5 py-4">
                      <Link to={`/proposals/${p.id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {p.client?.company_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            {p.client?.company_name || 'Unknown'}
                            <HubSpotBadge hubspotId={p.hubspot_deal_id} type="deal" />
                          </p>
                          <p className="text-xs text-muted-foreground">{p.title || 'Untitled'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4"><span className="font-mono text-sm text-muted-foreground">{p.reference_number}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', sc.className)}>{sc.label}</span>
                        {p.status === 'viewed' && p.viewed_at && (
                          <span className="text-[10px] text-muted-foreground">{timeAgo(p.viewed_at)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">{currencySymbol}{(p.grand_total || 0).toLocaleString()}</span>
                      {(p.total_monthly || 0) > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">+ {currencySymbol}{p.total_monthly.toLocaleString()}/mo</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenu === p.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
                              <Link to={`/proposals/${p.id}`} onClick={() => setOpenMenu(null)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                <Eye className="h-3.5 w-3.5" /> View / Edit
                              </Link>
                              <button onClick={() => { handleDuplicate(p); setOpenMenu(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                <Copy className="h-3.5 w-3.5" /> Duplicate
                              </button>
                              {(p.status === 'sent' || p.status === 'viewed') && (
                                <button onClick={() => { setOpenMenu(null); setFollowUpProposal(p); }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                  <Send className="h-3.5 w-3.5" /> Follow Up
                                </button>
                              )}
                              <button onClick={() => { handleDelete(p.id); setOpenMenu(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Follow Up Modal */}
      {followUpProposal && (
        <FollowUpModal
          proposal={followUpProposal}
          agency={agency}
          userProfile={userProfile}
          onClose={() => setFollowUpProposal(null)}
        />
      )}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        customReason={`You've used all ${proposalLimit} proposal${proposalLimit !== 1 ? 's' : ''} this month. Upgrade to create more.`}
        feature="pdf_export"
      />
    </AppShell>
  );
}
