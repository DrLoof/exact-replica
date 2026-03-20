import { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, Pencil, X, Save, Camera, Upload,
  Globe, Loader2, Users2, GripVertical,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TeamMember {
  name: string;
  title: string;
  photo?: string;
}

const emptyForm: TeamMember = { name: '', title: '', photo: '' };

export default function SettingsTeam() {
  const { agency } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const raw = agency?.team_members;
    if (Array.isArray(raw)) return raw as TeamMember[];
    return [];
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TeamMember>(emptyForm);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapedMembers, setScrapedMembers] = useState<TeamMember[]>([]);
  const [selectedScraped, setSelectedScraped] = useState<Set<number>>(new Set());

  // Sync members back whenever agency changes
  const currentMembers = (() => {
    const raw = agency?.team_members;
    if (Array.isArray(raw)) return raw as TeamMember[];
    return [];
  })();

  // Use local state that syncs from agency
  const displayMembers = members.length > 0 || !agency?.team_members ? members : currentMembers;

  const persistMembers = async (updated: TeamMember[]) => {
    if (!agency) return;
    const { error } = await supabase
      .from('agencies')
      .update({ team_members: updated as any })
      .eq('id', agency.id);
    if (error) {
      toast.error('Failed to save team');
    }
    setMembers(updated);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditIndex(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEdit = (idx: number) => {
    const m = displayMembers[idx];
    setForm({ ...m });
    setEditIndex(idx);
    setPhotoFile(null);
    setPhotoPreview(m.photo || null);
    setShowModal(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    let photoUrl = form.photo || '';

    if (photoFile && agency) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const path = `${agency.id}/team/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('agency-logos').upload(path, photoFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
        photoUrl = urlData.publicUrl + '?t=' + Date.now();
      }
    }

    const member: TeamMember = { name: form.name.trim(), title: form.title.trim(), photo: photoUrl };
    const updated = [...displayMembers];

    if (editIndex !== null) {
      updated[editIndex] = member;
    } else {
      updated.push(member);
    }

    await persistMembers(updated);
    toast.success(editIndex !== null ? 'Team member updated' : 'Team member added');
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (idx: number) => {
    if (!confirm(`Remove ${displayMembers[idx].name}?`)) return;
    const updated = displayMembers.filter((_, i) => i !== idx);
    await persistMembers(updated);
    toast.success('Team member removed');
  };

  // Scrape team from website
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapedMembers([]);
    setSelectedScraped(new Set());

    try {
      const { data: result, error } = await supabase.functions.invoke('scrape-website', {
        body: { url: scrapeUrl },
      });

      if (error || result?.error) {
        toast.error(result?.error || 'Could not scrape website');
        setScraping(false);
        return;
      }

      const found: TeamMember[] = (result?.team_members || []).map((t: any) => ({
        name: t.name || '',
        title: t.title || t.role || '',
        photo: t.photo || t.image || '',
      })).filter((t: TeamMember) => t.name);

      if (found.length === 0) {
        toast.error('No team members found on that website');
        setScraping(false);
        return;
      }

      setScrapedMembers(found);
      setSelectedScraped(new Set(found.map((_, i) => i)));
      toast.success(`Found ${found.length} team member${found.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to scrape website');
    }
    setScraping(false);
  };

  const toggleScraped = (idx: number) => {
    setSelectedScraped(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const importScraped = async () => {
    const toImport = scrapedMembers.filter((_, i) => selectedScraped.has(i));
    if (toImport.length === 0) return;

    // Deduplicate by name
    const existingNames = new Set(displayMembers.map(m => m.name.toLowerCase()));
    const newMembers = toImport.filter(m => !existingNames.has(m.name.toLowerCase()));
    const updated = [...displayMembers, ...newMembers];
    await persistMembers(updated);
    toast.success(`Added ${newMembers.length} team member${newMembers.length !== 1 ? 's' : ''}`);
    setShowScrapeModal(false);
    setScrapedMembers([]);
  };

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          {displayMembers.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {displayMembers.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setScrapeUrl(agency?.website || ''); setShowScrapeModal(true); setScrapedMembers([]); }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="h-4 w-4" /> Scan Website
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Team members appear in your proposals. You can add them manually or scan your website to import them automatically.
      </p>

      {/* Team grid */}
      {displayMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Users2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No team members yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add your team so they appear in proposals</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => { setScrapeUrl(agency?.website || ''); setShowScrapeModal(true); setScrapedMembers([]); }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Globe className="h-4 w-4" /> Scan Website
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayMembers.map((m, idx) => (
            <div
              key={idx}
              className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden text-sm font-bold text-muted-foreground">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                {m.title && <p className="truncate text-xs text-muted-foreground">{m.title}</p>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(idx)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(idx)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">
                {editIndex !== null ? 'Edit Member' : 'Add Team Member'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div
                  className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-border hover:border-brand transition-colors flex items-center justify-center bg-muted"
                  onClick={() => photoRef.current?.click()}
                >
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  {photoPreview ? (
                    <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Click to upload a photo</span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Alex Johnson"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title / Role</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Creative Director"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrape Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowScrapeModal(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-foreground">Scan Website for Team</h3>
              <button onClick={() => setShowScrapeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {scrapedMembers.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your website URL and we'll try to find team members automatically.
                </p>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={e => setScrapeUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScrape()}
                    placeholder="youragency.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
                <button
                  onClick={handleScrape}
                  disabled={scraping || !scrapeUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Scanning...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" /> Scan
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Found {scrapedMembers.length} team member{scrapedMembers.length !== 1 ? 's' : ''}. Select the ones you'd like to import.
                </p>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {scrapedMembers.map((m, idx) => {
                    const selected = selectedScraped.has(idx);
                    const alreadyExists = displayMembers.some(
                      existing => existing.name.toLowerCase() === m.name.toLowerCase()
                    );
                    return (
                      <button
                        key={idx}
                        onClick={() => !alreadyExists && toggleScraped(idx)}
                        disabled={alreadyExists}
                        className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          alreadyExists
                            ? 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                            : selected
                            ? 'border-brand bg-brand/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected ? 'border-brand bg-brand' : 'border-border'
                        }`}>
                          {selected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden text-xs font-bold text-muted-foreground">
                          {m.photo ? (
                            <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                          ) : (
                            m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                          {m.title && <p className="truncate text-xs text-muted-foreground">{m.title}</p>}
                          {alreadyExists && <p className="text-[10px] text-muted-foreground italic">Already in team</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button
                    onClick={() => { setScrapedMembers([]); }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Scan again
                  </button>
                  <button
                    onClick={importScraped}
                    disabled={selectedScraped.size === 0}
                    className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-ivory hover:opacity-90 disabled:opacity-50"
                  >
                    Import {selectedScraped.size} Member{selectedScraped.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
