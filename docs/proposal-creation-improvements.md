## Proposal Creation Screen — Improvements

The proposal creation page (final onboarding step + `/proposals/new`) has the right structure but needs these specific fixes.

---

## 1. CLIENT CONTEXT BOX — Fix Raw Scrape Output

The context/summary box below the client URL currently shows raw scraped content like:
```
Get maximum value from your IT investments with Northern Europe's leading 
provider of IT infrastructure solutions.
Services detected: Website & Digital, Analytics & Data, Marketing Strategy, 
Cloud and IT infrastructure, AI and data...
```

This looks like debug output. The client context should be an AI-generated summary, not raw scrape data.

**Fix:** When the user enters a client URL and the auto-fill runs, send the scraped content through AI summarization before displaying it. Use this prompt in the edge function:

```
You are summarizing a company's publicly available website for use as 
context in a business proposal.

Write a 2-3 sentence business summary of this company. Focus on: what the 
company does, who they serve, and their market position. Write in third 
person, professional tone. Write entirely in your own words — do not copy 
any sentences verbatim from the source. Do NOT include lists of services 
detected, do NOT include raw data dumps.

Always write in English regardless of the source language.

Website content:
[scraped text]

Return ONLY the summary, nothing else.
```

The displayed context should look like:
```
ATEA is Northern Europe's leading IT infrastructure provider, serving 
enterprises across the Nordics and Baltics. They specialize in cloud 
solutions, IT security, and digital transformation for mid-to-large 
organizations.
```

Store this summary in the client record as `about_summary`. This summary is then used by the AI when generating the proposal's executive summary.

**Also:** The "Hide context" / "Show context" toggle is good — keep it. But rename it to "Client context" or "About this client" for clarity.

---

## 2. "BUILD PROPOSAL" BUTTON — Fix Color

The "Build Proposal" button in the sticky footer uses the brass/gold color `#BE8E5E`. This is the third screen where the primary CTA looks washed out and passive.

**Fix:** Change to espresso dark `#2A2118` with ivory text `#FAF9F6`. Same treatment as all other primary action buttons:

```css
background: #2A2118;
color: #FAF9F6;
padding: 12px 28px;
border-radius: 10px;
font-weight: 600;
font-size: 14px;
```

Hover state: `opacity: 0.9` or `background: #3A3128`.

The sparkle icon (✦) before "Build Proposal" is a nice touch — keep it, but make it ivory to match the text.

**Apply this rule globally:** The brass color `#BE8E5E` should NEVER be used as a button background anywhere in the app. It's reserved for small accents: icon highlights, badge borders, decorative elements. All primary action buttons are espresso dark. All secondary/ghost buttons are white with espresso border.

---

## 3. SERVICE SELECTION — Default State

Currently all 12 services come pre-selected when creating a proposal. This is the wrong default.

**Fix for proposal creation (not onboarding):**
- When coming from the onboarding "Looks good — create my first proposal" flow: Pre-select a sensible subset (e.g., the services most relevant to the detected client industry), OR pre-select none and let the user choose.
- When creating a new proposal from `/proposals/new` (after onboarding): Start with NO services selected. The user picks what's relevant for this specific client.
- When creating from a bundle shortcut: Pre-select only the bundle's services.
- When duplicating a proposal: Pre-select the same services as the original.

**Recommendation:** Default to nothing selected. The user should actively choose what to propose. Pre-selecting everything means the user has to review and deselect 12 items, which is more cognitive work than selecting 4-6 items.

---

## 4. ADD BUNDLE SELECTION ABOVE INDIVIDUAL SERVICES

The proposal creation screen currently only shows individual services grouped by category. Add a bundle selection option above the individual services.

**Layout for "What are you proposing?":**

```
What are you proposing?

┌─ BUNDLES ──────────────────────────────────────────────┐
│                                                         │
│  [Social Media Presence]  [Brand Launch]  [Digital      │
│   4 services               4 services     Growth]       │
│   kr4,250 + kr7,225/mo     kr26,350       4 services    │
│   Save kr2,025             Save kr4,650   kr7,225 +     │
│                                           kr4,250/mo    │
│                                                         │
│  Show only bundles that match agency's active services  │
└─────────────────────────────────────────────────────────┘

SELECT SERVICES                                12 available

  Brand & Creative                                    ▸ 3
  Website & Digital                                   ▸ 3
  SEO & Organic Growth                                ▸ 2
  Social Media                                        ▸ 2
  Paid Advertising                                    ▸ 2
```

**Bundle card interaction:**
- Click a bundle card to select it → its services auto-check in the individual list below
- Bundle card shows: name, service count, bundle price, savings badge
- Selected state: espresso border, subtle cream tint background, check icon
- Only show bundles where ALL services exist in the agency's library
- If a bundle is selected AND the user also manually selects additional services, those become add-ons. The running total shows: bundle price + add-on prices

**When a bundle is selected, update the sticky footer:**
```
Social Media Presence + 2 add-ons for ATEA
kr4,250 + kr7,225/mo + kr18,500         [✦ Build Proposal]
```

---

## 5. RUNNING TOTAL IN STICKY FOOTER — Improve

The current sticky footer shows:
```
12 services for ATEA
kr31,500 + kr19,300/mo                    [Build Proposal]
```

This is functional but could be more informative. Improve to:

**When individual services selected (no bundle):**
```
5 services for ATEA                       
kr31,500 + kr4,500/mo                     [✦ Build Proposal]
```

**When a bundle is selected:**
```
Brand Launch bundle + 2 add-ons for ATEA  
kr30,600 + kr4,500/mo  Save kr4,650      [✦ Build Proposal]
```

The savings amount should appear in a green-tinted pill when a bundle is involved.

**When nothing is selected:**
```
Select services to build a proposal       [Build Proposal] (disabled)
```

The button should be disabled (opacity 40%, no pointer) when no services are selected AND no client name is entered. Enable when both exist.

---

## 6. CLIENT ZONE — Small Improvements

### Auto-Fill Button
The "Auto-fill" button next to the URL field is good. Add the consent/disclosure line below:
```
We'll read publicly available information from this website.
```
Style: `text-[11px]` muted, below the URL input. Same as the agency scan consent.

### Contact Name Field
The "Contact Name" placeholder field is correct. If the auto-fill finds a contact on the client's website, suggest it but don't auto-fill it — the agency knows their contact person better than the scraper does. Instead, show it as a suggestion below the field:
```
Contact Name: [________________]
  Suggested: "Erik Johansson, CTO" from website  [Use this]
```

### Client Industry
Add a small industry dropdown or auto-detected badge near the client name:
```
ATEA                              Industry: Technology ▾
```
This is used by the AI to generate a better executive summary. If auto-detected from the website, pre-fill it. If not, leave it as a dropdown.

---

## 7. TIMELINE ZONE — Enhance

The "When does this start?" section with the date picker is minimal. After "Build Proposal" is clicked and the AI generates the proposal, the timeline should include auto-generated phases. But during the creation step, keep it simple:

**Current (good):** Date picker showing "Mar 1, 2026" — keep this.

**Add:** A small expandable section below the date:
```
When does this start?                     Mar 1, 2026 ▾

  Estimated duration: ~12 weeks
  Discovery → Strategy → Build → Launch
  
  [Customize phases ▾]  (collapsed by default)
```

The "Estimated duration" auto-calculates based on the selected services (each service module has a `default_timeline` field in the seed data). The phase names use the agency's default timeline phases.

Only show the estimated duration AFTER services are selected. Before that, show nothing.

---

## 8. WHAT HAPPENS AFTER "BUILD PROPOSAL"

When the user clicks "Build Proposal", the following should happen:

### Generation Screen
Show a full-page generation animation (similar to the scan progress screen):

```
✦ Building your proposal for ATEA...

  ☑ Executive summary written
  ☑ Scope of services structured  
  ☑ Timeline generated
  ☑ Investment calculated
  ☐ Formatting and polishing...

  ████████████████████░░░ 85%
```

Duration: 3-8 seconds depending on AI generation time.

### Transition to Editor
After generation completes, transition to the proposal editor showing the full 9-section proposal. The user can now review, edit inline, and share.

The editor is a separate screen/route: `/proposals/:id/edit` — this is the next major feature to build after the creation flow is solid.

---

## 9. VISUAL CONSISTENCY NOTES

### Card Styling
All cards on the proposal creation page should use:
- Background: `#FFFFFF`
- Border: `1px solid #EEEAE3` (parchment)
- Border radius: `12px`
- Shadow: `0 1px 3px rgba(42,33,24,0.04)`
- Padding: `24px`

### Category Headers in Service List
The category headers ("Brand & Creative", "Website & Digital", etc.) should use:
- Font: `text-[14px] font-semibold` in `#2A2118`
- Count badge: `text-[11px] font-medium` in a `rounded-full px-2 py-0.5` badge, background `#F0F5F1`, text `#6E9A7A`
- Collapse/expand chevron: `w-4 h-4` in muted color
- Bottom border on the header row: `border-b border-[#EEEAE3]`

### Service Rows
Each service row should have:
- Checkbox: brass `#BE8E5E` when checked (this is one of the rare appropriate uses of brass — small interactive indicators)
- Service name: `text-[14px]` in `#2A2118`
- Optional description: `text-[12px]` in `#8A7F72` (only show for services that have a short_description, like "Meta, LinkedIn, and TikTok ad campaigns")
- Pricing model badge: `text-[10px] font-medium uppercase` in a `rounded px-1.5 py-0.5` badge
  - FIXED: background `#F5F2EC`, text `#8A7F72`
  - MONTHLY: background `#F0F5F1`, text `#6E9A7A`
  - HOURLY: background `#FFF8F5`, text `#BE8E5E`
- Price: `text-[14px] font-semibold` in `#2A2118`, right-aligned
