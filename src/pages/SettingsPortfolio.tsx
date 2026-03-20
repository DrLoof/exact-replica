import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Pencil, X, Image, Upload, ArrowUp, ArrowDown, Globe, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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

interface ScrapedProject {
  title: string;
  description: string | null;
  category: string;
  image_urls: string[];
  selected: boolean;
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

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scrapedProjects, setScrapedProjects] = useState<ScrapedProject[]>([]);
  const [scanMessage, setScanMessage] = useState('');
  const [importing, setImporting] = useState(false);

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

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };

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
    if (!form.title.trim() || !resolvedCategory) { toast.error('Title and category are required'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category: resolvedCategory,
      description: form.description.trim() || null,
      results: form.results.trim() || null,
      images: form.images as any,
      agency_id: agency!.id,
    };
    if (editId) {
      const { error } = await supabase.from('portfolio_items').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Portfolio item updated');
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from('portfolio_items').insert({ ...payload, sort_order: maxOrder } as any);
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
    if (form.images.length + files.length > 6) { toast.error('Maximum 6 images per item'); return; }
    setUploading(true);
    const newImages: PortfolioImage[] = [...form.images];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); continue; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error(`${file.name}: unsupported format`); continue; }
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

  // ── Import flow ──
  const openImport = () => {
    setImportUrl('');
    setScrapedProjects([]);
    setScanMessage('');
    setShowImportModal(true);
  };

  const handleScan = async () => {
    if (!importUrl.trim()) { toast.error('Enter a URL'); return; }
    setScanning(true);
    setScrapedProjects([]);
    setScanMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('scrape-portfolio', {
        body: { url: importUrl.trim(), service_groups: serviceGroups },
      });

      if (error) {
        setScanMessage("We couldn't access this page. Check the URL and try again.");
        setScanning(false);
        return;
      }

      if (data?.error) {
        setScanMessage(data.error);
        setScanning(false);
        return;
      }

      const projects: ScrapedProject[] = (data?.projects || []).map((p: any) => ({
        ...p,
        selected: true,
      }));

      if (projects.length === 0) {
        setScanMessage(data?.message || "We couldn't detect portfolio items on this page. Try a different URL, or add projects manually.");
      } else {
        setScrapedProjects(projects);
      }
    } catch (e) {
      setScanMessage("An error occurred while scanning. Please try again.");
    }
    setScanning(false);
  };

  const toggleProject = (idx: number) => {
    setScrapedProjects(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  const downloadAndUploadImage = async (imageUrl: string): Promise<string | null> => {
    try {
      const resp = await fetch(imageUrl, { mode: 'cors' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (blob.size > 5 * 1024 * 1024) return null;
      // Verify it's actually an image
      if (!blob.type.startsWith('image/')) return null;

      const contentType = blob.type || 'image/jpeg';
      const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      const ext = extMap[contentType] || 'jpg';
      const path = `${agency!.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from('portfolio-images').upload(path, blob, { contentType });
      if (error) { console.error('Upload failed:', error); return null; }

      const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (e) {
      // CORS or network error — can't re-upload from browser
      console.warn('Image re-upload failed (likely CORS), will use original URL:', imageUrl);
      return null;
    }
  };

  const handleImportSelected = async () => {
    const selected = scrapedProjects.filter(p => p.selected);
    if (selected.length === 0) { toast.error('Select at least one project'); return; }

    setImporting(true);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
    let imported = 0;

    for (let i = 0; i < selected.length; i++) {
      const project = selected[i];

      // Download and re-upload images to storage
      const images: PortfolioImage[] = [];
      for (let j = 0; j < Math.min(project.image_urls.length, 6); j++) {
        const uploadedUrl = await downloadAndUploadImage(project.image_urls[j]);
        if (uploadedUrl) {
          images.push({ url: uploadedUrl, alt_text: project.title, sort_order: images.length });
        }
      }

      const { error } = await supabase.from('portfolio_items').insert({
        agency_id: agency!.id,
        title: project.title,
        category: project.category,
        description: project.description,
        images: images as any,
        source_url: importUrl.trim(),
        sort_order: maxOrder + i,
      } as any);

      if (!error) imported++;
    }

    setImporting(false);
    setShowImportModal(false);
    toast.success(`Imported ${imported} portfolio item${imported !== 1 ? 's' : ''}`);
    loadItems();
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={openImport}>
              <Globe className="mr-1 h-4 w-4" /> Import from website
            </Button>
            <Button onClick={openCreate} className="bg-ink text-primary-foreground hover:bg-ink-soft">
              <Plus className="mr-1 h-4 w-4" /> Add project
            </Button>
          </div>
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
            <Button variant="outline" onClick={openImport}>
              <Globe className="mr-1 h-4 w-4" /> Import from website
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item, idx) => (
            <div key={item.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-sm">
              <div className="relative h-44 bg-muted">
                {item.images.length > 0 ? (
                  <img src={item.images[0].url} alt={item.images[0].alt_text} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
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
                {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                {item.results && (
                  <p className="mt-2 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">📈 {item.results}</p>
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
                  {serviceGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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
                      {idx > 0 && <button onClick={() => moveImage(idx, -1)} className="rounded bg-card/80 p-0.5"><ArrowUp className="h-3 w-3" /></button>}
                      {idx < form.images.length - 1 && <button onClick={() => moveImage(idx, 1)} className="rounded bg-card/80 p-0.5"><ArrowDown className="h-3 w-3" /></button>}
                      <button onClick={() => removeImage(idx)} className="rounded bg-card/80 p-0.5 text-destructive"><X className="h-3 w-3" /></button>
                    </div>
                    {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-foreground/60 py-0.5 text-center text-[8px] font-bold uppercase text-primary-foreground">Hero</span>}
                  </div>
                ))}
                {form.images.length < 6 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
                    {uploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    ) : (
                      <><Upload className="h-4 w-4" /><span className="mt-0.5 text-[9px]">Upload</span></>
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

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import portfolio from your website</DialogTitle>
          </DialogHeader>

          {/* URL Input (always visible when no results yet) */}
          {scrapedProjects.length === 0 && (
            <div className="space-y-3 py-2">
              <div>
                <Input
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://youragency.com/work"
                  onKeyDown={e => e.key === 'Enter' && !scanning && handleScan()}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Enter your portfolio or work page. We'll scan it for project images and descriptions.
                </p>
              </div>

              {scanMessage && (
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                  {scanMessage}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleScan}
                  disabled={scanning || !importUrl.trim()}
                  className="bg-ink text-primary-foreground hover:bg-ink-soft"
                >
                  {scanning ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Scanning your portfolio…</>
                  ) : (
                    'Scan'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Results list */}
          {scrapedProjects.length > 0 && (
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-foreground">
                Found {scrapedProjects.length} project{scrapedProjects.length !== 1 ? 's' : ''} on your portfolio page:
              </p>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {scrapedProjects.map((project, idx) => (
                  <label
                    key={idx}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      project.selected ? 'border-foreground/20 bg-accent/30' : 'border-border bg-card'
                    }`}
                  >
                    <Checkbox
                      checked={project.selected}
                      onCheckedChange={() => toggleProject(idx)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">"{project.title}"</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {project.category} · {project.image_urls.length} image{project.image_urls.length !== 1 ? 's' : ''} found
                      </p>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
                      )}
                    </div>
                    {project.image_urls[0] && (
                      <img src={project.image_urls[0]} alt="" className="h-12 w-12 rounded-md object-cover" />
                    )}
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" onClick={() => { setScrapedProjects([]); setScanMessage(''); }}>
                  ← Back
                </Button>
                <Button
                  onClick={handleImportSelected}
                  disabled={importing || scrapedProjects.filter(p => p.selected).length === 0}
                  className="bg-ink text-primary-foreground hover:bg-ink-soft"
                >
                  {importing ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Importing…</>
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Import {scrapedProjects.filter(p => p.selected).length} selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
