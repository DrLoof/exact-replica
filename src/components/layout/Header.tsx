import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Plus, FileText, Eye, Check, X, Clock, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, { icon: typeof Eye; color: string }> = {
  viewed: { icon: Eye, color: 'text-status-viewed' },
  accepted: { icon: Check, color: 'text-status-accepted' },
  declined: { icon: X, color: 'text-status-declined' },
  expiring: { icon: Clock, color: 'text-status-warning' },
};

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuToggle, showMenuButton }: HeaderProps) {
  const { agency, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile?.id) return;
    loadNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userProfile.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  const loadNotifications = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
  };

  const markAllRead = async () => {
    if (!userProfile?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-8 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">{agency?.name || 'My Agency'}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/proposals/new"
          className="flex items-center gap-2 rounded-lg bg-brand px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Proposal</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-brand hover:text-brand-hover">Mark all read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-2 text-xs text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const typeInfo = typeIcons[n.type] || { icon: FileText, color: 'text-muted-foreground' };
                      const Icon = typeInfo.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.proposal_id) navigate(`/proposals/${n.proposal_id}`);
                            setShowNotifications(false);
                          }}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                            !n.is_read && 'bg-accent/30'
                          )}
                        >
                          <div className={cn('mt-0.5', typeInfo.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs text-foreground', !n.is_read && 'font-semibold')}>{n.title}</p>
                            {n.message && <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{n.message}</p>}
                            <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
