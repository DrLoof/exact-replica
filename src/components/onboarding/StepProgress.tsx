import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  'Agency Info',
  'Services',
  'Modules',
  'Bundles',
  'Pricing',
  'Profile',
  'First Proposal',
];

const minutesRemaining = [12, 10, 8, 6, 4, 3, 2];

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-0">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isFuture = step > currentStep;

          return (
            <div key={step} className="flex items-center">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    isCompleted && 'bg-brand text-primary-foreground',
                    isCurrent && 'border-2 border-brand text-brand animate-pulse',
                    isFuture && 'border-2 border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] font-medium whitespace-nowrap',
                    isCurrent ? 'text-brand' : 'text-muted-foreground'
                  )}
                >
                  {stepLabels[i]}
                </span>
              </div>

              {/* Connector line */}
              {step < totalSteps && (
                <div
                  className={cn(
                    'mx-1 mt-[-18px] h-0.5 w-8 sm:w-12',
                    isCompleted ? 'bg-brand' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Step {currentStep} of {totalSteps} · ~{minutesRemaining[currentStep - 1]} min remaining
      </p>
    </div>
  );
}
