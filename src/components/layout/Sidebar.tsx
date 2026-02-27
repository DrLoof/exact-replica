import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Layers, Package,
  Building2, Palette, Receipt, UserPlus, LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import propopadLogo from '@/assets/propopad-logo.svg';
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

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-border bg-surface-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
          <img src={propopadLogo} alt="Propopad" className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">Propopad</span>
      </div>

      {/* Agency name block */}
      {agency?.name && (
        <div className="mx-4 mb-3 rounded-lg bg-muted px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Agency</p>
          <p className="text-[13px] font-semibold text-foreground truncate">{agency.name}</p>
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
                    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                    active
                      ? 'font-semibold text-brand-hover'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  style={active ? { background: 'linear-gradient(135deg, #fff8f5, #FFF1EB)' } : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand" />
                  )}
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="flex-1">{item.label}</span>
                  {item.showCount && activeProposalCount > 0 && (
                    <span className={cn(
                      'min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none',
                      active
                        ? 'bg-brand text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
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
                    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                    active
                      ? 'font-semibold text-brand-hover'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  style={active ? { background: 'linear-gradient(135deg, #fff8f5, #FFF1EB)' } : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand" />
                  )}
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade CTA — Dark */}
      <div className="relative mx-3 mb-3 overflow-hidden rounded-xl p-4" style={{ background: 'linear-gradient(145deg, #1A1917, #2A2925)' }}>
        {/* Coral glow */}
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 blur-[20px]" style={{ background: '#fc956e' }} />
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-amber-400">Go Pro</p>
        </div>
        <p className="text-[12px] text-white/60">Remove branding & unlock analytics</p>
        <button className="mt-3 w-full rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          Upgrade — $79/mo
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{userProfile?.full_name || 'User'}</p>
          <p className="truncate text-xs text-muted-foreground">{userProfile?.email}</p>
        </div>
        <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
