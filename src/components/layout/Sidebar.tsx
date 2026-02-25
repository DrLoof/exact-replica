import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Layers, Package,
  Building2, Palette, Receipt, UserPlus, LogOut, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Proposals', icon: FileText, path: '/proposals' },
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
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">Propopad</span>
      </div>

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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-l-[3px] border-brand bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-l-[3px] border-brand bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

      {/* Upgrade CTA */}
      <div className="mx-3 mb-3 rounded-xl bg-accent p-4">
        <p className="text-sm font-semibold text-accent-foreground">Upgrade to Pro</p>
        <p className="mt-1 text-xs text-muted-foreground">Remove branding & unlock analytics</p>
        <button className="mt-3 w-full rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-brand-hover">
          Upgrade — $49/mo
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
