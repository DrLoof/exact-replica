import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, ChevronDown, Plus, Trash2, Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClauseForm { id?: string; title: string; content: string; }

export default function SettingsPricing() {
  const { agency } = useAuth();
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [hourlyRate, setHourlyRate] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [revisionRounds, setRevisionRounds] = useState('2');
  const [noticePeriod, setNoticePeriod] = useState('30 days');
  const [saving, setSaving] = useState(false);

  const [clauses, setClauses] = useState<any[]>([]);
  const [loadingClauses, setLoadingClauses] = useState(true);
  const [showClauseModal, setShowClauseModal] = useState(false);
  const [clauseForm, setClauseForm] = useState<ClauseForm>({ title: '', content: '' });
  const [savingClause, setSavingClause] = useState(false);

  useEffect(() => {
    if (agency) {
      setCurrency(agency.currency || 'USD');
      setCurrencySymbol(agency.currency_symbol || '$');
      setHourlyRate(agency.hourly_rate?.toString() || '');
      setValidityDays(agency.default_validity_days?.toString() || '30');
      setRevisionRounds(agency.default_revision_rounds?.toString() || '2');
      setNoticePeriod(agency.default_notice_period || '30 days');
      loadClauses();
    }
  }, [agency]);

  const loadClauses = async () => {
    if (!agency) return;
    const { data } = await supabase.from('terms_clauses').select('*').eq('agency_id', agency.id).order('display_order');
    setClauses(data || []);
    setLoadingClauses(false);
  };

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true);
    const { error } = await supabase.from('agencies').update({
      currency, currency_symbol: currencySymbol,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      default_validity_days: parseInt(validityDays) || 30,
      default_revision_rounds: parseInt(revisionRounds) || 2,
      default_notice_period: noticePeriod,
    }).eq('id', agency.id);
    if (error) toast.error('Failed to save');
    else toast.success('Pricing settings updated');
    setSaving(false);
  };

  const deleteClause = async (id: string) => {
    await supabase.from('terms_clauses').delete().eq('id', id);
    setClauses(prev => prev.filter(c => c.id !== id));
    toast.success('Clause removed');
  };

  const openClauseCreate = () => { setClauseForm({ title: '', content: '' }); setShowClauseModal(true); };
  const openClauseEdit = (c: any) => { setClauseForm({ id: c.id, title: c.title, content: c.content }); setShowClauseModal(true); };

  const handleClauseSave = async () => {
    if (!agency || !clauseForm.title.trim() || !clauseForm.content.trim()) return;
    setSavingClause(true);
    const payload = { agency_id: agency.id, title: clauseForm.title.trim(), content: clauseForm.content.trim(), display_order: clauseForm.id ? undefined : clauses.length };
    if (clauseForm.id) {
      const { error } = await supabase.from('terms_clauses').update(payload).eq('id', clauseForm.id);
      if (error) toast.error('Failed to update'); else toast.success('Clause updated');
    } else {
      const { error } = await supabase.from('terms_clauses').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Clause added');
    }
    setShowClauseModal(false);
    setSavingClause(false);
    loadClauses();
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold text-foreground">Pricing & Terms</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Currency & Rates</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AUD">AUD</option><option value="CAD">CAD</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Symbol</label>
              <input value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Default Hourly Rate</label>
              <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="150" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Proposal Defaults</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Validity (days)</label>
              <input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Revision Rounds</label>
              <input type="number" value={revisionRounds} onChange={e => setRevisionRounds(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notice Period</label>
              <input value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Terms & Conditions Clauses</h2>
            <button onClick={openClauseCreate} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">
          </div>
          <div className="flex items-start gap-2 mb-4 rounded-lg bg-background px-3 py-2.5">
            <span className="text-sm mt-0.5" style={{ color: '#C07A5C' }}>⚠</span>
            <p className="text-[12px] text-muted-foreground">
              These are template clauses, not legal advice. Have a lawyer review your terms before using them with clients.
            </p>
              <Plus className="h-3.5 w-3.5" /> Add Clause
            </button>
          </div>
          {loadingClauses ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : clauses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No clauses configured. They will be created during onboarding.</p>
          ) : (
            <div className="space-y-2">
              {clauses.map((clause) => (
                <details key={clause.id} className="group rounded-lg border border-border overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50">
                    <span className="text-sm font-medium text-foreground">{clause.title}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.preventDefault(); openClauseEdit(clause); }} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.preventDefault(); deleteClause(clause.id); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="px-4 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">{clause.content}</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clause Modal */}
      {showClauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowClauseModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{clauseForm.id ? 'Edit Clause' : 'Add Clause'}</h3>
              <button onClick={() => setShowClauseModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title *</label>
                <input value={clauseForm.title} onChange={e => setClauseForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Payment Terms" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Content *</label>
                <textarea value={clauseForm.content} onChange={e => setClauseForm(p => ({ ...p, content: e.target.value }))}
                  rows={6} placeholder="Legal text for this clause..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowClauseModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleClauseSave} disabled={savingClause || !clauseForm.title.trim() || !clauseForm.content.trim()}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
                <Save className="h-4 w-4" /> {savingClause ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
