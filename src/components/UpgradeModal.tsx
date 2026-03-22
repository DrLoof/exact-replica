import { Dialog, DialogContent } from '@/components/ui/dialog';
import { usePlan, Plan } from '@/hooks/usePlan';
import { Check, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  customReason?: string;
}

const planHighlights: Record<string, string[]> = {
  starter: [
    'Export proposals as PDF',
    'E-signatures for client approval',
    '10 proposals per month',
    'Color customizer for brand matching',
    'Remove "Powered by Propopad" branding',
  ],
  pro: [
    'All 4 proposal templates',
    'Interactive proposals (clients toggle services)',
    'Full proposal analytics (time per section)',
    'Portfolio section in proposals',
    'Up to 5 team members and 40 proposals/month',
  ],
  business: [
    'Unlimited proposals and team members',
    'Full white-label branding',
    'API access for custom integrations',
    'Custom templates',
    'Priority support with onboarding call',
  ],
};

export function UpgradeModal({ open, onOpenChange, feature, customReason }: UpgradeModalProps) {
  const { plan, getUpgradeReason, allPlans } = usePlan();
  const navigate = useNavigate();

  const { reason, recommendedPlan } = feature
    ? getUpgradeReason(feature)
    : { reason: customReason || 'Upgrade to unlock more features.', recommendedPlan: null };

  // Determine the target plan — if no recommended plan, suggest the next tier up
  const targetPlan: Plan | null = recommendedPlan || (() => {
    const currentIdx = allPlans.findIndex(p => p.id === plan?.id);
    return currentIdx >= 0 && currentIdx < allPlans.length - 1 ? allPlans[currentIdx + 1] : allPlans.find(p => p.id === 'starter') || null;
  })();

  const highlights = targetPlan ? planHighlights[targetPlan.id] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[440px] p-0 border-0 gap-0 overflow-hidden"
        style={{
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:bg-[#F4F1EB]"
          style={{ color: '#8A7F72' }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pb-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5" style={{ color: '#BE8E5E' }} />
            <h2 className="text-[20px] font-bold" style={{ color: '#2A2118' }}>
              Upgrade to {targetPlan?.name || 'unlock'}
            </h2>
          </div>

          {/* Reason */}
          <p className="text-[14px] leading-relaxed" style={{ color: '#4A3F32' }}>
            {reason}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 my-4" style={{ borderTop: '1px solid #EEEAE3' }} />

        {/* Feature highlights */}
        {highlights.length > 0 && (
          <div className="px-6">
            <p className="text-[13px] font-medium mb-3" style={{ color: '#4A3F32' }}>
              Here's what you get with {targetPlan?.name}:
            </p>
            <ul className="space-y-2.5">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#6E9A7A' }} />
                  <span className="text-[14px]" style={{ color: '#4A3F32' }}>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Divider */}
        <div className="mx-6 my-4" style={{ borderTop: '1px solid #EEEAE3' }} />

        {/* Pricing + actions */}
        <div className="px-6 pb-6">
          {targetPlan && targetPlan.annual_price > 0 && (
            <div className="mb-4">
              <p className="text-[15px] font-semibold" style={{ color: '#2A2118' }}>{targetPlan.name}</p>
              <p className="text-[13px]" style={{ color: '#8A7F72' }}>
                ${targetPlan.annual_price / 100}/mo billed annually · ${targetPlan.monthly_price / 100}/mo billed monthly
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => { onOpenChange(false); navigate('/settings/billing'); }}
              className="text-[13px] font-medium transition-colors hover:underline"
              style={{ color: '#8A7F72' }}
            >
              Compare all plans
            </button>
            <div className="flex-1" />
            {targetPlan && (
              <button
                onClick={() => { onOpenChange(false); navigate('/settings/billing'); }}
                className="rounded-xl px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#2A2118' }}
              >
                Upgrade to {targetPlan.name} →
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
