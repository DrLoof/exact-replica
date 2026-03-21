/**
 * Utility functions for computing proposal executive summary stats.
 */

/**
 * Parse a phase duration string like "1-2 weeks", "WEEKS 1–3", "3 weeks", "WEEK 4"
 * and return the max week count for that phase.
 */
function parsePhaseDurationWeeks(duration: string): number {
  if (!duration) return 0;
  const d = duration.toLowerCase().replace(/–/g, '-');

  // "WEEKS 3-6" or "WEEK 3" format
  const weekRangeMatch = d.match(/weeks?\s+(\d+)\s*-\s*(\d+)/);
  if (weekRangeMatch) {
    return parseInt(weekRangeMatch[2]) - parseInt(weekRangeMatch[1]) + 1;
  }
  const singleWeekMatch = d.match(/week\s+(\d+)/);
  if (singleWeekMatch) return 1;

  // "1-2 weeks" or "3 weeks" format
  const rangeMatch = d.match(/(\d+)\s*-\s*(\d+)\s*weeks?/);
  if (rangeMatch) return parseInt(rangeMatch[2]);
  
  const singleMatch = d.match(/(\d+)\s*weeks?/);
  if (singleMatch) return parseInt(singleMatch[1]);

  // "1-2 months" or "3 months"
  const monthRange = d.match(/(\d+)\s*-\s*(\d+)\s*months?/);
  if (monthRange) return parseInt(monthRange[2]) * 4;

  const monthSingle = d.match(/(\d+)\s*months?/);
  if (monthSingle) return parseInt(monthSingle[1]) * 4;

  return 0;
}

/**
 * Calculate total timeline from phases array.
 * Returns a human-readable string like "16 Weeks" or "3 Months".
 */
export function calculateTimeline(phases: any[]): string {
  if (!phases || phases.length === 0) return 'TBD';

  // New format: phases with is_ongoing and week_range
  const hasNewFormat = phases.some(p => p.week_range || p.is_ongoing !== undefined);
  if (hasNewFormat) {
    const projectPhases = phases.filter(p => !p.is_ongoing);
    const hasOngoing = phases.some(p => p.is_ongoing);
    
    if (projectPhases.length === 0 && hasOngoing) return 'Ongoing';
    
    let maxWeek = 0;
    for (const p of projectPhases) {
      if (p.week_end) maxWeek = Math.max(maxWeek, p.week_end);
    }
    
    if (maxWeek === 0) {
      // Fallback: try parsing week_range or duration
      for (const p of projectPhases) {
        const dur = p.week_range || p.duration || '';
        const m = dur.match(/(\d+)/g);
        if (m) maxWeek = Math.max(maxWeek, parseInt(m[m.length - 1]));
      }
    }
    
    if (maxWeek === 0) return hasOngoing ? 'Ongoing' : 'TBD';
    const suffix = hasOngoing ? ' + Ongoing' : '';
    if (maxWeek >= 12) return `${Math.round(maxWeek / 4)} Months${suffix}`;
    return `${maxWeek} Weeks${suffix}`;
  }

  // Legacy format: "WEEKS X-Y" absolute week ranges
  let maxWeek = 0;
  let hasAbsoluteWeeks = false;
  for (const p of phases) {
    const d = (p.duration || p.default_duration || '').toLowerCase().replace(/–/g, '-');
    const absMatch = d.match(/weeks?\s+\d+\s*-\s*(\d+)/);
    if (absMatch) {
      hasAbsoluteWeeks = true;
      maxWeek = Math.max(maxWeek, parseInt(absMatch[1]));
    }
    const singleAbs = d.match(/^week\s+(\d+)$/);
    if (singleAbs) {
      hasAbsoluteWeeks = true;
      maxWeek = Math.max(maxWeek, parseInt(singleAbs[1]));
    }
  }

  if (hasAbsoluteWeeks && maxWeek > 0) {
    return maxWeek >= 12 ? `${Math.round(maxWeek / 4)} Months` : `${maxWeek} Weeks`;
  }

  // Sum relative durations
  const totalWeeks = phases.reduce((sum, p) => {
    return sum + parsePhaseDurationWeeks(p.duration || p.default_duration || '');
  }, 0);

  if (totalWeeks === 0) return 'TBD';
  if (totalWeeks >= 12) return `${Math.round(totalWeeks / 4)} Months`;
  return `${totalWeeks} Weeks`;
}

/**
 * Build the "Objectives" stat value from goals data.
 */
export function getObjectivesStat(goals: any[] | null | undefined, clientGoal?: string | null, serviceCount?: number): string {
  if (goals && goals.length > 0) {
    if (goals.length === 1) return goals[0].label;
    return `${goals.length} Core Goals`;
  }
  if (clientGoal) return clientGoal;
  return 'Full-Service Engagement';
}

/**
 * Build KPI bar items from goals. Returns null if no KPIs should be shown.
 */
export function getKpiBarItems(goals: any[] | null | undefined): { label: string; value: string }[] | null {
  if (!goals || goals.length === 0) return null;

  // Check if any goals have specific KPI values (numbers/percentages)
  const hasSpecificKpis = goals.some(g => g.kpi && /\d/.test(g.kpi));

  const items = goals.slice(0, 3).map(g => ({
    label: g.label,
    value: hasSpecificKpis
      ? (g.kpi && /\d/.test(g.kpi) ? g.kpi : (g.kpi || 'Improve'))
      : (g.kpi || `Boost ${g.label}`),
  }));

  return items.length > 0 ? items : null;
}
