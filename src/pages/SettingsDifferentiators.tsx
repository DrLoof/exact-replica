import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Pencil, X, Save, Award } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';

interface Differentiator {
  id: string;
  title: string;
  description: string | null;
  stat_value: string | null;
  stat_label: string | null;
  icon: string | null;
  display_order: number | null;
}

const emptyForm = { title: '', description: '', stat_value: '', stat_label: '', icon: 'Star' };

const iconOptions = ['Star', 'Zap', 'Shield', 'Target', 'Award', 'TrendingUp', 'Users', 'Clock', 'Heart', 'Globe', 'Lightbulb', 'Rocket', 'CheckCircle', 'BarChart3'];

export default function SettingsDifferentiators() {
  const { agency } = useAuth();
  const [items, setItems] = useState<Differentiator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (agency) load(); }, [agency]);

  const load = async () => {
    if (!agency) return;
    const { data } = await supabase.from('differentiators').select('*').eq('agency_id', agency.id).order('display_order');
    setItems(data || []);
    setLoading(false);
  };

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (d: Differentiator) => {
    setForm({
      title: d.title, description: d.description || '', stat_value: d.stat_value || '',
      stat_label: d.stat_label || '', icon: d.icon || 'Star',
    });
    setEditId(d.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!agency || !form.title.trim()) return;
    setSaving(true);
    const payload = {
      agency_id: agency.id,
      title: form.title.trim(),
      description: form.description || null,
      stat_value: form.stat_value || null,
      stat_label: form.stat_label || null,
      icon: form.icon || null,
      display_order: editId ? undefined : items.length,
    };

    if (editId) {
      const { error } = await supabase.from('differentiators').update(payload).eq('id', editId);
      if (error) toast.error('Failed to update'); else toast.success('Differentiator updated');
    } else {
      const { error } = await supabase.from('differentiators').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Differentiator added');
    }
    setShowModal(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this differentiator?')) return;
    await supabase.from('differentiators').delete().eq('id', id);
    setItems(prev => prev.filter(d => d.id !== id));
    toast.success('Differentiator removed');
  };

  const getIcon = (name: string | null) => {
    const Icon = name && (LucideIcons as any)[name] ? (LucideIcons as any)[name] : LucideIcons.Star;
    return <Icon className="h-4 w-4" />;
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold text-foreground">Why Us — Differentiators</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> Add Differentiator
        </button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        These appear in the "Why Us" section of your proposals. Add stats and icons to make them stand out.
      </p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Award className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No differentiators yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Tell clients what makes you different</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
            <Plus className="h-4 w-4" /> Add Differentiator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(d => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  {getIcon(d.icon)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => handleDelete(d.id)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{d.title}</h3>
              {d.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{d.description}</p>}
              {d.stat_value && (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-lg font-bold text-brand">{d.stat_value}</span>
                  {d.stat_label && <span className="text-xs text-muted-foreground">{d.stat_label}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{editId ? 'Edit Differentiator' : 'Add Differentiator'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Industry Expertise" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Why does this matter to clients?" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stat Value</label>
                  <input value={form.stat_value} onChange={e => setForm(p => ({ ...p, stat_value: e.target.value }))} placeholder="98%" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stat Label</label>
                  <input value={form.stat_label} onChange={e => setForm(p => ({ ...p, stat_label: e.target.value }))} placeholder="Client satisfaction" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(name => {
                    const Icon = (LucideIcons as any)[name];
                    return (
                      <button key={name} onClick={() => setForm(p => ({ ...p, icon: name }))}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${form.icon === name ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
