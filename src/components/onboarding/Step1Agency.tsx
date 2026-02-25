import { useState, useRef } from 'react';
import { Sparkles, Loader2, Globe, CheckCircle2, Upload, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BrandProvider } from '@/components/proposal-template/BrandTheme';
import { HeroCover } from '@/components/proposal-template/HeroCover';

interface Step1AgencyProps {
  data: any;
  onChange: (data: any) => void;
}

export function Step1Agency({ data, onChange }: Step1AgencyProps) {
  const [scanning, setScanning] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow transparent-capable formats
    const allowed = ['image/png', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PNG, SVG, or WebP file for best results');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logos/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('agency-logos').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Failed to upload logo');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path);
    onChange({ ...data, logo_url: urlData.publicUrl });
    toast.success('Logo uploaded');
    setUploading(false);
  };

  const removeLogo = () => {
    onChange({ ...data, logo_url: '' });
  };

  const update = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleAutoFill = async () => {
    if (!data.website) {
      toast.error('Please enter your website URL first');
      return;
    }

    setScanning(true);
    setAutoFilledFields(new Set());

    try {
      const { data: result, error } = await supabase.functions.invoke('scrape-website', {
        body: { url: data.website },
      });

      if (error) throw error;

      if (result.error) {
        toast.error(result.error);
        setScanning(false);
        return;
      }

      // Animate fields filling in one by one
      const fieldMap: Record<string, string> = {
        name: result.name,
        email: result.email,
        phone: result.phone,
        brand_color: result.brand_color,
        logo_url: result.logo_url,
        tagline: result.tagline,
        address: result.address,
      };

      const filled = new Set<string>();
      const updatedData = { ...data };

      // Store scraped data and detected services for later steps
      updatedData.scraped_data = result;
      updatedData.detected_services = result.detected_services || [];
      updatedData.detected_colors = result.detected_colors || [];

      // Fields that should always be overwritten by autofill (even if they have a default value)
      const alwaysOverwrite = new Set(['name', 'tagline', 'brand_color', 'logo_url', 'address']);

      for (const [field, value] of Object.entries(fieldMap)) {
        if (value && (alwaysOverwrite.has(field) || !data[field])) {
          await new Promise((r) => setTimeout(r, 300)); // Stagger animation
          updatedData[field] = value;
          filled.add(field);
          setAutoFilledFields(new Set(filled));
          onChange({ ...updatedData });
        }
      }

      const count = filled.size;
      toast.success(`Found ${count} of 7 fields from your website`);

      // Auto-fade badges after 4 seconds
      setTimeout(() => setAutoFilledFields(new Set()), 4000);
    } catch (e) {
      toast.error("We couldn't access your site. Fill in the details manually.");
    }

    setScanning(false);
  };

  const AutoFilledBadge = ({ field }: { field: string }) => {
    if (!autoFilledFields.has(field)) return null;
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-brand animate-fade-in">
        <CheckCircle2 className="h-3 w-3" /> Auto-filled
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      {/* Form */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Let's set up your agency</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your website and we'll auto-fill as much as possible.</p>

        <div className="mt-8 space-y-5">
          {/* Website + Auto-fill */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Agency Website</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="youragency.com"
                  value={data.website || ''}
                  onChange={(e) => update('website', e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <button
                onClick={handleAutoFill}
                disabled={scanning || !data.website}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50 whitespace-nowrap"
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Auto-fill from website
                  </>
                )}
              </button>
            </div>
            <button
              onClick={() => {}}
              className="mt-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              I don't have a website yet
            </button>
          </div>

          {/* Agency Name */}
          <div>
            <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
              Agency Name *
              <AutoFilledBadge field="name" />
            </label>
            <input
              type="text"
              placeholder="Victory Creative"
              value={data.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
                Email *
                <AutoFilledBadge field="email" />
              </label>
              <input
                type="email"
                placeholder="hello@agency.com"
                value={data.email || ''}
                onChange={(e) => update('email', e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
                Phone
                <AutoFilledBadge field="phone" />
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={data.phone || ''}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          {/* Brand Color & Logo */}
          <div className="grid grid-cols-2 gap-4">
            {/* Brand Color */}
            <div>
              <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
                Brand Color
                <AutoFilledBadge field="brand_color" />
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.brand_color || '#fc956e'}
                  onChange={(e) => update('brand_color', e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                />
                <div className="flex flex-wrap gap-2">
                  {(data.detected_colors?.length > 0
                    ? data.detected_colors
                    : ['#fc956e', '#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#1A1A1A']
                  ).map((c: string) => (
                    <button
                      key={c}
                      onClick={() => update('brand_color', c)}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                        (data.brand_color || '#fc956e') === c ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {data.detected_colors?.length > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">Colors detected from your website</p>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
                Logo
                <AutoFilledBadge field="logo_url" />
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {data.logo_url ? (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-xl border border-border bg-muted/50 p-1.5">
                    <img src={data.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    <button
                      onClick={removeLogo}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload PNG or SVG
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
              Tagline
              <AutoFilledBadge field="tagline" />
            </label>
            <input
              type="text"
              placeholder="A brief tagline for your agency"
              value={data.tagline || ''}
              onChange={(e) => update('tagline', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 flex items-center text-sm font-medium text-foreground">
              Address
              <AutoFilledBadge field="address" />
            </label>
            <textarea
              placeholder="123 Main St, Suite 100&#10;New York, NY 10001"
              value={data.address || ''}
              onChange={(e) => update('address', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block">
        <div className="sticky top-8 overflow-hidden rounded-2xl border border-border shadow-lg">
          <BrandProvider brand={{
            agencyName: (data.name || 'Your Agency').toUpperCase(),
            agencyFullName: data.name || 'Your Agency',
            primaryColor: data.brand_color || '#fc956e',
            darkColor: '#0A0A0A',
            logoUrl: data.logo_url || null,
            logoInitial: (data.name || 'A').charAt(0).toUpperCase(),
            contactEmail: data.email || '',
            contactWebsite: data.website || '',
            contactPhone: data.phone || '',
          }}>
            <div className="pointer-events-none overflow-hidden" style={{ height: '480px' }}>
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                <HeroCover
                  clientName="Propopad Inc."
                  proposalTitle="Brand Evolution & Digital Growth Strategy"
                  subtitle="A comprehensive approach to repositioning your brand and accelerating digital presence across all channels."
                  date={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                />
              </div>
            </div>
          </BrandProvider>
          <div className="bg-card p-4 text-center text-xs text-muted-foreground">
            Live proposal cover preview
          </div>
        </div>
      </div>
    </div>
  );
}
