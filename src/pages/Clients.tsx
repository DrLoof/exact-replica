import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Plus, Search, MoreHorizontal, Mail, Globe, Users, X } from 'lucide-react';
import { useClients, useProposals } from '@/hooks/useAgencyData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Clients() {
  const { agency } = useAuth();
  const { data: clients = [], isLoading } = useClients();
  const { data: proposals = [] } = useProposals();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ company_name: '', contact_name: '', contact_email: '', website: '', industry: '' });
  const [saving, setSaving] = useState(false);

  const filtered = clients.filter((c: any) =>
    !search || c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newClient.company_name || !agency?.id) return;
    setSaving(true);
    const { error } = await supabase.from('clients').insert({
      agency_id: agency.id,
      company_name: newClient.company_name,
      contact_name: newClient.contact_name || null,
      contact_email: newClient.contact_email || null,
      website: newClient.website || null,
      industry: newClient.industry || null,
    });
    setSaving(false);
    if (error) { toast.error('Failed to add client'); return; }
    toast.success('Client added');
    setNewClient({ company_name: '', contact_name: '', contact_email: '', website: '', industry: '' });
    setShowAdd(false);
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const getProposalCount = (clientId: string) =>
    proposals.filter((p: any) => p.client_id === clientId).length;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="mb-6 rounded-xl border border-brand/30 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Client</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Company Name *" value={newClient.company_name} onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Contact Name" value={newClient.contact_name} onChange={e => setNewClient(p => ({ ...p, contact_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Email" value={newClient.contact_email} onChange={e => setNewClient(p => ({ ...p, contact_email: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Website" value={newClient.website} onChange={e => setNewClient(p => ({ ...p, website: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
            <input placeholder="Industry" value={newClient.industry} onChange={e => setNewClient(p => ({ ...p, industry: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">Cancel</button>
            <button onClick={handleAdd} disabled={!newClient.company_name || saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">{search ? 'No clients match your search' : 'No clients yet'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{search ? 'Try a different search term' : 'Add your first client to get started'}</p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
              <Plus className="h-4 w-4" /> Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client: any) => {
            const proposalCount = getProposalCount(client.id);
            return (
              <div key={client.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {client.company_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.company_name}</p>
                      {client.contact_name && <p className="text-xs text-muted-foreground">{client.contact_name}{client.contact_title ? ` · ${client.contact_title}` : ''}</p>}
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-1">
                  {client.contact_email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {client.contact_email}
                    </span>
                  )}
                  {client.website && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" /> {client.website}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">{proposalCount} proposal{proposalCount !== 1 ? 's' : ''}</span>
                  {client.industry && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{client.industry}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
