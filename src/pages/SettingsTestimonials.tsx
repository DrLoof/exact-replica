import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Pencil, X, Save, Star, Quote, Camera, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Testimonial {
  id: string;
  client_name: string;
  client_title: string | null;
  client_company: string | null;
  quote: string;
  metric_value: string | null;
  metric_label: string | null;
  avatar_url: string | null;
  is_featured: boolean | null;
}

const emptyForm = {
  client_name: '', client_title: '', client_company: '', quote: '',
  metric_value: '', metric_label: '', avatar_url: '', is_featured: false,
};

export default function SettingsTestimonials() {
  const { agency } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (agency) load(); }, [agency]);

  const load = async () => {
    if (!agency) return;
    const { data } = await supabase.from('testimonials').select('*').eq('agency_id', agency.id).order('created_at', { ascending: false });
    setTestimonials(data || []);
    setLoading(false);
  };

  const openCreate = () => { setForm(emptyForm); setEditId(null); setAvatarFile(null); setAvatarPreview(null); setShowModal(true); };
  const openEdit = (t: Testimonial) => {
    setForm({
      client_name: t.client_name, client_title: t.client_title || '', client_company: t.client_company || '',
      quote: t.quote, metric_value: t.metric_value || '', metric_label: t.metric_label || '',
      avatar_url: t.avatar_url || '', is_featured: t.is_featured || false,
    });
    setEditId(t.id);
    setAvatarFile(null);
    setAvatarPreview(t.avatar_url || null);
    setShowModal(true);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!agency || !form.client_name.trim() || !form.quote.trim()) return;
    setSaving(true);
    const payload = {
      agency_id: agency.id,
      client_name: form.client_name.trim(),
      client_title: form.client_title || null,
      client_company: form.client_company || null,
      quote: form.quote.trim(),
      metric_value: form.metric_value || null,
      metric_label: form.metric_label || null,
      avatar_url: form.avatar_url || null,
      is_featured: form.is_featured,
    };

    if (editId) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editId);
      if (error) toast.error('Failed to update'); else toast.success('Testimonial updated');
    } else {
      const { error } = await supabase.from('testimonials').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Testimonial added');
    }
    setShowModal(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    setTestimonials(prev => prev.filter(t => t.id !== id));
    toast.success('Testimonial removed');
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Client testimonials appear in your proposals to build credibility and trust. Featured testimonials get a prominent dark card style.
      </p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />)}</div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Quote className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No testimonials yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add client testimonials to strengthen your proposals</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover">
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {t.client_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{t.client_name}</p>
                      {t.is_featured && (
                        <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                          <Star className="h-2.5 w-2.5" /> Featured
                        </span>
                      )}
                    </div>
                    {(t.client_title || t.client_company) && (
                      <p className="text-xs text-muted-foreground">{t.client_title}{t.client_title && t.client_company ? ' · ' : ''}{t.client_company}</p>
                    )}
                    <p className="mt-2 text-sm italic text-foreground/80">"{t.quote}"</p>
                    {t.metric_value && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-brand">{t.metric_value}</span>
                        {t.metric_label && ` ${t.metric_label}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button onClick={() => openEdit(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">{editId ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Client Name *</label>
                  <input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Jane Smith" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
                  <input value={form.client_title} onChange={e => setForm(p => ({ ...p, client_title: e.target.value }))} placeholder="CEO" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Company</label>
                <input value={form.client_company} onChange={e => setForm(p => ({ ...p, client_company: e.target.value }))} placeholder="Acme Corp" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Quote *</label>
                <textarea value={form.quote} onChange={e => setForm(p => ({ ...p, quote: e.target.value }))} rows={3} placeholder="What did they say about working with you?" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Metric Value</label>
                  <input value={form.metric_value} onChange={e => setForm(p => ({ ...p, metric_value: e.target.value }))} placeholder="+340%" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Metric Label</label>
                  <input value={form.metric_label} onChange={e => setForm(p => ({ ...p, metric_label: e.target.value }))} placeholder="Revenue growth" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Avatar URL</label>
                <input value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                <span className="text-sm text-foreground">Featured testimonial (prominent dark card in proposals)</span>
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.client_name.trim() || !form.quote.trim()}
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
