import { useState } from 'react';
import { Sparkles, Loader2, Globe, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Step1AgencyProps {
  data: any;
  onChange: (data: any) => void;
}

export function Step1Agency({ data, onChange }: Step1AgencyProps) {
  const [scanning, setScanning] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

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
      };

      const filled = new Set<string>();
      const updatedData = { ...data };

      // Store scraped data and detected services for later steps
      updatedData.scraped_data = result;
      updatedData.detected_services = result.detected_services || [];
      updatedData.detected_colors = result.detected_colors || [];

      for (const [field, value] of Object.entries(fieldMap)) {
        if (value && !data[field]) {
          await new Promise((r) => setTimeout(r, 300)); // Stagger animation
          updatedData[field] = value;
          filled.add(field);
          setAutoFilledFields(new Set(filled));
          onChange({ ...updatedData });
        }
      }

      const count = filled.size;
      toast.success(`Found ${count} of 6 fields from your website`);

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
              <div className="flex gap-2">
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Address</label>
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
          <div
            className="flex h-[420px] flex-col items-center justify-center p-8 transition-colors duration-500"
            style={{ backgroundColor: data.brand_color || '#fc956e' }}
          >
            {data.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="mb-6 h-16 w-16 rounded-2xl bg-white/20 object-contain p-2" />
            ) : (
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            )}
            <h3 className="text-center font-display text-xl font-bold text-white">
              {data.name || 'Your Agency'}
            </h3>
            {data.tagline && (
              <p className="mt-1 text-center text-xs text-white/60">{data.tagline}</p>
            )}
            <p className="mt-4 text-center text-sm text-white/70">
              Proposal for Client Name
            </p>
            <div className="mt-8 text-center text-xs text-white/50">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="bg-card p-4 text-center text-xs text-muted-foreground">
            Live proposal cover preview
          </div>
        </div>
      </div>
    </div>
  );
}
