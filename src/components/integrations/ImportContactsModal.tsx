import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface HubSpotContact {
  hubspotId: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  phone: string;
  website: string;
  alreadyInPropopad: boolean;
  willUpdate: boolean;
  hasCompany: boolean;
  importable: boolean;
}

interface ImportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

export function ImportContactsModal({ open, onOpenChange, onImported }: ImportContactsModalProps) {
  const { agency } = useAuth();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && agency?.id) fetchContacts();
  }, [open, agency?.id]);

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('hubspot-import-contacts', {
        body: { agencyId: agency!.id, action: 'fetch' },
      });
      if (fnError || data?.error) {
        setError(data?.error || fnError?.message || 'Failed to fetch contacts');
        return;
      }
      setContacts(data.contacts || []);
      // Auto-select importable contacts
      const importable = (data.contacts || [])
        .filter((c: HubSpotContact) => c.importable)
        .map((c: HubSpotContact) => c.hubspotId);
      setSelected(new Set(importable));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (hubspotId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(hubspotId)) next.delete(hubspotId);
      else next.add(hubspotId);
      return next;
    });
  };

  const toggleAll = () => {
    const importable = contacts.filter(c => c.importable).map(c => c.hubspotId);
    if (selected.size === importable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(importable));
    }
  };

  const handleImport = async () => {
    const selectedContacts = contacts.filter(c => selected.has(c.hubspotId));
    if (selectedContacts.length === 0) return;

    setImporting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('hubspot-import-contacts', {
        body: { agencyId: agency!.id, action: 'import', selectedContacts },
      });
      if (fnError || data?.error) {
        toast.error(data?.error || 'Import failed');
      } else {
        toast.success(`Imported ${data.imported} contacts, updated ${data.updated}`);
        onImported?.();
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const importableCount = contacts.filter(c => c.importable).length;
  const selectedCount = selected.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <div className="p-6 pb-3">
          <h2 className="text-lg font-semibold text-ink">Import contacts from HubSpot</h2>
          {!loading && !error && (
            <p className="mt-1 text-sm text-ink-muted">
              Found {contacts.length} contacts. Select which to import:
            </p>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-ink-muted" />
            <p className="mt-3 text-sm text-ink-muted">Loading contacts from HubSpot…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-1">
                {contacts.map(contact => (
                  <label
                    key={contact.hubspotId}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                      !contact.importable ? 'opacity-50' : 'hover:bg-parchment-soft'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(contact.hubspotId)}
                      onChange={() => toggleContact(contact.hubspotId)}
                      disabled={!contact.importable}
                      className="mt-0.5 h-4 w-4 rounded border-ink-faint accent-ink"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-ink truncate">
                          {[contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email}
                        </span>
                        {contact.title && (
                          <span className="text-[11px] text-ink-faint">· {contact.title}</span>
                        )}
                        {contact.company && (
                          <span className="text-[11px] text-ink-faint">· {contact.company}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-ink-muted">{contact.email}</span>
                        {contact.alreadyInPropopad && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                            Already in Propopad (will update)
                          </span>
                        )}
                        {!contact.importable && !contact.alreadyInPropopad && (
                          <span className="text-[10px] text-ink-faint">Skipped (no company)</span>
                        )}
                        {!contact.alreadyInPropopad && contact.importable && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E3F2FD', color: '#1565C0' }}>
                            New — will be added
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 pt-3" style={{ borderTop: '1px solid #EEEAE3' }}>
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCount === importableCount && importableCount > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-ink-faint accent-ink"
                />
                <span className="text-[13px] font-medium text-ink">
                  Select all ({importableCount} importable)
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-parchment-soft"
                  style={{ borderColor: '#EEEAE3', color: '#2A2118' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-ivory transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2A2118' }}
                >
                  {importing ? 'Importing…' : `Import ${selectedCount} contacts →`}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
