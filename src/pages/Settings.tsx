import { AppShell } from '@/components/layout/AppShell';
import { Building2, Palette, Receipt, UserPlus, ChevronRight, Quote, Award, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

const settingsSections = [
  { label: 'Agency Profile', desc: 'Company name, contact info, and address', icon: Building2, path: '/settings/agency' },
  { label: 'Branding', desc: 'Logo, colors, and visual identity', icon: Palette, path: '/settings/branding' },
  { label: 'Pricing & Terms', desc: 'Currency, rates, payment templates, and legal clauses', icon: Receipt, path: '/settings/pricing' },
  { label: 'Testimonials', desc: 'Client quotes and success metrics for proposals', icon: Quote, path: '/settings/testimonials' },
  { label: 'Why Us — Differentiators', desc: 'Stats and reasons that set you apart', icon: Award, path: '/settings/differentiators' },
  { label: 'Team', desc: 'Invite and manage team members', icon: UserPlus, path: '/settings/team' },
];

export default function Settings() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>
      <div className="space-y-2">
        {settingsSections.map((s) => (
          <Link
            key={s.path}
            to={s.path}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-brand/30 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <s.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
