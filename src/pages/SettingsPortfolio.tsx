import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Pencil, X, Save, Image, Upload, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PortfolioImage {
  url: string;
  alt_text: string;
  sort_order: number;
}

interface PortfolioItem {
  id: string;
  agency_id: string;
  title: string;
  category: string;
  description: string | null;
  results: string | null;
  images: PortfolioImage[];
  source_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  title: '',
  category: '',
  customCategory: '',
  description: '',
  results: '',
  images: [] as PortfolioImage[],
};

export default function SettingsPortfolio() {
  const { agency } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serviceGroups, setServiceGroups] = useState<string[]>([]);

  useEffect(() => {
    if (agency) {
      loadItems();
      loadServiceGroups();
    }
  }, [agency]);

  const loadItems = async () => {
    if (!agency) return;
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('agency_id', agency.id)
      .order('sort_order');
    setItems((data || []).map((d: any) => ({ ...d, images: d.images || [] })));
    setLoading(false);
  };

  const loadServiceGroups = async () => {
    const { data } = await supabase.from('service_groups').select('name').order('display_order');
    setServiceGroups((data || []).map((g: any) => g.name));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (item: PortfolioItem) => {
    const isCustom = !serviceGroups.includes(item.category);
    setForm({
      title: item.title,
      category: isCustom ? '__custom__' : item.category,
      customCategory: isCustom ? item.category : '',
      description: item.description || '',
      results: item.results || '',
      images: item.images || [],
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    const resolvedCategory = form.category === '__custom__' ? form.customCategory.trim() : form.category;
    if (!form.title.trim() || !resolvedCategory) {
      toast.error('Title and category are required');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category: resolvedCategory,
      description: form.description.trim() || null,
      results: form.results.trim() || null,
      images: form.images,
      agency_id: agency!.id,
    };

    if (editId) {
      const { error } = await supabase.from('portfolio_items').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Portfolio item updated');
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from('portfolio_items').insert({ ...payload, sort_order: maxOrder });
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Portfolio item added');
    }
    setSaving(false);
    setShowModal(false);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return;
    await supabase.from('portfolio_items').delete().eq('id', id);
    toast.success('Deleted');
    loadItems();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (form.images.length + files.length > 6) {
      toast.error('Maximum 6 images per item');
      return;
    }
    setUploading(true);
    const newImages: PortfolioImage[] = [...form.images];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: unsupported format`);
        continue;
      }
      const ext = file.name.split('.').pop();
      const path = `${agency!.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('portfolio-images').upload(path, file);
      if (error) { toast.error(`Upload failed: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(path);
      newImages.push({ url: urlData.publicUrl, alt_text: file.name, sort_order: newImages.length });
    }

    setForm(f => ({ ...f, images: newImages }));
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, sort_order: i })) }));
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const imgs = [...form.images];
    const target = idx + dir;
    if (target < 0 || target >= imgs.length) return;
    [imgs[idx], imgs[target]] = [imgs[target], imgs[idx]];
    setForm(f => ({ ...f, images: imgs.map((img, i) => ({ ...img, sort_order: i })) }));
  };

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    updated.forEach((item, i) => { item.sort_order = i; });
    setItems(updated);
    for (const item of updated) {
      await supabase.from('portfolio_items').update({ sort_order: item.sort_order }).eq('id', item.id);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Settings
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Showcase your previous work in proposals. Add projects manually or import from your website.</p>
        </div>
        {items.length > 0 && (
          <Button onClick={openCreate} className="bg-ink text-primary-foreground hover:bg-ink-soft">
            <Plus className="mr-1 h-4 w-4" /> Add project
          </Button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <Image className="h-8 w-8 text-accent-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No portfolio items yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Add examples of your best work to include in proposals. Clients who see real examples are more likely to say yes.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={openCreate} className="bg-ink text-primary-foreground hover:bg-ink-soft">
              Add manually
            </Button>
            <Button variant="outline" disabled>
              Import from website
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-muted">
                {item.images.length > 0 ? (
                  <img src={item.images[0].url} alt={item.images[0].alt_text} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => moveItem(idx, -1)} className="rounded-md bg-card/90 p-1.5 text-foreground shadow hover:bg-card" disabled={idx === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveItem(idx, 1)} className="rounded-md bg-card/90 p-1.5 text-foreground shadow hover:bg-card" disabled={idx === items.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openEdit(item)} className="rounded-md bg-card/90 p-1.5 text-foreground shadow hover:bg-card">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-md bg-card/90 p-1.5 text-destructive shadow hover:bg-card">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <span className="mb-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.category}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                )}
                {item.results && (
                  <p className="mt-2 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                    📈 {item.results}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Rebrand — Northline Studio" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Category *</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {serviceGroups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
              {form.category === '__custom__' && (
                <Input className="mt-2" value={form.customCategory} onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))} placeholder="Type custom category" />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="1-3 sentences about the project" rows={3} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Results (optional)</label>
              <Textarea value={form.results} onChange={e => setForm(f => ({ ...f, results: e.target.value }))} placeholder="e.g. Increased organic traffic by 140% in 6 months" rows={2} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Images ({form.images.length}/6)</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                    <img src={img.url} alt={img.alt_text} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {idx > 0 && (
                        <button onClick={() => moveImage(idx, -1)} className="rounded bg-card/80 p-0.5"><ArrowUp className="h-3 w-3" /></button>
                      )}
                      {idx < form.images.length - 1 && (
                        <button onClick={() => moveImage(idx, 1)} className="rounded bg-card/80 p-0.5"><ArrowDown className="h-3 w-3" /></button>
                      )}
                      <button onClick={() => removeImage(idx)} className="rounded bg-card/80 p-0.5 text-destructive"><X className="h-3 w-3" /></button>
                    </div>
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-foreground/60 py-0.5 text-center text-[8px] font-bold uppercase text-primary-foreground">Hero</span>
                    )}
                  </div>
                ))}
                {form.images.length < 6 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
                    {uploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="mt-0.5 text-[9px]">Upload</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">JPG, PNG, or WebP. Max 5MB each. First image is the hero.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-ink text-primary-foreground hover:bg-ink-soft">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
