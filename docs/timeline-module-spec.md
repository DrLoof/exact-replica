# Timeline Module — Proposal Section 03

## Problem

The Timeline section currently renders the stat bar (Start Date, Duration, Revisions) but the actual project phases are not displaying below it. The section should show a vertical timeline with numbered phases, week ranges, and AI-generated descriptions — matching the Figma design.

---

## Reference Design (Figma page 4)

The timeline section has two parts:

**Part A — Blue stat bar (already working)**
A full-width blue (`#4880FF`) rounded card with three columns:
- PROJECT START → "March 3, 2026"
- TOTAL DURATION → "16 Weeks"  
- PROJECTED LAUNCH → "June 22, 2026"

**Part B — Vertical phase timeline (NOT rendering — needs to be built)**
Below the stat bar, a vertical timeline showing 5 project phases. Each phase has:
- A dark rounded square (`#1E1E2E`) with the phase number in white (01, 02, 03, 04, 05)
- A vertical connecting line between each numbered square
- Phase name in bold (e.g., "Discovery & Research")
- A blue-outlined pill showing the week range (e.g., "WEEKS 1–2")
- A 2-3 sentence description paragraph below the phase name

---

## What to Build

### 1. Timeline Phase Data Generation

When the proposal is generated (after clicking "Build Proposal"), the system should auto-generate timeline phases based on the selected services.

**Default 5 phases** (use these as fallback if no custom phases exist in the database):

| Phase | Name | Default Weeks | Purpose |
|-------|------|---------------|---------|
| 01 | Discovery & Research | Weeks 1–2 | Audits, stakeholder interviews, competitive analysis |
| 02 | Strategy & Architecture | Weeks 3–4 | Positioning, frameworks, blueprints |
| 03 | Creative Development | Weeks 5–9 | Design, content creation, iterative review |
| 04 | Build & Produce | Weeks 10–13 | Development, production, QA testing |
| 05 | Launch & Optimize | Weeks 14–16 | Go-live, monitoring, performance tuning |

**Week range auto-calculation:**
- Get total duration from the proposal (sum of selected service durations, or the manually set duration)
- Distribute across 5 phases proportionally:
  - Discovery: ~12% of total
  - Strategy: ~12% of total
  - Creative: ~31% of total
  - Build: ~25% of total
  - Launch: ~20% of total
- Round to whole weeks
- Make sure week ranges don't overlap and cover the full duration

**AI-generated phase descriptions:**

For each phase, send the following to AI:

```
Generate a 2-3 sentence description for this project phase.

Phase: {phase_name}
Week range: {week_range}
Selected services: {list of selected service names}
Client name: {client_company_name}

Rules:
- Write in first person plural ("we" / "our")
- Reference the specific services that happen in this phase
- Professional but approachable tone
- Do not use generic filler — be specific to the services selected
- Always respond in English regardless of input language

Example for Discovery phase with SEO + Brand Identity selected:
"Deep-dive into your brand, market, competitors, and audience. Stakeholder interviews, analytics audit, and competitive benchmarking to build a strategic foundation."
```

**Phase-to-service mapping logic:**
- Discovery & Research: All services contribute (audits, research, interviews)
- Strategy & Architecture: Brand Messaging, Content Strategy, Marketing Strategy, SEO Strategy
- Creative Development: Brand Identity, Website Design, Content/Copywriting, Social Media, Ad Creative
- Build & Produce: Website Development, Email Marketing setup, Automation setup, Campaign build
- Launch & Optimize: All services (coordinated launch, monitoring, optimization)

If a service doesn't clearly map to a phase, include it in Creative Development or Build & Produce.

### 2. Timeline Phase UI Component

Build a `ProposalTimelinePhases` component that renders below the existing stat bar.

**Visual structure for each phase:**

```
[dark square with "01"]──── Phase Name (bold)   [WEEKS 1-2] (blue pill)
       │
       │                    Description paragraph in muted text.
       │                    Second sentence about specific services.
       │
[dark square with "02"]──── Phase Name (bold)   [WEEKS 3-4] (blue pill)
       │
       ...etc
```

**Styling specs:**

Phase number circle:
- Dark background `#1E1E2E` (matches Figma)
- Rounded corners (rounded-xl)
- White text, bold
- Size: 48x48px
- Numbers formatted as "01", "02", etc.

Connecting line:
- Vertical line from bottom of one circle to top of next
- Color: `#E5E7EB` (light gray)
- Width: 2px
- Positioned left-center of the number circles

Phase name:
- Bold, dark text (`#1E1E2E`)
- Font size: 18px / text-lg
- Displayed inline/adjacent to the number circle

Week range pill:
- Border: 1px solid `#4880FF`
- Text: `#4880FF` (blue)
- Background: transparent or very light blue
- Font: uppercase, small, bold tracking
- Rounded-full
- Displayed next to phase name

Description:
- Regular weight, muted color (`#6B7280`)
- Font size: 14px-15px / text-sm
- Max width: ~600px (don't stretch full width)
- 2-3 sentences
- Displayed below the phase name, indented to align with the text (not the circle)

### 3. Stat Bar Improvements

Update the existing blue stat bar to include the third column:

| Column | Label | Value | Source |
|--------|-------|-------|--------|
| PROJECT START | Start date | Proposal start_date field (default: next Monday from today) |
| TOTAL DURATION | Weeks | Sum of service durations or manual override |
| PROJECTED LAUNCH | End date | Start date + total duration weeks |

The projected launch date should auto-calculate from start date + duration.

### 4. Database Schema

Check if `timeline_phases` table exists. If not, create it:

```sql
create table timeline_phases (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade,
  phase_number integer not null,
  phase_name text not null,
  week_start integer not null,
  week_end integer not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

Also add to the `proposals` table if not present:
- `start_date` (date, default: next Monday)
- `total_duration_weeks` (integer, calculated from services)
- `projected_launch_date` (date, calculated)

### 5. Editable Behavior (in proposal editor)

After the timeline is generated, the user should be able to:
- **Edit phase names** — click to edit inline
- **Adjust week ranges** — click the pill to edit start/end weeks
- **Edit descriptions** — click to edit the description text
- **Add/remove phases** — "+" button after last phase to add, "×" on hover to remove
- **Reorder phases** — drag handle on the left of each phase

When a service is added or removed from the proposal in the editor, show a subtle prompt: "Timeline may need updating — Regenerate phases?" with a button to re-run the AI generation.

### 6. Empty State

If no timeline phases have been generated yet (e.g., generation failed), show:

```
[Timeline icon]
No timeline generated yet
Click "Generate Timeline" to create project phases based on your selected services.

[Generate Timeline] button (espresso dark #2A2118)
```

---

## Integration Points

- This component sits inside the proposal template, between the Scope of Services section (02) and the Investment section (04)
- It reads from the `timeline_phases` table for this proposal
- On "Build Proposal", the system should auto-generate phases and save them to the database
- The stat bar values (start date, duration, launch date) come from the `proposals` table
- Phase descriptions should be regenerated if services change significantly

---

## Priority

This is a high-visibility section — clients want to see when things happen. The timeline is the third thing they look at after pricing and scope. Ship the basic rendering first (stat bar + static phases with default descriptions), then add AI generation and inline editing.
