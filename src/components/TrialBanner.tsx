import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePlan } from '@/hooks/usePlan';

export function TrialBanner() {
  const { trialEnded, isTrialing, trialDaysLeft } = usePlan();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when trial status changes
  useEffect(() => {
    const key = 'trial_banner_dismissed';
    const stored = localStorage.getItem(key);
    if (stored) {
      const dismissedAt = new Date(stored);
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Auto-show again after 7 days
      if (daysSince > 7) {
        localStorage.removeItem(key);
        setDismissed(false);
      } else {
        setDismissed(true);
      }
    }
  }, []);

  if (dismissed) return null;

  // Show trial ended banner
  if (trialEnded) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#FFF8F0', borderBottom: '1px solid #F0E0C8' }}>
        <p className="text-sm" style={{ color: '#8A6A3A' }}>
          Your free trial has ended. Upgrade to keep using Pro features.
        </p>
        <div className="flex items-center gap-3">
          <Link to="/settings/billing" className="text-sm font-medium underline" style={{ color: '#8A6A3A' }}>
            View plans →
          </Link>
          <button
            onClick={() => { setDismissed(true); localStorage.setItem('trial_banner_dismissed', new Date().toISOString()); }}
            className="text-[#8A6A3A] hover:text-[#6B5030]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Show trial countdown when ≤ 3 days left
  if (isTrialing && trialDaysLeft <= 3) {
    return (
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#FFF8F0', borderBottom: '1px solid #F0E0C8' }}>
        <p className="text-sm" style={{ color: '#8A6A3A' }}>
          ⚡ Pro trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}. Upgrade to keep all features.
        </p>
        <Link to="/settings/billing" className="text-sm font-medium underline" style={{ color: '#8A6A3A' }}>
          Upgrade now →
        </Link>
      </div>
    );
  }

  return null;
}
