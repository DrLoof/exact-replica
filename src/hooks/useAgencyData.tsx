import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useClients() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['clients', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });
}

export function useProposals() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['proposals', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('proposals')
        .select('*, clients(id, company_name, contact_name, contact_email, industry, website), proposal_services(module_id)')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        client: p.clients,
      }));
    },
    enabled: !!agency?.id,
  });
}

export function useServiceModules() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['service_modules', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('service_modules')
        .select('*, service_groups(id, name, icon)')
        .eq('agency_id', agency.id)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });
}

export function useAllServiceModules() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['all_service_modules', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('service_modules')
        .select('*, service_groups(id, name, icon)')
        .eq('agency_id', agency.id)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });
}

export function useServiceGroups() {
  return useQuery({
    queryKey: ['service_groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_groups')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBundles() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['bundles', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('bundles')
        .select('*, bundle_modules(module_id)')
        .eq('agency_id', agency.id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });
}

export function usePackages() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['packages', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('packages')
        .select('*, package_modules(id, module_id, display_order)')
        .eq('agency_id', agency.id)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });
}

export function useTimelinePhases() {
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['timeline_phases', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data, error } = await supabase
        .from('timeline_phases')
        .select('*')
        .eq('agency_id', agency.id)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agency?.id,
  });
}

export function useDashboardStats() {
  // ... keep existing code
  const { agency } = useAuth();
  return useQuery({
    queryKey: ['dashboard_stats', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return { total: 0, active: 0, winRate: 0, totalValue: 0 };
      const { data, error } = await supabase
        .from('proposals')
        .select('status, grand_total')
        .eq('agency_id', agency.id);
      if (error) throw error;
      const all = data || [];
      const total = all.length;
      const active = all.filter(p => p.status === 'sent' || p.status === 'viewed').length;
      const sent = all.filter(p => ['sent', 'viewed', 'accepted', 'declined'].includes(p.status || '')).length;
      const accepted = all.filter(p => p.status === 'accepted').length;
      const winRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;
      const totalValue = all.filter(p => p.status === 'accepted').reduce((sum, p) => sum + (p.grand_total || 0), 0);
      return { total, active, winRate, totalValue };
    },
    enabled: !!agency?.id,
  });
}
