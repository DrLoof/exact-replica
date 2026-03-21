import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminFunnel } from '@/components/admin/AdminFunnel';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminProposals } from '@/components/admin/AdminProposals';
import { AdminRevenue } from '@/components/admin/AdminRevenue';
import { AdminFeedback } from '@/components/admin/AdminFeedback';
import { AdminSystem } from '@/components/admin/AdminSystem';

function formatTimeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  return `${Math.floor(s / 3600)} hours ago`;
}

export default function Admin() {
  const { userProfile, loading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke('admin-stats', {});
      if (res.data && !res.error) {
        setData(res.data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile?.is_admin) {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [userProfile?.is_admin, fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!userProfile?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppShell>
      {/* Red admin bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50" style={{ backgroundColor: '#EF4444' }} />

      <div className="p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">Propopad Admin</h1>
            <p className="text-xs text-ink-faint mt-1">
              Last updated: {lastUpdated ? formatTimeAgo(lastUpdated) : 'loading...'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={fetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {!data ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-10">
            <SectionHeader label="Overview" />
            <AdminOverview data={data.overview} />

            <SectionHeader label="Funnel" />
            <AdminFunnel data={data.funnel} />

            <SectionHeader label="Users" />
            <AdminUsers agencies={data.recentAgencies} growthData={data.growthData} />

            <SectionHeader label="Proposals" />
            <AdminProposals data={data.proposals} />

            <SectionHeader label="Revenue" />
            <AdminRevenue />

            <SectionHeader label="Feedback" />
            <AdminFeedback feedback={data.feedback} onRefresh={fetchData} />

            <SectionHeader label="System" />
            <AdminSystem data={data.system} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#B8B0A5' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: '#EEEAE3' }} />
    </div>
  );
}
