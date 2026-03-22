import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MoreVertical, Users, X, LayoutGrid, List, Loader2,
  Globe, ArrowLeft, Pencil, Trash2, FileText, ScanSearch, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClients, useProposals } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlan } from '@/hooks/usePlan';
import { UpgradeModal } from '@/components/UpgradeModal';

/* ─── Status dot colors ─── */
const statusDot: Record<string, string> = {
  draft: '#B8B0A5', sent: '#5B8DEF', viewed: '#9B7FD4', accepted: '#6BAF7B', declined: '#C27878',
};

/* ─── Time ago helper ─── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/* ─── Client Detail Panel ─── */
function ClientDetail({ client, proposals, currencySymbol, onClose, onEdit, onScan, onRefresh }: {
  client: any; proposals: any[]; currencySymbol: string;
  onClose: () => void; onEdit: () => void; onScan: () => void; onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const clientProposals = proposals
    .filter((p: any) => p.client_id === client.id)
    .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const totalValue = clientProposals.reduce((s: number, p: any) => s + (p.grand_total || 0), 0);

  const [editingAbout, setEditingAbout] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(client.about_summary || '');
  const [notesDraft, setNotesDraft] = useState(client.notes || '');

  const saveField = async (field: string, value: string) => {
    await supabase.from('clients').update({ [field]: value || null }).eq('id', client.id);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <button onClick={onClose} className="mb-5 flex items-center gap-1.5 text-[13px] text-[hsl(24,8%,49%)] hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.company_name} className="h-12 w-12 rounded-lg object-contain bg-[hsl(34,14%,95%)]" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(34,14%,95%)] text-[16px] font-bold text-[hsl(24,19%,24%)]">
                {client.company_name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-[hsl(24,19%,24%)]">{client.company_name}</h2>
              <div className="flex items-center gap-2 text-[12px] text-[hsl(24,8%,49%)]">
                {client.industry && <span>{client.industry}</span>}
                {client.industry && client.website && <span>·</span>}
                {client.website && (
                  <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                    {client.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          {(client.contact_name || client.contact_email || client.phone) && (
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(24,8%,49%)] mb-2">Contact</p>
              {client.contact_name && (
                <p className="text-[13px] text-[hsl(24,19%,24%)]">
                  {client.contact_name}{client.contact_title ? ` · ${client.contact_title}` : ''}
                </p>
              )}
              {client.contact_email && (
                <a href={`mailto:${client.contact_email}`} className="text-[12px] text-[hsl(24,8%,49%)] hover:underline">{client.contact_email}</a>
              )}
              {client.phone && <p className="text-[12px] text-[hsl(24,8%,49%)]">{client.phone}</p>}
            </div>
          )}

          {/* About */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(24,8%,49%)]">About</p>
              <button onClick={() => { setEditingAbout(!editingAbout); setAboutDraft(client.about_summary || ''); }} className="text-[11px] text-[hsl(24,8%,49%)] hover:text-foreground">
                {editingAbout ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingAbout ? (
              <div>
                <textarea value={aboutDraft} onChange={e => setAboutDraft(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-brand focus:outline-none" />
                <button onClick={() => { saveField('about_summary', aboutDraft); setEditingAbout(false); }}
                  className="mt-1 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-brand-hover">Save</button>
              </div>
            ) : (
              <p className="text-[13px] text-[hsl(24,19%,24%)] leading-relaxed italic">
                {client.about_summary || <span className="not-italic text-[hsl(30,8%,71%)]">No summary yet. {client.website && <button onClick={onScan} className="underline hover:text-foreground">Scan website to generate.</button>}</span>}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(24,8%,49%)]">Notes</p>
              <button onClick={() => { setEditingNotes(!editingNotes); setNotesDraft(client.notes || ''); }} className="text-[11px] text-[hsl(24,8%,49%)] hover:text-foreground">
                {editingNotes ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingNotes ? (
              <div>
                <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:border-brand focus:outline-none" />
                <button onClick={() => { saveField('notes', notesDraft); setEditingNotes(false); }}
                  className="mt-1 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-brand-hover">Save</button>
              </div>
            ) : (
              <p className="text-[13px] text-[hsl(24,19%,24%)] leading-relaxed italic">
                {client.notes || <span className="not-italic text-[hsl(30,8%,71%)]">No notes yet.</span>}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-[hsl(34,14%,91%)]" />

          {/* Proposals */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(24,8%,49%)] mb-3">
              Proposals ({clientProposals.length})
              {totalValue > 0 && <span className="ml-2 normal-case font-normal">· {currencySymbol}{totalValue.toLocaleString()} total</span>}
            </p>
            {clientProposals.length === 0 ? (
              <p className="text-[12px] text-[hsl(30,8%,71%)]">No proposals yet.</p>
            ) : (
              <div className="space-y-2">
                {clientProposals.map((p: any) => (
                  <button key={p.id} onClick={() => navigate(`/proposals/${p.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-[hsl(34,14%,91%)] p-3 text-left transition-colors hover:bg-[hsl(40,20%,97%)]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[hsl(24,19%,24%)]">{p.title || p.reference_number}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[hsl(24,8%,49%)]">
                        {p.grand_total > 0 && <span>{currencySymbol}{p.grand_total.toLocaleString()}</span>}
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: statusDot[p.status] || '#B8B0A5' }} />
                          {p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Draft'}
                        </span>
                        <span>· {timeAgo(p.updated_at)}</span>
                      </div>
                    </div>
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[hsl(30,8%,71%)]" />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => navigate(`/proposals/new?client=${client.id}`)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[hsl(34,14%,91%)] py-2.5 text-[12px] text-[hsl(24,8%,49%)] hover:border-[hsl(34,14%,83%)] hover:bg-[hsl(40,20%,97%)] transition-colors">
              <Plus className="h-3.5 w-3.5" /> Create new proposal for {client.company_name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Clients() {
  const { agency } = useAuth();
  const navigate = useNavigate();
  const { data: clients = [], isLoading } = useClients();
  const { data: proposals = [] } = useProposals();
  const queryClient = useQueryClient();
  const currencySymbol = agency?.currency_symbol || '$';
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ company_name: '', contact_name: '', contact_email: '', contact_title: '', website: '', industry: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('clients_view') as any) || 'grid');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canAddClient } = usePlan();

  useEffect(() => { localStorage.setItem('clients_view', viewMode); }, [viewMode]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clients'] });

  const filtered = clients.filter((c: any) =>
    !search || c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const getClientProposals = (clientId: string) =>
    proposals.filter((p: any) => p.client_id === clientId).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleAdd = async () => {
    if (!newClient.company_name || !agency?.id) return;
    setSaving(true);
    const { error } = await supabase.from('clients').insert({
      agency_id: agency.id, company_name: newClient.company_name,
      contact_name: newClient.contact_name || null, contact_email: newClient.contact_email || null,
      contact_title: newClient.contact_title || null, website: newClient.website || null,
      industry: newClient.industry || null, phone: newClient.phone || null,
    });
    setSaving(false);
    if (error) { toast.error('Failed to add client'); return; }
    toast.success('Client added');
    setNewClient({ company_name: '', contact_name: '', contact_email: '', contact_title: '', website: '', industry: '', phone: '' });
    setShowAdd(false);
    invalidate();
  };

  const handleDelete = async (client: any) => {
    if (!confirm(`Delete ${client.company_name}? This won't affect existing proposals for this client.`)) return;
    await supabase.from('clients').delete().eq('id', client.id);
    invalidate();
    toast.success('Client deleted');
    if (selectedClient?.id === client.id) setSelectedClient(null);
  };

  const handleScanWebsite = async (client: any) => {
    if (!client.website) { toast.error('No website URL set for this client'); return; }
    setScanningId(client.id);
    try {
      const url = client.website.startsWith('http') ? client.website : `https://${client.website}`;
      const { data: scrapeResult, error: scrapeErr } = await supabase.functions.invoke('scrape-website', { body: { url } });
      if (scrapeErr) throw scrapeErr;
      const scraped = scrapeResult;

      // Extract logo
      const logoUrl = scraped?.logo_url || scraped?.data?.logo_url || null;

      // Summarize for industry + about
      let industry = client.industry;
      let aboutSummary = client.about_summary;
      const scrapedText = scraped?.about_text || scraped?.data?.about_text || scraped?.meta_description || '';
      if (scrapedText) {
        const { data: summaryResult } = await supabase.functions.invoke('summarize-client', {
          body: { scraped_text: scrapedText, company_name: client.company_name },
        });
        if (summaryResult?.summary) aboutSummary = summaryResult.summary;
        if (summaryResult?.industry) industry = summaryResult.industry;
      }

      await supabase.from('clients').update({
        logo_url: logoUrl || client.logo_url,
        industry: industry || client.industry,
        about_summary: aboutSummary || client.about_summary,
      }).eq('id', client.id);

      invalidate();
      toast.success('Website scanned — client updated');
    } catch (e) {
      console.error(e);
      toast.error('Scan failed. Check the website URL.');
    }
    setScanningId(null);
  };

  const handleEditSave = async () => {
    if (!editClient) return;
    setSaving(true);
    await supabase.from('clients').update({
      company_name: editClient.company_name, contact_name: editClient.contact_name || null,
      contact_email: editClient.contact_email || null, contact_title: editClient.contact_title || null,
      website: editClient.website || null, industry: editClient.industry || null,
      phone: editClient.phone || null, address: editClient.address || null,
    }).eq('id', editClient.id);
    setSaving(false);
    setEditClient(null);
    invalidate();
    toast.success('Client updated');
  };

  const canScan = (c: any) => c.website && (!c.logo_url || !c.industry || !c.about_summary);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          {clients.length > 0 && (
            <span className="text-[13px] text-[hsl(24,8%,49%)]">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <button onClick={() => {
            if (!canAddClient(clients.length)) { setShowUpgrade(true); return; }
            setShowAdd(true);
          }}
          className="flex items-center gap-2 rounded-lg border border-[hsl(34,14%,91%)] bg-transparent px-4 py-2 text-[13px] font-medium text-[hsl(24,19%,24%)] transition-colors hover:bg-[hsl(40,20%,97%)] hover:border-[hsl(34,14%,83%)]">
          <Plus className="h-4 w-4 text-[hsl(24,8%,49%)]" /> Add Client
        </button>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="mb-6 rounded-xl border border-brand/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Client</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Company Name *" value={newClient.company_name} onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Contact Name" value={newClient.contact_name} onChange={e => setNewClient(p => ({ ...p, contact_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Contact Title" value={newClient.contact_title} onChange={e => setNewClient(p => ({ ...p, contact_title: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Email" value={newClient.contact_email} onChange={e => setNewClient(p => ({ ...p, contact_email: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Website" value={newClient.website} onChange={e => setNewClient(p => ({ ...p, website: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Industry" value={newClient.industry} onChange={e => setNewClient(p => ({ ...p, industry: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Phone" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancel</button>
            <button onClick={handleAdd} disabled={!newClient.company_name || saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </div>
      )}

      {/* Search + View Toggle */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="flex items-center rounded-lg border border-[hsl(34,14%,91%)]">
          <button onClick={() => setViewMode('grid')}
            className={cn('flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors', viewMode === 'grid' ? 'bg-[hsl(34,14%,95%)] text-[hsl(24,19%,24%)]' : 'text-[hsl(30,8%,71%)] hover:text-[hsl(24,8%,49%)]')}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={cn('flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors', viewMode === 'list' ? 'bg-[hsl(34,14%,95%)] text-[hsl(24,19%,24%)]' : 'text-[hsl(30,8%,71%)] hover:text-[hsl(24,8%,49%)]')}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-card" style={{ boxShadow: '0 1px 3px rgba(42,33,24,0.05)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Users className="mx-auto h-8 w-8 text-[hsl(30,8%,71%)]" />
          {search ? (
            <>
              <p className="mt-3 text-[13px] font-medium text-[hsl(24,19%,24%)]">No clients match your search</p>
              <p className="mt-1 text-[13px] text-[hsl(24,8%,49%)]">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-[13px] font-medium text-[hsl(24,19%,24%)]">No clients yet</p>
              <p className="mt-1.5 text-[13px] text-[hsl(24,8%,49%)] max-w-sm mx-auto">
                Clients are added automatically when you create proposals. You can also add them here to have them ready to go.
              </p>
              <button onClick={() => setShowAdd(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
                <Plus className="h-4 w-4" /> Add your first client
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client: any) => {
            const clientProps = getClientProposals(client.id);
            const totalValue = clientProps.reduce((s: number, p: any) => s + (p.grand_total || 0), 0);
            const latest = clientProps[0];
            const isScanning = scanningId === client.id;

            return (
              <div key={client.id}
                onClick={() => setSelectedClient(client)}
                className="cursor-pointer rounded-xl bg-card p-5 transition-all hover:translate-y-[-1px]"
                style={{ boxShadow: '0 1px 3px rgba(42,33,24,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(42,33,24,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(42,33,24,0.05)'; }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {client.logo_url ? (
                      <img src={client.logo_url} alt={client.company_name} className="h-10 w-10 rounded-lg object-contain bg-[hsl(34,14%,95%)]" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(34,14%,95%)] text-[14px] font-bold text-[hsl(24,19%,24%)]">
                        {client.company_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-[hsl(24,19%,24%)]">{client.company_name}</p>
                      {client.industry && <p className="text-[12px] text-[hsl(24,8%,49%)]">{client.industry}</p>}
                    </div>
                  </div>
                  <ClientMenu client={client} onEdit={() => setEditClient({ ...client })} onDelete={() => handleDelete(client)}
                    onCreateProposal={() => navigate(`/proposals/new?client=${client.id}`)} onScan={() => handleScanWebsite(client)}
                    onViewDetails={() => setSelectedClient(client)} />
                </div>

                {/* Contact */}
                {(client.contact_name || client.contact_email) && (
                  <div className="mt-3">
                    {client.contact_name && (
                      <p className="text-[13px] text-[hsl(24,19%,24%)]">
                        {client.contact_name}{client.contact_title ? ` · ${client.contact_title}` : ''}
                      </p>
                    )}
                    {client.contact_email && (
                      <a href={`mailto:${client.contact_email}`} onClick={e => e.stopPropagation()} className="text-[12px] text-[hsl(24,8%,49%)] hover:underline">{client.contact_email}</a>
                    )}
                  </div>
                )}

                {/* Scan prompt */}
                {canScan(client) && (
                  <button onClick={e => { e.stopPropagation(); handleScanWebsite(client); }} disabled={isScanning}
                    className="mt-2 flex items-center gap-1.5 text-[11px] text-[hsl(24,8%,49%)] hover:text-foreground transition-colors disabled:opacity-50">
                    {isScanning ? <><Loader2 className="h-3 w-3 animate-spin" /> Scanning...</> : <><ScanSearch className="h-3 w-3" /> Scan website to add logo & details</>}
                  </button>
                )}

                {/* Divider + Proposals */}
                <div className="mt-4 border-t border-[hsl(34,14%,91%)] pt-3">
                  {clientProps.length > 0 ? (
                    <>
                      <p className="text-[12px] text-[hsl(24,8%,49%)]">
                        {clientProps.length} proposal{clientProps.length !== 1 ? 's' : ''}
                        {totalValue > 0 && ` · ${currencySymbol}${totalValue.toLocaleString()} total value`}
                      </p>
                      {latest && (
                        <p className="mt-1 text-[12px] text-[hsl(24,8%,49%)] truncate flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ background: statusDot[latest.status] || '#B8B0A5' }} />
                          Latest: {latest.title || latest.reference_number} — {latest.status ? latest.status.charAt(0).toUpperCase() + latest.status.slice(1) : 'Draft'} {timeAgo(latest.updated_at)}
                        </p>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-[12px] text-[hsl(30,8%,71%)]">No proposals yet</p>
                      <button onClick={e => { e.stopPropagation(); navigate(`/proposals/new?client=${client.id}`); }}
                        className="mt-1 text-[12px] text-[hsl(24,8%,49%)] hover:text-foreground transition-colors">
                        Create proposal →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(42,33,24,0.05)' }}>
          {filtered.map((client: any, idx: number) => {
            const clientProps = getClientProposals(client.id);
            const totalValue = clientProps.reduce((s: number, p: any) => s + (p.grand_total || 0), 0);
            return (
              <div key={client.id}
                onClick={() => setSelectedClient(client)}
                className={cn('flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[hsl(40,20%,97%)]', idx > 0 && 'border-t border-[hsl(34,14%,91%)]')}>
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.company_name} className="h-9 w-9 shrink-0 rounded-lg object-contain bg-[hsl(34,14%,95%)]" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(34,14%,95%)] text-[13px] font-bold text-[hsl(24,19%,24%)]">
                    {client.company_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-[hsl(24,19%,24%)]">{client.company_name}</span>
                    {client.website && <span className="text-[12px] text-[hsl(24,8%,49%)]">{client.website.replace(/^https?:\/\//, '')}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[hsl(24,8%,49%)]">
                    {client.industry && <span>{client.industry}</span>}
                    {client.contact_name && <span>{client.contact_name}</span>}
                    {client.contact_email && <span>{client.contact_email}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] text-[hsl(24,8%,49%)]">{clientProps.length} proposal{clientProps.length !== 1 ? 's' : ''}</p>
                  {totalValue > 0 && <p className="text-[12px] text-[hsl(24,8%,49%)]">{currencySymbol}{totalValue.toLocaleString()}</p>}
                </div>
                <ClientMenu client={client} onEdit={() => setEditClient({ ...client })} onDelete={() => handleDelete(client)}
                  onCreateProposal={() => navigate(`/proposals/new?client=${client.id}`)} onScan={() => handleScanWebsite(client)}
                  onViewDetails={() => setSelectedClient(client)} />
              </div>
            );
          })}
        </div>
      )}

      {/* Client Detail Panel */}
      {selectedClient && (
        <ClientDetail client={selectedClient} proposals={proposals} currencySymbol={currencySymbol}
          onClose={() => setSelectedClient(null)} onEdit={() => setEditClient({ ...selectedClient })}
          onScan={() => handleScanWebsite(selectedClient)} onRefresh={invalidate} />
      )}

      {/* Edit Client Modal */}
      {editClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setEditClient(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Edit Client</h3>
              <button onClick={() => setEditClient(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input placeholder="Company Name *" value={editClient.company_name} onChange={e => setEditClient((p: any) => ({ ...p, company_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Contact Name" value={editClient.contact_name || ''} onChange={e => setEditClient((p: any) => ({ ...p, contact_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Contact Title" value={editClient.contact_title || ''} onChange={e => setEditClient((p: any) => ({ ...p, contact_title: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Email" value={editClient.contact_email || ''} onChange={e => setEditClient((p: any) => ({ ...p, contact_email: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Website" value={editClient.website || ''} onChange={e => setEditClient((p: any) => ({ ...p, website: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Industry" value={editClient.industry || ''} onChange={e => setEditClient((p: any) => ({ ...p, industry: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Phone" value={editClient.phone || ''} onChange={e => setEditClient((p: any) => ({ ...p, phone: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
              <input placeholder="Address" value={editClient.address || ''} onChange={e => setEditClient((p: any) => ({ ...p, address: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditClient(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleEditSave} disabled={!editClient.company_name || saving}
                className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ─── Client More Menu ─── */
function ClientMenu({ client, onEdit, onDelete, onCreateProposal, onScan, onViewDetails }: {
  client: any; onEdit: () => void; onDelete: () => void; onCreateProposal: () => void; onScan: () => void; onViewDetails: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button onClick={e => e.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onViewDetails(); }}>
          <Users className="mr-2 h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onCreateProposal(); }}>
          <FileText className="mr-2 h-4 w-4" /> Create proposal
        </DropdownMenuItem>
        {client.website && (
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onScan(); }}>
            <ScanSearch className="mr-2 h-4 w-4" /> Scan website
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-[hsl(0,20%,56%)] focus:text-[hsl(0,20%,56%)]">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
