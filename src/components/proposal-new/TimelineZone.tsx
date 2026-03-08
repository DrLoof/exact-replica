import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineZoneProps {
  showTimeline: boolean;
  setShowTimeline: (v: boolean) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  hasServices: boolean;
  estimatedDuration: string | null;
  phaseSummary: { names: string; totalWeeks: number } | null;
  timelinePhases: any[];
}

export function TimelineZone({
  showTimeline, setShowTimeline,
  startDate, setStartDate,
  hasServices, estimatedDuration, phaseSummary,
  timelinePhases,
}: TimelineZoneProps) {
  return (
    <section className="rounded-xl border border-parchment bg-card overflow-hidden shadow-card">
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="flex w-full items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground">When does this start?</span>
            {hasServices && !showTimeline && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {estimatedDuration && `Estimated duration: ${estimatedDuration}`}
                {phaseSummary && ` · ${phaseSummary.names}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          {showTimeline ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {showTimeline && (
        <div className="border-t border-parchment px-6 py-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Project Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-parchment bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
            />
          </div>

          {hasServices && estimatedDuration && (
            <div className="rounded-lg bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">Estimated duration: <span className="font-medium text-foreground">{estimatedDuration}</span></p>
              {phaseSummary && <p className="text-xs text-muted-foreground mt-1">{phaseSummary.names}</p>}
            </div>
          )}

          {timelinePhases.length > 0 && (
            <div>
              <p className="mb-2 label-overline">Project Phases</p>
              <div className="space-y-2">
                {timelinePhases.map((phase: any, i: number) => (
                  <div key={phase.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold text-foreground">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{phase.name}</p>
                      {phase.description && <p className="text-[10px] text-muted-foreground truncate">{phase.description}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{phase.default_duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
