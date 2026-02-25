import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step1AgencyProps {
  data: any;
  onChange: (data: any) => void;
}

export function Step1Agency({ data, onChange }: Step1AgencyProps) {
  const update = (field: string, value: string) => onChange({ ...data, [field]: value });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      {/* Form */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Let's set up your agency</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your details below. You can always change these later.</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Agency Name *</label>
            <input
              type="text"
              placeholder="Victory Creative"
              value={data.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Agency Website</label>
            <input
              type="url"
              placeholder="https://youragency.com"
              value={data.website || ''}
              onChange={(e) => update('website', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email *</label>
              <input
                type="email"
                placeholder="hello@agency.com"
                value={data.email || ''}
                onChange={(e) => update('email', e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={data.phone || ''}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.brand_color || '#fc956e'}
                onChange={(e) => update('brand_color', e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-border"
              />
              <div className="flex gap-2">
                {['#fc956e', '#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#1A1A1A'].map((c) => (
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
          </div>

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
            className="flex h-[420px] flex-col items-center justify-center p-8"
            style={{ backgroundColor: data.brand_color || '#fc956e' }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-center font-display text-xl font-bold text-white">
              {data.name || 'Your Agency'}
            </h3>
            <p className="mt-2 text-center text-sm text-white/70">
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

