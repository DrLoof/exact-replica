import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePlan, Plan } from '@/hooks/usePlan';
import { Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  customReason?: string;
}

const planHighlights: Record<string, string[]> = {
  starter: [
    'PDF export',
    'E-signatures',
    '10 proposals per month',
    'Color customizer',
    'Remove "Powered by Propopad"',
  ],
  pro: [
    'All 4 templates',
    'Full analytics & tracking',
    'Interactive proposals',
    'Portfolio section',
    '40 proposals per month',
  ],
  business: [
    'Unlimited proposals',
    'Unlimited users & clients',
    'White-label branding',
    'API access',
    'Priority support + onboarding',
  ],
};

export function UpgradeModal({ open, onOpenChange, feature, customReason }: UpgradeModalProps) {
  const { plan, getUpgradeReason } = usePlan();
  const navigate = useNavigate();

  const { reason, recommendedPlan } = feature
    ? getUpgradeReason(feature)
    : { reason: customReason || 'Upgrade to unlock more features.', recommendedPlan: null };

  const targetPlan = recommendedPlan || null;
  const highlights = targetPlan ? planHighlights[targetPlan.id] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-ivory">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-ink">
            <Zap className="h-5 w-5 text-brass" />
            Upgrade to unlock this feature
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-ink-muted mt-1">{reason}</p>

        <div className="mt-4 rounded-lg bg-parchment-soft p-4">
          <p className="text-xs text-ink-faint mb-1">Your current plan</p>
          <p className="text-sm font-semibold text-ink">{plan?.name || 'Free'}</p>

          {targetPlan && (
            <>
              <p className="text-xs text-ink-faint mt-3 mb-1">Recommended</p>
              <p className="text-sm font-semibold text-ink">
                {targetPlan.name} — ${targetPlan.annual_price / 100}/mo{' '}
                <span className="font-normal text-ink-faint">(billed annually)</span>
              </p>
            </>
          )}
        </div>

        {highlights.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-ink">
                <Check className="h-4 w-4 text-brass shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              navigate('/settings/billing');
            }}
          >
            View all plans
          </Button>
          {targetPlan && (
            <Button
              className="flex-1 bg-ink text-ivory hover:bg-ink-soft"
              onClick={() => {
                onOpenChange(false);
                navigate('/settings/billing');
              }}
            >
              Upgrade to {targetPlan.name}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
