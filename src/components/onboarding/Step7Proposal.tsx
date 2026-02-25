import { Sparkles, Check } from 'lucide-react';

export function Step7Proposal() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 mb-6">
        <Sparkles className="h-8 w-8 text-brand" />
      </div>

      <h1 className="font-display text-2xl font-bold text-foreground">You're all set! 🎉</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your agency is configured and ready to go. Head to the dashboard to create your first proposal.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-2">
        {[
          'Agency profile configured',
          'Service catalog set up',
          'Pricing defaults saved',
          'Proposal profile ready',
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-status-success">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
