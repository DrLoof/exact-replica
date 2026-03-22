import { useState } from 'react';
import { Globe, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import propopadLogo from '@/assets/logo_propopad_small.svg';

interface ScanScreenProps {
  onScrapeComplete: (data: any) => void;
  onManualSetup: () => void;
}

const scanSteps = [
  { key: 'name', label: 'Agency name found' },
  { key: 'logo', label: 'Logo detected' },
  { key: 'colors', label: 'Brand colors extracted' },
  { key: 'contact', label: 'Contact details found' },
  { key: 'services', label: 'services identified' },
  { key: 'testimonials', label: 'testimonials found' },
  { key: 'profile', label: 'Generating your profile...' },
];

export function ScanScreen({ onScrapeComplete, onManualSetup }: ScanScreenProps) {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stepDetails, setStepDetails] = useState<Record<string, string>>({});

  const handleScan = async () => {
    if (!url) return;
    setScanning(true);
    setError(null);
    setCompletedSteps([]);
    setCurrentStep('name');
    setProgress(5);

    try {
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 2, 75));
      }, 200);

      const { data: result, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
        body: { url },
      });

      clearInterval(progressInterval);

      if (scrapeError || result?.error) {
        setError(result?.error || 'Could not access your website.');
        setScanning(false);
        return;
      }

      const details: Record<string, string> = {};
      const steps: string[] = [];

      if (result.name) details.name = result.name;
      steps.push('name');
      setCompletedSteps([...steps]);
      setCurrentStep('logo');
      setProgress(20);
      await delay(200);

      if (result.logo_url) details.logo = 'Found';
      steps.push('logo');
      setCompletedSteps([...steps]);
      setCurrentStep('colors');
      setProgress(35);
      await delay(200);

      if (result.brand_color || result.detected_colors?.length) {
        details.colors = result.brand_color || result.detected_colors?.[0];
      }
      steps.push('colors');
      setCompletedSteps([...steps]);
      setCurrentStep('contact');
      setProgress(50);
      await delay(200);

      if (result.email || result.phone) {
        details.contact = [result.email, result.phone].filter(Boolean).join(', ');
      }
      steps.push('contact');
      setCompletedSteps([...steps]);
      setCurrentStep('services');
      setProgress(65);
      await delay(200);

      const serviceCount = result.detected_services?.length || 0;
      details.services = `${serviceCount}`;
      steps.push('services');
      setCompletedSteps([...steps]);
      setCurrentStep('testimonials');
      setProgress(80);
      await delay(200);

      const testimonialCount = result.testimonials?.length || 0;
      details.testimonials = `${testimonialCount}`;
      steps.push('testimonials');
      setCompletedSteps([...steps]);
      setCurrentStep('profile');
      setProgress(90);
      await delay(300);

      steps.push('profile');
      setCompletedSteps([...steps]);
      setCurrentStep(null);
      setProgress(100);
      setStepDetails(details);

      await delay(500);
      onScrapeComplete(result);
    } catch (e) {
      setError("We couldn't access your site. Try setting up manually.");
      setScanning(false);
    }
  };

  const getStepLabel = (step: typeof scanSteps[0]) => {
    const detail = stepDetails[step.key];
    if (step.key === 'services' && detail) {
      return detail === '0' ? 'No services identified' : `${detail} services identified`;
    }
    if (step.key === 'testimonials' && detail) {
      return detail === '0' ? 'No testimonials found' : `${detail} testimonials found`;
    }
    return step.label;
  };

  if (scanning) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <h2 className="font-display text-xl font-bold text-foreground text-center">
            Scanning {url.replace(/^https?:\/\//, '')}...
          </h2>

          <div className="mt-8 space-y-3">
            <AnimatePresence>
              {scanSteps.map((step) => {
                const isCompleted = completedSteps.includes(step.key);
                const isCurrent = currentStep === step.key;
                const isVisible = isCompleted || isCurrent;

                if (!isVisible) return null;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-status-success shrink-0" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-ink animate-spin shrink-0" />
                    )}
                    <span className={`text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {getStepLabel(step)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Progress bar — espresso color */}
          <div className="mt-8">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-ink"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-muted-foreground tabular-nums">{progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden">
          <img src={propopadLogo} alt="Propopad" className="h-14 w-14" />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
          Create your first proposal<br />in under 3 minutes
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your website and we'll set up everything automatically.
        </p>

        <div className="mt-8">
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brass" />
            <input
              type="url"
              placeholder="youragency.com"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="w-full rounded-xl border border-border bg-card py-3.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!url}
            className="mt-4 w-full rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Scan my website
          </button>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            By scanning, you allow Propopad to read publicly available content from this URL to set up your account.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={() => {
              const clientId = 'c099ffda-2b15-46ea-a080-a63c09f4713c';
              const redirectUri = `${window.location.origin}/settings/integrations/hubspot/callback`;
              const scopes = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write crm.objects.companies.read crm.objects.companies.write';
              window.open(`https://app-eu1.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`, '_blank');
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#FF7A59">
              <path d="M17.69 13.13c-.57 0-1.08.23-1.46.6l-2.72-1.69c.1-.33.16-.69.16-1.06 0-.31-.04-.6-.13-.88l2.73-1.72c.37.35.87.56 1.42.56 1.14 0 2.07-.93 2.07-2.07S18.83 4.8 17.69 4.8s-2.07.93-2.07 2.07c0 .18.02.35.07.51l-2.74 1.73c-.62-.72-1.54-1.18-2.57-1.18-1.87 0-3.39 1.52-3.39 3.39 0 .67.2 1.29.53 1.82L5.8 14.79c-.23-.1-.48-.15-.74-.15-.97 0-1.76.79-1.76 1.76s.79 1.76 1.76 1.76 1.76-.79 1.76-1.76c0-.22-.04-.43-.12-.62l1.73-1.67c.62.49 1.4.78 2.24.78.96 0 1.83-.38 2.47-1l2.7 1.68c-.06.18-.09.37-.09.57 0 1.14.93 2.07 2.07 2.07s2.07-.93 2.07-2.07-.93-2.07-2.07-2.07h-.13z" />
            </svg>
            Connect HubSpot
          </button>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            Import your clients and get started faster
          </p>

          <button
            onClick={onManualSetup}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            No website? Set up manually →
          </button>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
