import { useState } from 'react';
import { Globe, Loader2, Check, X, Image, Plus, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PortfolioImage {
  url: string;
  alt_text: string;
  sort_order: number;
}

interface PortfolioItemLocal {
  id: string;
  title: string;
  category: string;
  description: string | null;
  results: string | null;
  images: PortfolioImage[];
}

interface ScrapedProject {
  title: string;
  description: string | null;
  category: string;
  image_urls: string[];
  selected: boolean;
}

interface PortfolioStepProps {
  onContinue: (items: PortfolioItemLocal[]) => void;
  onSkip: () => void;
  serviceGroups: string[];
  detectedPortfolioUrl?: string | null;
  saving: boolean;
}

const emptyForm = { title: '', category: '', description: '', results: '' };

export function PortfolioStep({ onContinue, onSkip, serviceGroups, detectedPortfolioUrl, saving }: PortfolioStepProps) {
  const [items, setItems] = useState<PortfolioItemLocal[]>([]);
  const [importUrl, setImportUrl] = useState(detectedPortfolioUrl || '');
  const [scanning, setScanning] = useState(false);
  const [scrapedProjects, setScrapedProjects] = useState<ScrapedProject[]>([]);
  const [scanMessage, setScanMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleScan = async () => {
    if (!importUrl.trim()) { toast.error('Enter a URL'); return; }
    setScanning(true);
    setScrapedProjects([]);
    setScanMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('scrape-portfolio', {
        body: { url: importUrl.trim(), service_groups: serviceGroups },
      });

      if (error) { setScanMessage("We couldn't access this page. Check the URL and try again."); setScanning(false); return; }
      if (data?.error) { setScanMessage(data.error); setScanning(false); return; }

      const projects: ScrapedProject[] = (data?.projects || []).map((p: any) => ({ ...p, selected: true }));
      if (projects.length === 0) {
        setScanMessage(data?.message || "We couldn't detect portfolio items. Try a different URL, or add manually.");
      } else {
        setScrapedProjects(projects);
      }
    } catch {
      setScanMessage("An error occurred while scanning. Please try again.");
    }
    setScanning(false);
  };

  const toggleProject = (idx: number) => {
    setScrapedProjects(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  const handleImportSelected = () => {
    const selected = scrapedProjects.filter(p => p.selected);
    if (selected.length === 0) { toast.error('Select at least one project'); return; }

    setImporting(true);
    const newItems: PortfolioItemLocal[] = selected.map((p, i) => ({
      id: `import_${Date.now()}_${i}`,
      title: p.title,
      category: p.category,
      description: p.description,
      results: null,
      images: p.image_urls.slice(0, 6).map((url, j) => ({ url, alt_text: p.title, sort_order: j })),
    }));

    setItems(prev => [...prev, ...newItems]);
    setScrapedProjects([]);
    setScanMessage('');
    setImporting(false);
    toast.success(`${newItems.length} project${newItems.length > 1 ? 's' : ''} imported`);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(p => p.id !== id));
  };

  const updateItemCategory = (id: string, category: string) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, category } : p));
    setEditingCategory(null);
  };

  const handleAddManual = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const cat = form.category || 'Other';
    setItems(prev => [...prev, {
      id: `manual_${Date.now()}`,
      title: form.title.trim(),
      category: cat,
      description: form.description.trim() || null,
      results: form.results.trim() || null,
      images: [],
    }]);
    setForm(emptyForm);
    setShowAddForm(false);
    toast.success('Project added');
  };

  const allCategories = [...new Set([...serviceGroups, 'Other', ...items.map(i => i.category), ...scrapedProjects.map(p => p.category)])];

  const updateScrapedCategory = (idx: number, category: string) => {
    setScrapedProjects(prev => prev.map((p, i) => i === idx ? { ...p, category } : p));
  };

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-foreground">Show your best work</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add portfolio items to include in your proposals. This step is optional — you can add these later.
        </p>
      </div>

      {/* URL Import section */}
      {items.length === 0 && scrapedProjects.length === 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://youragency.com/work"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-brand"
              />
            </div>
            <button
              onClick={handleScan}
              disabled={scanning || !importUrl.trim()}
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</> : 'Scan portfolio page'}
            </button>
          </div>

          {scanMessage && (
            <p className="text-sm text-muted-foreground text-center py-4">{scanMessage}</p>
          )}

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => setShowAddForm(true)} className="hover:text-foreground transition-colors">
              Or add manually →
            </button>
          </div>
        </div>
      )}

      {/* Scraped results */}
      {scrapedProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Found {scrapedProjects.length} project{scrapedProjects.length > 1 ? 's' : ''}
            </p>
            <span className="text-xs text-muted-foreground">
              {scrapedProjects.filter(p => p.selected).length} selected
            </span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {scrapedProjects.map((project, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                  project.selected ? 'border-brand/40 bg-brand/5' : 'border-border hover:bg-muted/30'
                }`}
              >
                {/* Thumbnail */}
                <button onClick={() => toggleProject(idx)} className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  {project.image_urls[0] ? (
                    <img src={project.image_urls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground/50" /></div>
                  )}
                </button>
                {/* Info */}
                <button onClick={() => toggleProject(idx)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                  )}
                </button>
                {/* Editable category dropdown */}
                <select
                  value={project.category}
                  onChange={(e) => { e.stopPropagation(); updateScrapedCategory(idx, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] bg-brand/10 text-brand border-none rounded-full px-2 py-0.5 outline-none cursor-pointer hover:bg-brand/20 transition-colors max-w-[140px]"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {/* Check */}
                <button onClick={() => toggleProject(idx)} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  project.selected ? 'border-brand bg-brand' : 'border-border'
                }`}>
                  {project.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setScrapedProjects([]); setScanMessage(''); }}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSelected}
              disabled={importing || scrapedProjects.filter(p => p.selected).length === 0}
              className="flex-1 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${scrapedProjects.filter(p => p.selected).length} project${scrapedProjects.filter(p => p.selected).length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Manual add form */}
      {showAddForm && items.length === 0 && scrapedProjects.length === 0 && (
        <div className="mt-6 space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-foreground">Add a project</p>
          <input
            type="text"
            placeholder="Project title"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
          />
          <select
            value={form.category}
            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
          >
            <option value="">Select category</option>
            {serviceGroups.map(g => <option key={g} value={g}>{g}</option>)}
            <option value="Other">Other</option>
          </select>
          <textarea
            placeholder="Brief description (optional)"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(false)} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button onClick={handleAddManual} disabled={!form.title.trim()} className="flex-1 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Imported items list */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{items.length} project{items.length > 1 ? 's' : ''} added</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover transition-colors"
            >
              <Plus className="h-3 w-3" /> Add more
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map(item => (
              <div key={item.id} className="group relative rounded-xl border border-border overflow-hidden bg-card">
                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Thumbnail */}
                <div className="h-28 bg-muted">
                  {item.images[0]?.url ? (
                    <img src={item.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  {/* Editable category pill */}
                  <div className="relative mt-1.5">
                    <button
                      onClick={() => setEditingCategory(editingCategory === item.id ? null : item.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full hover:bg-brand/20 transition-colors"
                    >
                      {item.category}
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                    {editingCategory === item.id && (
                      <div className="absolute left-0 top-full mt-1 z-20 w-48 rounded-lg border border-border bg-popover shadow-lg py-1 max-h-48 overflow-y-auto">
                        {allCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => updateItemCategory(item.id, cat)}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                              cat === item.category ? 'text-brand font-medium' : 'text-foreground'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inline add form when items exist */}
          {showAddForm && (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add another project</p>
              <input
                type="text"
                placeholder="Project title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              >
                <option value="">Select category</option>
                {serviceGroups.map(g => <option key={g} value={g}>{g}</option>)}
                <option value="Other">Other</option>
              </select>
              <textarea
                placeholder="Brief description (optional)"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(false)} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={handleAddManual} disabled={!form.title.trim()} className="flex-1 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50">Add</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          onClick={() => onContinue(items)}
          disabled={saving}
          className="w-full max-w-xs rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Continue'}
        </button>
        <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip this step
        </button>
      </div>
    </div>
  );
}
