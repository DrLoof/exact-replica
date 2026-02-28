## PROPOPAD VISUAL IDENTITY REDESIGN

This prompt redesigns the dashboard AND establishes the visual identity system for the entire app. Every color, radius, shadow, and font here should be used consistently across ALL pages.

## THE IDENTITY: "The Paper Studio"

Propopad's visual metaphor is high-quality stationery. Layered cream surfaces like paper on a desk. Rich espresso ink for typography. A single warm brass accent used sparingly — like a wax seal. Cards float on subtle shadows instead of hard borders.

## FONT — Satoshi
Replace current font with Satoshi from Fontshare:
```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" rel="stylesheet">
```
Set `font-family: 'Satoshi', system-ui, sans-serif` globally. Satoshi is a humanist geometric sans — warm, professional, distinctive.

## COLOR SYSTEM — Espresso + Cream + Brass

Replace ALL current colors. This is the complete Propopad palette:

```css
/* ─── Ink (Espresso) ─── */
--ink:            #2A2118;  /* primary text, buttons, logo, headings */
--ink-soft:       #4A3F32;  /* secondary text, body */
--ink-muted:      #8A7F72;  /* tertiary text, descriptions */
--ink-faint:      #B8B0A5;  /* labels, placeholders, disabled */

/* ─── Brass (THE accent — use sparingly) ─── */
--brass:          #BE8E5E;  /* notification dots, "hot" indicators, upgrade CTA, insight highlights */
--brass-glow:     #BE8E5E20; /* subtle tint for active badge backgrounds */
/* RULE: Brass appears on max 2-3 elements per screen. It's the wax seal, not the wallpaper. */

/* ─── Surfaces ─── */
--cream:          #F5F2EC;  /* page background — the "desk" */
--ivory:          #FAF9F6;  /* sidebar background, raised panels */
--paper:          #FFFFFF;  /* card backgrounds — the "paper" */
--parchment:      #EEEAE3;  /* borders, dividers */
--parchment-soft: #F4F1EB;  /* hover backgrounds, subtle fills */

/* ─── Status (desaturated, professional) ─── */
--status-draft:   #B8B0A5;  --status-draft-bg:   #F4F1EB;
--status-sent:    #7A8FA8;  --status-sent-bg:    #F0F3F7;
--status-viewed:  #8A7BA8;  --status-viewed-bg:  #F2F0F7;
--status-won:     #6E9A7A;  --status-won-bg:     #F0F5F1;
--status-lost:    #A87A7A;  --status-lost-bg:    #F7F0F0;
```

## SPATIAL SYSTEM
```
Border radius: 12px (cards), 8px (buttons, inputs), 6px (badges, small elements)
Card shadow:   0 1px 3px rgba(42,33,24,0.05), 0 1px 2px rgba(42,33,24,0.03)
Hover shadow:  0 4px 12px rgba(42,33,24,0.07), 0 2px 4px rgba(42,33,24,0.04)
```
IMPORTANT: Cards use SHADOW for elevation, NOT borders. Paper floats — it doesn't have visible edges. Remove all `border: 1px solid` from cards and replace with the shadow values above. The only visible borders are: dividers inside cards, the sidebar right edge, and the parchment horizontal rules.

## PROPOPAD LOGO
Replace the current logo with a paper-fold "P" mark:
- A `w-[26px] h-[26px]` SVG: a document shape (rectangle with folded top-right corner) in `#2A2118` espresso
- White/ivory "P" letter inside
- Next to it: "Propopad" text in `text-[14px] font-semibold tracking-[-0.01em]` espresso

## SIDEBAR
- Background: `#FAF9F6` (ivory)
- Right border: `1px solid #EEEAE3` (parchment) — this is the ONE visible sidebar border
- Width: 236px

**Agency block:** A white card (`#FFFFFF`) with shadow (not border) inside the sidebar, `rounded-[10px] p-2.5`. Shows:
- Agency initial: `w-7 h-7 rounded-[7px]` in espresso `#2A2118` bg, ivory text
- Agency name: `text-[12px] font-semibold` in espresso
- Plan + count: "Free · 3 proposals left" in `text-[10px]` ink-faint

**Active nav item:**
- Background: `#FFFFFF` (white — pops from ivory sidebar)
- Shadow: card shadow value
- Text: `#2A2118` font-weight 600
- Count badge: `#BE8E5E20` background (brass-glow), `#BE8E5E` text (brass)

**Inactive nav items:** `#8A7F72` text, font-weight 400, no background

**Upgrade card:**
- White card with shadow, `rounded-[10px] p-4`
- A thin `2px` line at the top: `linear-gradient(90deg, #BE8E5E, transparent)` — this is the brass detail
- "Go Pro" title in brass `#BE8E5E`
- Description in ink-muted `#8A7F72`
- CTA button: espresso bg `#2A2118`, ivory text, full width

## HEADER
- Greeting: `text-[23px] font-bold tracking-[-0.03em]` in espresso
- Subtext: "3 proposals awaiting response · $87.8K in pipeline" in `text-[13px]` ink-muted
- CTA: "+ New Proposal" button in espresso bg, ivory text, `rounded-[8px]`

## METRICS — Single Paper Card with Compartments
ONE white card (`rounded-[12px]`, shadow, no border) containing 4 metric columns:
- Columns separated by `1px solid #EEEAE3` vertical borders
- Each column: `px-5 py-5`
  - Label: `text-[10px] font-medium uppercase tracking-[0.1em]` in ink-faint `#B8B0A5`
  - Value: `text-[22px] font-bold tracking-[-0.03em]` in espresso `#2A2118`
  - Sublabel: `text-[11px] font-medium` in ink-muted `#8A7F72`
- First metric (Pipeline) gets a `3px` brass bar on its left edge — `absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full` in `#BE8E5E`. This is the ONLY brass on the metrics strip.
- Metrics: Pipeline $87.8K | Won $78K | Win rate 64% | Avg deal $33K

NO colored fills. NO gradients. NO pastel backgrounds on metrics. Just clean numbers on white paper.

## PROPOSAL CARDS
Each proposal is its own white card with shadow. `space-y-2.5` between cards.

**Client monogram:** `w-11 h-11 rounded-[10px]` with cream `#F5F2EC` background.
- Large initial: `text-[15px] font-bold` in espresso
- Below initial: `text-[7px] font-medium uppercase` reference number (e.g., "SAL-0004") in ink-faint
- This combines avatar and reference into one compact element

**"Hot" indicator:** For proposals with recent client activity — a `6px` brass dot with glow shadow `0 0 6px #BE8E5E60` next to the client name. NO "Active" text badge — just the glowing dot. Brass means "pay attention."

**Content:**
- Client name: `text-[14px] font-semibold` in espresso
- Proposal title: `text-[12px]` in ink-muted
- Detail line: `text-[10px]` in ink-faint showing "X services · pricing breakdown"

**Status badge:** `px-2.5 py-1 rounded-[6px]` with status bg + status text + 5px status dot. Use the desaturated status colors from the palette above.

**Value block:** Separated by a left `1px` parchment border.
- Value: `text-[16px] font-bold tabular-nums` in espresso
- Time: `text-[10px]` in ink-faint below

**Hover:** card lifts 1px, shadow transitions to hover shadow.

## QUICK ACTIONS
Minimal text links aligned with the "Proposals" section header:
- Pattern: `PROPOSALS ———————— New   From bundle   Repeat`
- "PROPOSALS" in `text-[10px] uppercase tracking-[0.1em]` ink-faint
- Divider: `flex-1 h-px` in parchment
- Actions: `text-[11px] font-medium` in ink-muted, no background, no border

## SERVICE CHIPS
Below proposals, under "QUICK START" label:
- Unselected: white paper bg with shadow, ink-soft text, `rounded-[7px]`
- Selected: espresso bg, ivory text, font-weight 600
- CTA when 1+ selected: "Create proposal (X) →" in espresso bg, ivory text

## RIGHT COLUMN

### Activity Card
White paper card with shadow. Status dots are 5px, colored per status palette. Text in ink-soft.

### Performance Card
White paper card with shadow. Each service: name in ink-soft, win rate % in ink-muted. Progress bars: `3px` tall, parchment background, espresso fill at varying opacity (top service = darkest at ~35%, others lighter). This is monochrome — no colored bars.

### Insight Card — THE ONE DARK ELEMENT
Background: `#2A2118` (espresso)
A `2px` line at top: `linear-gradient(90deg, #BE8E5E, transparent)` — brass detail, matching the upgrade card and pipeline metric.
- "INSIGHT" label in ink-faint
- Body text in `#B8B0A5` with key words highlighted:
  - Service name in ivory `#FAF9F6` font-semibold
  - Win rate in brass `#BE8E5E` font-semibold
- CTA link in brass

This is the only dark surface on the dashboard. It draws the eye because everything else is cream/white. The brass highlights inside it are the payoff of the whole color system.

## GLOBAL IDENTITY RULES — Apply to ALL pages, not just dashboard

1. **No accent color on surfaces.** Buttons are espresso dark. Links are underlined text. Selected states are espresso bg or brass-glow bg. Never fill a card or section with a "brand color."

2. **Brass is rare.** Count the brass elements: pipeline bar, proposal count badge, hot dot, upgrade card line, insight card line + highlights. That's it. If brass appears on more than ~5 elements per screen, it's overused.

3. **Shadow, not borders.** Cards float on shadow. The only visible borders are: inside card dividers, sidebar edge, section divider lines.

4. **Cream breathes.** The page background `#F5F2EC` should be visible between cards. Don't pack cards edge-to-edge. Let the cream desk show through.

5. **Typography carries the hierarchy.** With only one real color (espresso), the hierarchy comes from: size, weight, opacity (faint → muted → soft → full). This is how high-end print design works.

6. **Status colors are desaturated.** Not bright blue/green/red. Muted: dusty blue, dusty purple, sage green, dusty rose. They should feel like they belong in the same room as the cream and espresso.
