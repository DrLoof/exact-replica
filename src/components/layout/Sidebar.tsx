import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Layers, Package,
  Building2, Palette, Receipt, UserPlus, LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProposals } from '@/hooks/useAgencyData';

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Proposals', icon: FileText, path: '/proposals', showCount: true },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Services', icon: Layers, path: '/services' },
  { label: 'Bundles', icon: Package, path: '/bundles' },
];

const settingsNav = [
  { label: 'Agency Profile', icon: Building2, path: '/settings/agency' },
  { label: 'Branding', icon: Palette, path: '/settings/branding' },
  { label: 'Pricing & Terms', icon: Receipt, path: '/settings/pricing' },
  { label: 'Team', icon: UserPlus, path: '/settings/team' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, agency, signOut } = useAuth();
  const { data: proposals = [] } = useProposals();

  const activeProposalCount = proposals.filter((p: any) => p.status === 'sent' || p.status === 'viewed').length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = userProfile?.full_name
    ? userProfile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const agencyInitial = agency?.name ? agency.name.charAt(0).toUpperCase() : 'P';

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[236px] flex-col bg-ivory" style={{ borderRight: '1px solid hsl(var(--parchment))' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        {/* Paper-fold P mark */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 2C3 0.9 3.9 0 5 0H18L23 5V24C23 25.1 22.1 26 21 26H5C3.9 26 3 25.1 3 24V2Z" fill="#2A2118"/>
          <path d="M18 0L23 5H20C18.9 5 18 4.1 18 3V0Z" fill="#4A3F32"/>
          <text x="9.5" y="19" fill="#FAF9F6" fontSize="14" fontWeight="700" fontFamily="Satoshi, system-ui, sans-serif">P</text>
        </svg>
        <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">Propopad</span>
      </div>

      {/* Agency block — white card with shadow */}
      {agency?.name && (
        <div className="mx-3 mb-3 rounded-[10px] bg-paper p-2.5 shadow-card">
          <div className="flex items-center gap-2.5">
            {agency.logo_url ? (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] overflow-hidden bg-ink"
              >
                <img src={agency.logo_url} alt={agency.name} className="h-5 w-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-ink text-[11px] font-bold text-ivory">
                {agencyInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-ink">{agency.name}</p>
              <p className="text-[10px] text-ink-faint">Free · {proposals.length} proposals</p>
            </div>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2">
        <p className="label-overline mb-2 px-3">Main</p>
        <ul className="space-y-0.5">
          {mainNav.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm transition-all duration-200',
                    active
                      ? 'font-semibold text-ink shadow-card bg-paper'
                      : 'text-ink-muted hover:bg-parchment-soft hover:text-ink'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="flex-1">{item.label}</span>
                  {item.showCount && activeProposalCount > 0 && (
                    <span className={cn(
                      'min-w-[20px] rounded-[6px] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none',
                      active
                        ? 'bg-brass-glow text-brass'
                        : 'bg-parchment-soft text-ink-faint'
                    )}>
                      {activeProposalCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="label-overline mb-2 mt-6 px-3">Settings</p>
        <ul className="space-y-0.5">
          {settingsNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm transition-all duration-200',
                    active
                      ? 'font-semibold text-ink shadow-card bg-paper'
                      : 'text-ink-muted hover:bg-parchment-soft hover:text-ink'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade CTA — White card with brass top line */}
      <div className="relative mx-3 mb-3 overflow-hidden rounded-[10px] bg-paper p-4 shadow-card">
        {/* Brass top line */}
        <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #ffb180, transparent)' }} />
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="h-3.5 w-3.5 text-brass" />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brass">Go Pro</p>
        </div>
        <p className="text-[12px] text-ink-muted">Remove branding & unlock analytics</p>
        <button className="mt-3 w-full rounded-[8px] bg-ink px-3 py-1.5 text-xs font-medium text-ivory transition-colors hover:bg-ink-soft">
          Upgrade — $79/mo
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: '1px solid hsl(var(--parchment))' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-ivory">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-ink">{userProfile?.full_name || 'User'}</p>
          <p className="truncate text-xs text-ink-muted">{userProfile?.email}</p>
        </div>
        <button onClick={handleSignOut} className="text-ink-faint hover:text-ink">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
