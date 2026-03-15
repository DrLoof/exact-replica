Fix the Executive Summary section's stat bars across all 4 proposal templates. Currently the stats show generic placeholder data ("4 phases", "3 services") instead of meaningful proposal metrics and KPIs. Here are the exact changes:

## THE TWO STAT BARS

The Executive Summary should have TWO stat bars below the narrative text:

### Bar 1 — Light stat bar (proposal overview)
Shows 3 key proposal facts. Always visible on every proposal.

| Stat | Label | Value | Source |
|------|-------|-------|--------|
| 1 | TIMELINE | e.g. "16 Weeks" or "12 Weeks" | Calculated from the proposal's timeline phases — sum of all phase durations. If no timeline is set, show "TBD" |
| 2 | INVESTMENT | e.g. "$148,500" or "$13,000 + $2,500/mo" | From the proposal's pricing totals. Show mixed pricing format when both fixed and monthly exist. Use the agency's currency. The investment value should use the brand/accent color. |
| 3 | OBJECTIVES | e.g. "3 Core Goals" or "Brand Growth" | If the user selected goals when creating the proposal, show the count (e.g. "3 Core Goals"). If no goals were selected, show the primary service category or "Full-Service Engagement" as a fallback. |

**Styling per template:**

- **Classic:** White/light gray background card with thin 1px border. Labels in `text-[11px] uppercase tracking-wide` muted gray. Values in `text-[22px] font-bold` dark text. Investment value in blue `#2563EB` (the Classic accent). Three columns separated by subtle vertical dividers.

- **Elegant:** Very light purple/lavender tinted background (`#F3F0FF`). Labels in `text-[11px] uppercase tracking-wide` muted purple. Values in `text-[22px] font-bold` dark. Investment in purple `#7C3AED`. Rounded corners `rounded-2xl`.

- **Soft:** Warm cream background matching the template (`#FAF8F5`). Labels in `text-[11px] uppercase tracking-wide` warm muted. Values in `text-[22px] font-bold` espresso dark. Investment in the brand accent color (coral/pink). Rounded corners `rounded-2xl`.

- **Modern:** White background with dashed border (matching Modern template's signature dashed style). Labels in `text-[11px] uppercase tracking-wide`. Values in `text-[22px] font-bold`. Investment in the brand accent color (blue). Rounded corners `rounded-xl`.

### Bar 2 — Dark stat bar (KPI targets)
Shows projected outcomes. This bar is CONDITIONAL — it only appears when the proposal has goals/KPIs attached.

**Three scenarios for this bar:**

**Scenario A — Goals selected WITH specific KPIs:**
When the user selected goals during proposal creation AND the AI generated specific KPI targets, show them directly:

```
BRAND AWARENESS          LEAD GENERATION          ENGAGEMENT RATE
+40%                     3x Growth                2.5x Lift
```

Each KPI shows: label in `text-[11px] uppercase tracking-wide` white/60 opacity, value in `text-[24px] font-bold` white.

**Scenario B — Goals selected WITHOUT specific KPIs:**
When the user selected goals but no measurable KPIs were generated, convert the goals into aspirational labels:

```
BRAND AWARENESS          LEAD GENERATION          ENGAGEMENT
Increase Visibility      Drive Qualified Leads    Boost Engagement
```

Labels same styling. Values in `text-[20px] font-semibold` white — slightly smaller since they're text not numbers.

**Scenario C — No goals selected:**
Do NOT show the dark bar at all. Only show Bar 1 (the light stat bar). The Executive Summary section works fine without KPI targets — not every proposal needs projected outcomes.

**Dark bar styling per template:**

- **Classic:** Pure black background `#0A0A0A`. White text. Sharp corners or very slight `rounded-lg`.

- **Elegant:** Dark navy/purple background `#1E1B3A`. White text. Labels in white/50 opacity. `rounded-2xl`.

- **Soft:** Dark espresso background `#2A2520`. White text. Labels in white/50 opacity. `rounded-2xl`.

- **Modern:** Dark navy background `#1A1A3E`. White text with the blue accent on values. Dashed top border matching template style. `rounded-xl`.

## FIXING THE CURRENT IMPLEMENTATION

The current implementation has these specific problems to fix:

1. **"3 services" is NOT a goal.** The third stat currently shows the count of selected services. This is meaningless to the client. Replace with the actual objective/goal as described above.

2. **"4 phases" is NOT a timeline.** The timeline stat currently shows the number of phases. The client wants to know HOW LONG the project takes, not how many phases it has. Calculate the total duration from the phases (sum the weeks) and display as "X Weeks" or "X Months".

3. **The dark KPI bar is completely missing.** Add it below the light stat bar, with the conditional logic described above.

4. **Investment formatting needs the accent color.** Currently the investment value uses the same dark text as everything else. It should use the template's accent/brand color to make it stand out — this is the number the client's eye should go to first.

## WHERE GOALS COME FROM

Goals are set during proposal creation. If the proposal creation flow doesn't currently have a goal selection step, add a simple optional field:

In the proposal creation page, after selecting services, add an optional "Goals" section:
- Label: "What are the goals for this project?" (optional)
- Multi-select chips or checkboxes from common goals: Brand Awareness, Lead Generation, Revenue Growth, Customer Engagement, Market Expansion, Online Presence, Conversion Optimization
- Or a free-text field: "Add custom goal"
- Selected goals are stored on the proposal record
- The AI uses these goals when generating the Executive Summary narrative AND the KPI bar values

If no goals are selected, the AI skips KPI generation and the dark bar doesn't appear. Simple and clean.

## IMPORTANT

- The light stat bar (Bar 1) ALWAYS appears on every proposal
- The dark KPI bar (Bar 2) only appears when goals exist
- Both bars should be responsive — stack vertically on narrow screens
- In PDF export, both bars render exactly as they appear in the editor
- The investment value always uses the template's accent/brand color for emphasis
- Timeline is calculated as total weeks from phases, not phase count
