import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { StepProgress } from './StepProgress';
import { Step1Agency } from './Step1Agency';
import { Step2Groups } from './Step2Groups';
import { Step3Modules } from './Step3Modules';
import { Step4Bundles } from './Step4Bundles';
import { Step5Pricing } from './Step5Pricing';
import { Step6Profile } from './Step6Profile';
import { Step7Proposal } from './Step7Proposal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { agency, userProfile } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 data
  const [agencyData, setAgencyData] = useState<any>({});
  // Step 2 data
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  // Step 3 data
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  // Step 5 data
  const [pricingData, setPricingData] = useState<any>({});
  // Group name lookup
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agency) {
      setAgencyData({
        name: agency.name || '',
        email: agency.email || '',
        website: agency.website || '',
        phone: agency.phone || '',
        brand_color: agency.brand_color || '#fc956e',
        address: agency.address_line1 || '',
      });
      setPricingData({
        currency: agency.currency || 'USD',
        currency_symbol: agency.currency_symbol || '$',
        hourly_rate: agency.hourly_rate || '',
        payment_template: '50-50',
        proposal_prefix: agency.proposal_prefix || agency.name?.slice(0, 3).toUpperCase() || '',
        default_validity_days: agency.default_validity_days || 30,
        default_revision_rounds: agency.default_revision_rounds ?? 2,
        default_notice_period: agency.default_notice_period || '30 days',
      });
    }
  }, [agency]);

  useEffect(() => {
    supabase.from('service_groups').select('id, name').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((g) => { map[g.id] = g.name; });
        setGroupNames(map);
      }
    });
  }, []);

  const selectedGroupNames = selectedGroups.map((id) => groupNames[id]).filter(Boolean);

  const canContinue = () => {
    switch (step) {
      case 1: return !!(agencyData.name && agencyData.email);
      case 2: return selectedGroups.length > 0;
      default: return true;
    }
  };

  const handleContinue = async () => {
    if (step === 7) {
      // Save everything and complete onboarding
      await saveOnboardingData();
      toast.success('Onboarding complete! Welcome to Propopad.');
      navigate('/dashboard');
      return;
    }

    // Save Step 1 data when moving past it
    if (step === 1 && agency) {
      await supabase.from('agencies').update({
        name: agencyData.name,
        email: agencyData.email,
        website: agencyData.website,
        phone: agencyData.phone,
        brand_color: agencyData.brand_color || '#fc956e',
        address_line1: agencyData.address,
        onboarding_step: 2,
      }).eq('id', agency.id);
    }

    if (step === 5 && agency) {
      await supabase.from('agencies').update({
        currency: pricingData.currency,
        currency_symbol: pricingData.currency_symbol,
        hourly_rate: pricingData.hourly_rate || null,
        proposal_prefix: pricingData.proposal_prefix,
        default_validity_days: pricingData.default_validity_days,
        default_revision_rounds: pricingData.default_revision_rounds,
        default_notice_period: pricingData.default_notice_period,
        onboarding_step: 6,
      }).eq('id', agency.id);
    }

    setStep((s) => s + 1);
  };

  const saveOnboardingData = async () => {
    if (!agency) return;

    await supabase.from('agencies').update({
      onboarding_complete: true,
      onboarding_step: 7,
    }).eq('id', agency.id);
  };

  const showSkip = step === 4 || step === 6;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold text-foreground">Propopad</span>
        </div>
        <button
          onClick={() => {
            saveOnboardingData();
            navigate('/dashboard');
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Skip setup →
        </button>
      </div>

      {/* Progress */}
      <div className="border-b border-border px-6 py-5">
        <StepProgress currentStep={step} totalSteps={7} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          {step === 1 && <Step1Agency data={agencyData} onChange={setAgencyData} />}
          {step === 2 && <Step2Groups selectedGroups={selectedGroups} onChange={setSelectedGroups} />}
          {step === 3 && <Step3Modules selectedGroupNames={selectedGroupNames} selectedModules={selectedModules} onChange={setSelectedModules} />}
          {step === 4 && <Step4Bundles />}
          {step === 5 && <Step5Pricing data={pricingData} onChange={setPricingData} />}
          {step === 6 && <Step6Profile />}
          {step === 7 && <Step7Proposal />}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 sm:px-12 lg:px-20">
        <div>
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showSkip && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {step === 7 ? 'Go to Dashboard' : 'Continue'}
            {step < 7 && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
