import { AppShell } from '@/components/layout/AppShell';
import { mockClients, mockProposals } from '@/lib/mockData';
import { Plus, Search, MoreHorizontal, Mail, Globe } from 'lucide-react';

export default function Clients() {
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <button className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {mockClients.map((client) => {
          const proposalCount = mockProposals.filter(p => p.client_id === client.id).length;
          return (
            <div
              key={client.id}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {client.company_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{client.company_name}</p>
                    <p className="text-xs text-muted-foreground">{client.contact_name} · {client.contact_title}</p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                {client.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {client.contact_email}
                  </span>
                )}
              </div>
              {client.website && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" /> {client.website}
                </div>
              )}

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
    </AppShell>
  );
}
