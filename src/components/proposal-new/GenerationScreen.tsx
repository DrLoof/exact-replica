import { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GenerationScreen({ clientName }: { clientName: string }) {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { label: 'Executive summary written', done: false },
    { label: 'Scope of services structured', done: false },
    { label: 'Timeline generated', done: false },
    { label: 'Investment calculated', done: false },
    { label: 'Formatting and polishing...', done: false },
  ]);

  useEffect(() => {
    const timings = [600, 1200, 1800, 2400, 3200];
    timings.forEach((t, i) => {
      setTimeout(() => {
        setSteps(prev => prev.map((s, j) => j <= i ? { ...s, done: true } : s));
        setProgress(Math.min(((i + 1) / timings.length) * 100, 100));
      }, t);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center px-6">
        <div className="mb-8 flex items-center justify-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
          <span className="text-lg font-semibold">Building your proposal for {clientName}...</span>
        </div>
        <div className="mb-8 space-y-3 text-left">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {step.done ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-status-success/20">
                  <Check className="h-3 w-3 text-status-success" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border">
                  <Loader2 className={cn("h-3 w-3 text-muted-foreground", i === steps.findIndex(s => !s.done) && "animate-spin")} />
                </div>
              )}
              <span className={cn("text-sm", step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
