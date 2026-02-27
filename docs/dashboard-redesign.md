Redesign the dashboard page with a premium, warm aesthetic that feels like a high-end creative studio's internal tool — not a generic Shadcn template. Here are the exact changes:

## 1. FONT
Replace Inter with DM Sans across the entire app. Add this Google Font import:
```
https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap
```
Set `font-family: 'DM Sans', system-ui, sans-serif` as the base font.

## 2. COLOR SYSTEM — WARM GRAYS
Replace all cool grays with warm grays throughout the app:
- Page background: `#F8F7F5` (not white or cool gray)
- Card backgrounds: `#FFFFFF`
- Borders/dividers: `#EEEDEB` (warm, not `#E5E7EB`)
- Sidebar background: `#FAFAF8`
- Primary text: `#1A1917`
- Secondary text: `#6B6963`
- Muted text: `#A8A49E`
- Brand primary stays: `#fc956e`
- Brand dark (hover): `#e87a52`
- Brand light (tint): `#fff8f5`

## 3. STAT CARDS — Visual Weight & Better Metrics
Replace the current 4 stat cards with these, using different visual treatments:

**Card 1 — Pipeline Value (HERO CARD)**
- Background: `linear-gradient(145deg, #fc956e, #e87a52)` (coral gradient fill)
- White text, white icon background at 15% opacity
- Value: Pipeline value (sum of sent + viewed proposals)
- Sublabel: "Sent & viewed proposals"
- This is the most prominent card — the gradient makes it the visual anchor

**Card 2 — Win Rate (DARK CARD)**
- Background: `linear-gradient(145deg, #1A1917, #2A2925)` (dark fill)
- White text
- Value: Win percentage
- Trend badge: green background with up arrow if improving
- Sublabel: "Accepted / total sent"

**Card 3 — Avg Deal Size (LIGHT CARD)**
- Background: white with warm border
- Dark text
- Value: Average proposal value
- Trend badge showing change vs last month

**Card 4 — Avg Time to View (LIGHT CARD)**
- Background: white with warm border  
- Value: Average days between sending and first client view
- Trend badge (lower is better, so negative is green)

Each card should have:
- `rounded-2xl` (16px radius)
- An icon in a `w-10 h-10 rounded-xl` container top-left
- Trend badge top-right (if applicable): small pill with arrow icon + percentage
- Value in `text-[28px] font-bold` 
- Label below in `text-[13px] font-medium`
- Hover effect: `hover:-translate-y-0.5 hover:shadow-lg` transition

## 4. SIDEBAR IMPROVEMENTS

**Agency name block** below the logo:
- Add a subtle container (`rounded-lg`, background `#EEEDEB`) showing:
  - "AGENCY" label in `text-[11px] uppercase tracking-[0.08em]` muted color
  - Agency name in `text-[13px] font-semibold`

**Active nav item styling:**
- Background: `linear-gradient(135deg, #fff8f5, #FFF1EB)` (warm gradient, not flat color)
- 3px left border pill in `#fc956e` (use absolute positioning with `rounded-r-full`)
- Font weight 600, color `#e87a52`

**Proposal count badge** on the Proposals nav item:
- When active: coral background with white text
- When inactive: warm gray background with muted text

**Upgrade card at bottom:**
- Dark background: `linear-gradient(145deg, #1A1917, #2A2925)`
- Subtle coral glow: absolutely positioned circle with `opacity-10, filter: blur(20px)`
- "GO PRO" label with Zap icon in amber/gold color
- Description in white/60 opacity
- Coral CTA button: "Upgrade — $79/mo"

## 5. LAYOUT — Two Column (8/4 grid)
Change the main content area to a 12-column grid:
- Left column (8 cols): Quick Create + Recent Proposals + Quick Select Services
- Right column (4 cols): Activity Feed + This Month Performance + Contextual Tip

## 6. QUICK CREATE CARDS
Redesign the 3 Quick Create cards:
- White background with warm border
- Each card gets a DIFFERENT accent color for its icon container:
  - "New Proposal": coral gradient background on icon (`#fc956e` tones)
  - "Use a Package": blue gradient background on icon (`#3B82F6` tones)  
  - "Repeat for Client": purple gradient background on icon (`#8B5CF6` tones)
- Icon container: `w-9 h-9 rounded-xl` with subtle gradient fill
- Label in `text-[13px] font-semibold`, sublabel in `text-[11px]` muted
- Hover: `-translate-y-0.5` with shadow

## 7. RECENT PROPOSALS — Richer Rows
Each proposal row should show:
- Client initial avatar: `w-10 h-10 rounded-xl` with brand color at 15% opacity background
- Client name (bold, 14px) + reference number (mono, muted) on same line
- Proposal title below (12px, secondary color)
- Status badge: icon + text in a `rounded-lg` pill with status-specific background color
- Price: `text-[15px] font-bold` right-aligned, with pricing note below (e.g. "$35,000 + $4,500/mo" in 11px muted)
- Relative date + chevron on hover (chevron starts at opacity 0, shows on row hover)
- Row hover: subtle white/80 background

Status badge colors:
- Draft: gray icon, `#F3F2F0` bg, `#A8A49E` text
- Sent: Send icon, `#EFF6FF` bg, `#3B82F6` text
- Viewed: Eye icon, `#F5F3FF` bg, `#8B5CF6` text
- Won/Accepted: Check icon, `#F0FDF4` bg, `#22C55E` text
- Declined: X icon, `#FEF2F2` bg, `#EF4444` text

## 8. QUICK SELECT SERVICES
- Show only the top 6 most-used services (not all 12+)
- Selected state: solid `#fc956e` background, white text, checkmark prefix, `box-shadow: 0 2px 8px #fc956e30`
- Unselected: white background, warm border, secondary text color
- When 1+ services selected, show a coral CTA button next to the section header: "Create with X services →"
- Chips should be `rounded-xl px-3.5 py-2 text-[12px] font-medium`

## 9. RIGHT COLUMN — Activity Feed
Replace the "Share preview" panel with an Activity Feed:
- White card with warm border
- Each event: colored icon (7×7 rounded-lg container) + description text + timestamp
- Event types with icon colors:
  - Viewed: purple (`#8B5CF6`) background on icon
  - Sent: blue (`#3B82F6`)  
  - Created: warm gray
  - Accepted: green (`#22C55E`)

## 10. RIGHT COLUMN — "This Month" Performance Card
Add a new card below Activity showing monthly snapshot:
- 3 rows separated by warm borders:
  - "Proposals Sent": count + "X awaiting response"  
  - "Revenue Won": dollar amount + "X deals closed"
  - "Top Service": service name + "In X of Y proposals"
- Values in `text-[18px] font-bold`, labels in `text-[11px] uppercase tracking-wide` muted

## 11. RIGHT COLUMN — Contextual Tip Card
At bottom of right column, add a warm tip card:
- Background: `linear-gradient(145deg, #fff8f5, #FFF1EB)` with subtle `#fc956e` at 20% opacity border
- Zap icon + "TIP" label in brand dark color
- Short tip text, e.g.: "Agencies using bundles close **23% larger deals** on average."
- Link: "Create a bundle →" in brand color

## 12. SECTION HEADERS
All section headers (Quick Create, Recent Proposals, etc.) should use:
- `text-[13px] font-semibold uppercase tracking-[0.08em]` in muted color `#A8A49E`
- This creates a clean, editorial feel

## 13. HEADER
- Greeting: `text-[28px] font-bold tracking-tight` in primary text color
- Subtext: "Here's your proposal pipeline at a glance" (not "Here's what's happening with your proposals")
- Right side: notification bell with coral dot indicator + "New Proposal" primary button
- Bell icon: `p-2.5 rounded-xl hover:bg-white` with a small `w-2 h-2` coral dot absolutely positioned

## GENERAL NOTES
- All cards use `rounded-2xl` (16px border radius)
- All transitions: `transition-all duration-200`
- Remove any flat white-on-white appearance — every card needs either a warm border OR a filled background
- The overall feel should be warm, spacious, and premium — like a tool built by designers for designers
