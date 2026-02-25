import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SettingsBranding() {
  const { agency } = useAuth();
  const [brandColor, setBrandColor] = useState('#fc956e');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [darkColor, setDarkColor] = useState('#0C0C0E');
  const [logoUrl, setLogoUrl] = useState('');
  const [proposalPrefix, setProposalPrefix] = useState('PRO');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (agency) {
      setBrandColor(agency.brand_color || '#fc956e');
      setSecondaryColor(agency.secondary_color || '');
      setDarkColor(agency.dark_color || '#0C0C0E');
      setLogoUrl(agency.logo_url || '');
      setProposalPrefix(agency.proposal_prefix || 'PRO');
    }
  }, [agency]);

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true);
    const { error } = await supabase.from('agencies').update({
      brand_color: brandColor,
      secondary_color: secondaryColor || null,
      dark_color: darkColor,
      logo_url: logoUrl || null,
      proposal_prefix: proposalPrefix,
    }).eq('id', agency.id);
    if (error) toast.error('Failed to save');
    else toast.success('Branding updated');
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agency) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be under 2 MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${agency.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('agency-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('agency-logos').getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    setLogoUrl(publicUrl);

    await supabase.from('agencies').update({ logo_url: publicUrl }).eq('id', agency.id);
    toast.success('Logo uploaded');
    setUploading(false);
  };

  const handleLogoRemove = async () => {
    if (!agency) return;
    setLogoUrl('');
    await supabase.from('agencies').update({ logo_url: null }).eq('id', agency.id);
    toast.success('Logo removed');
  };

  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="h-10 w-10 cursor-pointer rounded-lg border border-border" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-2xl font-bold text-foreground">Branding</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Colors</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ColorField label="Brand Color" value={brandColor} onChange={setBrandColor} />
            <ColorField label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorField label="Dark Color" value={darkColor} onChange={setDarkColor} />
          </div>
          <div className="mt-4 flex gap-3">
            <div className="h-20 flex-1 rounded-lg" style={{ backgroundColor: brandColor }} />
            <div className="h-20 flex-1 rounded-lg" style={{ backgroundColor: secondaryColor || '#888' }} />
            <div className="h-20 flex-1 rounded-lg" style={{ backgroundColor: darkColor }} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Logo</h2>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="Agency logo" className="h-16 rounded-lg border border-border bg-muted object-contain p-2" />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  onClick={handleLogoRemove}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 py-8 text-sm text-muted-foreground transition-colors hover:border-brand hover:bg-muted disabled:opacity-50"
            >
              <Upload className="h-6 w-6" />
              {uploading ? 'Uploading...' : 'Click to upload your logo'}
              <span className="text-xs">PNG, JPG, SVG — max 2 MB</span>
            </button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Proposal</h2>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Reference Prefix</label>
          <input
            type="text"
            value={proposalPrefix}
            onChange={e => setProposalPrefix(e.target.value)}
            className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <p className="mt-1 text-xs text-muted-foreground">Preview: {proposalPrefix}-2026-0001</p>
        </div>
      </div>
    </AppShell>
  );
}
