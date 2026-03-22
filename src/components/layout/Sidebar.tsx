import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Layers, Package, FolderOpen,
  Building2, Palette, Receipt, UserPlus, LogOut, Zap, X, Image, MessageSquare, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoOrange from '@/assets/logo_propopad_small.svg';
import { useAuth } from '@/hooks/useAuth';
import { useProposals } from '@/hooks/useAgencyData';
import { FeedbackModal } from '@/components/FeedbackModal';
import { usePlan } from '@/hooks/usePlan';

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Proposals', icon: FileText, path: '/proposals', showCount: true },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Services', icon: Layers, path: '/services' },
  { label: 'Packages', icon: FolderOpen, path: '/packages' },
  { label: 'Bundles', icon: Package, path: '/bundles' },
];

const settingsNav = [
  { label: 'Agency Profile', icon: Building2, path: '/settings/agency' },
  { label: 'Branding', icon: Palette, path: '/settings/branding' },
  { label: 'Pricing & Terms', icon: Receipt, path: '/settings/pricing' },
  { label: 'Billing', icon: CreditCard, path: '/settings/billing' },
  { label: 'Portfolio', icon: Image, path: '/settings/portfolio' },
  { label: 'Team', icon: UserPlus, path: '/settings/team' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, agency, signOut } = useAuth();
  const { data: proposals = [] } = useProposals();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { plan, isTrialing, trialDaysLeft, proposalsThisMonth, proposalLimit } = usePlan();

  const activeProposalCount = proposals.filter((p: any) => p.status === 'sent' && !p.viewed_at).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNav = () => {
    onClose?.();
  };

  const initials = userProfile?.full_name
    ? userProfile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const agencyInitial = agency?.name ? agency.name.charAt(0).toUpperCase() : 'P';

  // Proposal counter
  const showCounter = proposalLimit !== null;
  const usagePercent = proposalLimit ? (proposalsThisMonth / proposalLimit) * 100 : 0;
  const counterColor = usagePercent >= 100 ? 'text-red-500' : usagePercent >= 80 ? 'text-amber-500' : 'text-ink-faint';

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[236px] flex-col bg-ivory" style={{ borderRight: '1px solid hsl(var(--parchment))' }}>
      {/* Logo + close button for mobile */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <img src={logoOrange} alt="Propopad" className="h-7 w-7 rounded-[6px]" />
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">Propopad</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-parchment-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Agency block */}
      {agency?.name && (
        <div className="mx-3 mb-3 rounded-[10px] bg-paper p-2.5 shadow-card">
          <div className="flex items-center gap-2.5">
            {agency.logo_url ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] overflow-hidden bg-ink">
                <img src={agency.logo_url} alt={agency.name} className="h-5 w-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-ink text-[11px] font-bold text-ivory">
                {agencyInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-ink">{agency.name}</p>
              <p className="text-[10px] text-ink-faint">
                {plan?.name || 'Free'}
                {isTrialing && ` · Trial (${trialDaysLeft}d left)`}
                {!isTrialing && ` · ${proposals.length} proposals`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Proposal counter */}
      {showCounter && (
        <div className="mx-3 mb-2 px-3">
          <div className="flex items-center justify-between">
            <p className={cn('text-[10px] font-medium', counterColor)}>
              {proposalsThisMonth} of {proposalLimit} proposals this month
            </p>
          </div>
          <div className="mt-1 h-1 rounded-full bg-parchment-soft overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-brass'
              )}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="label-overline mb-2 px-3">Main</p>
        <ul className="space-y-0.5">
          {mainNav.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleNav}
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
                  onClick={handleNav}
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

      {/* Dynamic Upgrade CTA based on plan */}
      {plan?.id !== 'business' && (
        <div className="relative mx-3 mb-3 overflow-hidden rounded-[10px] bg-paper p-4 shadow-card">
          <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #BE8E5E, transparent)' }} />
          {(!plan || plan.id === 'free') && (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-brass" />
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brass">Upgrade</p>
              </div>
              <p className="text-[12px] text-ink-muted">Unlock PDF, e-signatures, and premium templates</p>
              <Link to="/settings/billing" onClick={handleNav}>
                <button className="mt-3 w-full rounded-[8px] bg-ink px-3 py-1.5 text-xs font-medium text-ivory transition-colors hover:bg-ink-soft">
                  Start at $19/mo →
                </button>
              </Link>
            </>
          )}
          {plan?.id === 'starter' && (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-brass" />
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brass">Go Pro</p>
              </div>
              <p className="text-[12px] text-ink-muted">Unlock all templates, analytics, and interactive proposals</p>
              <Link to="/settings/billing" onClick={handleNav}>
                <button className="mt-3 w-full rounded-[8px] bg-ink px-3 py-1.5 text-xs font-medium text-ivory transition-colors hover:bg-ink-soft">
                  Upgrade — $39/mo →
                </button>
              </Link>
            </>
          )}
          {plan?.id === 'pro' && (
            <>
              <p className="text-[12px] font-semibold text-ink">Pro plan</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {plan.max_users} users · {plan.max_proposals} proposals/mo
              </p>
              <Link to="/settings/billing" onClick={handleNav}>
                <button className="mt-3 w-full rounded-[8px] border border-parchment px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-parchment-soft">
                  Manage plan
                </button>
              </Link>
            </>
          )}
        </div>
      )}

      {plan?.id === 'business' && (
        <div className="mx-3 mb-3 px-3 py-2">
          <p className="text-[11px] text-ink-faint">Business plan</p>
        </div>
      )}

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

      {/* Legal links */}
      <div className="px-4 pb-3 text-center">
        <Link to="/terms" onClick={handleNav} className="text-[10px] hover:underline" style={{ color: '#B8B0A5' }}>Terms</Link>
        <span className="mx-1 text-[10px]" style={{ color: '#B8B0A5' }}>·</span>
        <Link to="/privacy" onClick={handleNav} className="text-[10px] hover:underline" style={{ color: '#B8B0A5' }}>Privacy</Link>
        <span className="mx-1 text-[10px]" style={{ color: '#B8B0A5' }}>·</span>
        <button onClick={() => setFeedbackOpen(true)} className="text-[10px] hover:underline" style={{ color: '#B8B0A5' }}>Feedback</button>
        {userProfile?.is_admin && (
          <>
            <span className="mx-1 text-[10px]" style={{ color: '#B8B0A5' }}>·</span>
            <Link to="/admin" onClick={handleNav} className="text-[10px] hover:underline" style={{ color: '#EF4444' }}>Admin</Link>
          </>
        )}
      </div>
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </aside>
  );
}
