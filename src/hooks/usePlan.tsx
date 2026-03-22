import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  max_users: number | null;
  max_proposals: number | null;
  max_clients: number | null;
  max_bundles: number | null;
  max_packages: number | null;
  features: Record<string, any>;
  display_order: number;
  is_active: boolean;
}

interface PlanContextValue {
  plan: Plan | null;
  allPlans: Plan[];
  isTrialing: boolean;
  trialDaysLeft: number;
  trialEnded: boolean;
  proposalsThisMonth: number;
  proposalLimit: number | null;
  isLoading: boolean;

  // Limit checks
  canCreateProposal: boolean;
  canAddClient: (currentCount: number) => boolean;
  canAddBundle: (currentCount: number) => boolean;
  canAddPackage: (currentCount: number) => boolean;
  canAddUser: (currentCount: number) => boolean;

  // Feature checks
  hasFeature: (feature: string) => boolean;
  canUseTemplate: (templateId: string) => boolean;

  // Upgrade helpers
  getMinimumPlanFor: (feature: string) => Plan | null;
  getUpgradeReason: (action: string) => { reason: string; recommendedPlan: Plan | null };
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const authCtx = useAuth();
  const agency = authCtx?.agency;
  const { data: allPlans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as Plan[];
    },
  });

  const agencyPlanId = (agency as any)?.plan_id || 'free';
  const trialEndsAt = (agency as any)?.trial_ends_at;

  const plan = useMemo(
    () => allPlans.find((p) => p.id === agencyPlanId) || allPlans.find((p) => p.id === 'free') || null,
    [allPlans, agencyPlanId]
  );

  const isTrialing = useMemo(() => {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt) > new Date();
  }, [trialEndsAt]);

  const trialDaysLeft = useMemo(() => {
    if (!trialEndsAt) return 0;
    const diff = new Date(trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [trialEndsAt]);

  const trialEnded = useMemo(() => {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt) <= new Date() && agencyPlanId === 'free';
  }, [trialEndsAt, agencyPlanId]);

  // Count proposals created this month
  const { data: proposalsThisMonth = 0 } = useQuery({
    queryKey: ['proposals_this_month', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agency.id)
        .gte('created_at', startOfMonth.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!agency?.id,
  });

  const proposalLimit = plan?.max_proposals ?? null;
  const canCreateProposal = proposalLimit === null || proposalsThisMonth < proposalLimit;

  const canAddClient = (currentCount: number) => {
    if (!plan?.max_clients) return true;
    return currentCount < plan.max_clients;
  };

  const canAddBundle = (currentCount: number) => {
    if (plan?.max_bundles === null || plan?.max_bundles === undefined) return true;
    return currentCount < plan.max_bundles;
  };

  const canAddPackage = (currentCount: number) => {
    if (plan?.max_packages === null || plan?.max_packages === undefined) return true;
    return currentCount < plan.max_packages;
  };

  const canAddUser = (currentCount: number) => {
    if (!plan?.max_users) return true;
    return currentCount < plan.max_users;
  };

  const hasFeature = (feature: string): boolean => {
    if (!plan) return false;
    const val = plan.features?.[feature];
    return !!val;
  };

  const canUseTemplate = (templateId: string): boolean => {
    if (!plan) return false;
    const allowed = plan.features?.templates as string[] | undefined;
    if (!allowed) return false;
    if (allowed.includes('all') || allowed.includes('all_plus_custom')) return true;
    if (allowed.includes(templateId)) return true;
    if (allowed.includes('+1_premium') && templateId !== 'classic') {
      const selectedPremium = (agency as any)?.selected_premium_template;
      return selectedPremium === templateId;
    }
    return false;
  };

  const getMinimumPlanFor = (feature: string): Plan | null => {
    for (const p of allPlans) {
      if (p.features?.[feature]) return p;
    }
    return null;
  };

  const featureLabels: Record<string, string> = {
    pdf_export: 'PDF export',
    e_signature: 'E-signatures',
    interactive_proposals: 'Interactive proposals',
    full_analytics: 'Full analytics',
    color_customizer: 'Color customizer',
    portfolio_section: 'Portfolio section',
    remove_watermark: 'Remove branding',
    custom_domain: 'Custom domain',
    white_label: 'White-label',
    api_access: 'API access',
    follow_up_emails: 'Follow-up emails',
  };

  const getUpgradeReason = (action: string) => {
    const minPlan = getMinimumPlanFor(action);
    const label = featureLabels[action] || action;
    const reason = minPlan
      ? `${label} is available on ${minPlan.name} ($${minPlan.annual_price / 100}/mo billed annually) and above.`
      : `Upgrade to unlock ${label}.`;
    return { reason, recommendedPlan: minPlan };
  };

  const value: PlanContextValue = {
    plan,
    allPlans,
    isTrialing,
    trialDaysLeft,
    trialEnded,
    proposalsThisMonth,
    proposalLimit,
    isLoading: !plan,
    canCreateProposal,
    canAddClient,
    canAddBundle,
    canAddPackage,
    canAddUser,
    hasFeature,
    canUseTemplate,
    getMinimumPlanFor,
    getUpgradeReason,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
