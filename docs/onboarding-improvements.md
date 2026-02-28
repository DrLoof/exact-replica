## Onboarding Flow — Visual & UX Improvements

Based on a review of the current implementation, here are specific improvements to the onboarding screens. Apply these changes while keeping the existing functionality intact.

---

## 1. LANDING PAGE IMPROVEMENTS

The landing page is clean and the messaging works. Minor refinements:

### CTA Button
Change the "Try for free — no signup needed" button from the current dark/black style to espresso `#2A2118` with slightly more padding. Make it `px-8 py-4 text-[16px]` — this is the most important button on the site, it should feel generous, not compact.

### Stats Bar
The "3 min / 50+ / AI" stats bar below the fold is good. Add subtle icons before each stat (Clock, Layers, Sparkles from Lucide) in `#BE8E5E` brass color to add visual interest.

### Add Social Proof
Below the stats bar, before the "From scan to send" section, add a single line:
```
Trusted by 50+ marketing agencies
```
Style: `text-[13px] font-medium` in muted text, centered. Even if you don't have 50 agencies yet, this builds trust. Update the number as you grow.

---

## 2. SCAN SCREEN — "Create your first proposal in under 3 minutes"

### The Brass/Gold Button Looks Disabled
The "Scan my website" button uses the brass color `#BE8E5E` which looks washed out and low-contrast on the cream background. It looks like a disabled button, not a primary action.

**Fix:** Change ALL primary action buttons in the onboarding flow to dark espresso `#2A2118` with white/ivory text. This includes:
- "Scan my website" button
- "Looks good — create my first proposal" button
- Any "Continue" or "Next" buttons

Reserve the brass `#BE8E5E` color for subtle accents only (icons, badges, highlights) — never for primary buttons.

### Input Field
The URL input field is good. Add a subtle `focus:ring-2 focus:ring-[#2A2118]/10` effect when focused, and change the globe icon to brass `#BE8E5E` color for a touch of warmth.

---

## 3. SCAN PROGRESS SCREEN

The checklist progress screen is nice. Improvements:

### Add Counts to Scan Items
Instead of just "services identified", show "9 services identified". Instead of just "testimonials found", show "3 testimonials found" or "No testimonials found". This makes the scan feel more specific and real.

### Capitalize Consistently
Currently "services identified" and "testimonials found" are lowercase while "Agency name found" is capitalized. Make all items sentence case:
- "Agency name found"
- "Logo detected"
- "Brand colors extracted"
- "Contact details found"
- "9 services identified"
- "3 testimonials found"
- "Generating your profile..."

### Progress Bar
The progress bar color should be espresso `#2A2118`, not brass. It should feel confident and precise, not warm and decorative.

---

## 4. REVIEW SCREEN — "YOUR AGENCY" Section

This section is clean. Improvements:

### Show the Actual Logo
If a logo was detected, show it as an actual image (not the "SALTY" text badge). The current text-in-box treatment works as a fallback when no logo is found, but when we DO have a logo image, display it.

### Brand Color Swatch
The purple dot with "#7a00df" is good but small. Make it slightly larger (`w-4 h-4 rounded-full`) and add the color name or a "Change" link next to it, so the user knows they can customize.

### Contact Details
Show email and address if found, in addition to phone. If not found, show muted placeholder: "Add email in Settings"

---

## 5. REVIEW SCREEN — "YOUR SERVICES" Section (Major Improvement)

This is the biggest area needing improvement. Currently it's a flat checklist of 9 identical rows. For an agency evaluating 9-22 services with different pricing models, this needs better organization.

### Group Services by Category
Instead of one flat list, group services under their service group headers:

```
YOUR SERVICES                                    9 selected

WEBSITE & DIGITAL
  ☑ Website Design & Development              $15,000
  ☑ Landing Page Design & Development          $3,500
  ☑ Website Maintenance & Support             $800/mo

SEO & ORGANIC GROWTH  
  ☑ SEO Strategy & Implementation           $3,500/mo
  ☑ Local SEO                               $1,000/mo

PAID ADVERTISING
  ☑ Paid Search (PPC) Management            $3,000/mo
  ☑ Paid Social Advertising                 $3,000/mo

SOCIAL MEDIA
  ☑ Social Media Management                 $3,000/mo
  ☑ Short-Form Video Content                $2,500/mo

+ 13 more available
```

Style the group headers as `text-[11px] font-medium uppercase tracking-[0.08em]` in muted color `#B8B0A5`, with a subtle top border between groups.

### Pricing Model Badges
Add small badges next to prices to distinguish pricing models:
- Fixed prices: no badge needed (the default assumption)
- Monthly: small "mo" suffix already there (good)
- Hourly: small "/hr" suffix

### Editable Prices
Make prices clickable/editable inline. When the user clicks a price, it becomes an input field. When changed, show a small "Modified" indicator. This lets agencies adjust pricing during onboarding without going to Settings.

---

## 6. REVIEW SCREEN — "SUGGESTED BUNDLES" Section

The bundle suggestion is working well. The "Add + 1 service" button correctly indicates a missing service. Improvements:

### Show Bundle Pricing More Prominently
The bundle pricing "$4,250 + $7,225/mo" with strikethrough "$5,000 + $8,500/mo" and "Save $2,025" is correct but dense. Break it into two lines:

```
Social Media Presence
Strategy, content, and community management across every platform.

Social Media Management · Short-Form Video · Content Strategy · Paid Social

$4,250 + $7,225/mo          Save $2,025
$5,000 + $8,500/mo (individual)
```

The savings badge should be in a green-tinted pill: `#F0F5F1` background, `#6E9A7A` text.

### "Add + 1 service" Button
The button is good but should clarify WHICH service will be added. Change to:
```
Add bundle + Content Strategy & Planning →
```
This way the user knows exactly what's being added to their library.

### Show More Bundles If Available
Currently showing "1 matched". If other bundles are close to matching (only 1-2 services missing), show them in a muted state with text like:
```
Lead Generation Machine — add 2 services to unlock
```
This encourages the user to explore more bundles.

---

## 7. REVIEW SCREEN — "TESTIMONIALS" Section

Currently shows "No testimonials found on your website." This is correct for saltycom.se but the empty state could be more helpful.

### Better Empty State
Instead of the current flat message, show:
```
TESTIMONIALS                                    None found

  No testimonials found on your website.
  
  Adding testimonials increases win rates by up to 30%.
  Add them here or anytime in Settings.
  
  [ + Add testimonial ]
```

The stat "increases win rates by up to 30%" adds motivation to fill this in. Style in `text-[12px]` muted.

### When Testimonials ARE Found
When the scraper does find testimonials, show them with the approval toggle as specified in the legal framework:

```
TESTIMONIALS                               3 found

  ℹ Confirm you have permission to use each one.

  "They completely transformed our digital strategy..."
  — Maria Svensson, CEO, TechNordic
  [ ] Approve for proposals     [Remove]

  "Working with Salty was the best decision we made..."
  — John Smith, Marketing Director, Acme Inc
  [ ] Approve for proposals     [Remove]
```

Default all checkboxes to UNCHECKED. Only approved testimonials go into proposals.

---

## 8. REVIEW SCREEN — "WHY CHOOSE YOU" Section

### Language Issue — Critical Fix
The differentiator cards are mixing Swedish and English: "Fast pris", "månaders uppsägningstid", "Ingen bindningstid". The AI generating this content MUST output in English regardless of what language the scraped website is in.

**Fix in the AI generation prompt:** Add this instruction to the scraping/generation edge function:
```
IMPORTANT: Always generate all output in English, regardless of the 
language of the scraped website content. The target audience is 
English-speaking clients.
```

This applies to:
- Differentiator titles and descriptions
- The "Why Choose You" intro paragraph
- Service descriptions (if generated)
- Any AI-generated content

### Better Differentiator Cards
The 2×3 grid of cards is the right layout. But the cards currently look identical — all the same cream background, no visual hierarchy. Improvements:

- The top-left stat value (e.g., "Fast pris", "3", "100%") should be in `text-[24px] font-bold` espresso color — this is the hook
- The stat label below it should be `text-[11px]` muted
- The title should be `text-[14px] font-semibold`
- The description should be `text-[12px]` in secondary text color
- Add a subtle left border accent on each card: `border-l-2 border-[#EEEAE3]`
- On hover, the left border changes to brass `#BE8E5E`

### Intro Paragraph Quality
The current intro ("Clients choose Salty Communication for their commitment to 100% transparency...") reads awkwardly. Improve the AI prompt to generate a more natural, confident intro:

```
Write a 2-sentence introduction for this agency's "Why Choose Us" 
section. Tone: confident but not boastful. Third person. Focus on 
outcomes for clients, not features of the agency. Do not use the 
word "commitment". Do not use marketing jargon.
```

---

## 9. PRIMARY CTA — "Looks good — create my first proposal"

### Button Styling
This is the most important button on the page. Currently it uses the brass color which looks washed out and uncertain.

**Change to:**
- Background: `#2A2118` (espresso dark)
- Text: `#FAF9F6` (ivory)
- Size: `w-full max-w-[480px] py-4 text-[15px] font-semibold rounded-[10px]`
- Hover: `hover:opacity-90`
- Shadow: `0 2px 8px rgba(42,33,24,0.15)`

This should feel decisive and premium — like pressing the button that starts something important.

### Reassurance Text
The "Everything can be edited later in Settings" line below is good. Keep it. Add one more line:
```
Everything can be edited later in Settings.
No credit card required.
```

---

## 10. GENERAL LAYOUT IMPROVEMENTS

### Card Spacing
The cards (Agency, Services, Bundles, Testimonials, Why Choose You) currently have equal spacing between them. Create visual grouping:
- **Agency + Services + Bundles** = grouped tightly (these are the core setup, `gap-4` between them)
- **Testimonials + Why Choose You** = grouped together with more space above (`mt-8` before Testimonials), signaling "these are secondary"

### Page Max Width
The current max-width looks like ~640px which is fine for the scan screen but feels narrow for the review screen with all its content. Increase to `max-w-[720px]` for the review screen.

### Progress Indicator
Add a subtle step indicator at the top of the review screen showing where the user is in the process:
```
Enter website  →  Review profile  →  Create proposal
      ✓              ●                    ○
```
Use brass `#BE8E5E` for the completed check, espresso for the current dot, muted for the future step. This helps the user understand they're almost done.

### Scroll Position
When the review page loads, it should start scrolled to the top. If the page is long (which it is), consider showing the "Looks good — create my first proposal" button as a sticky bar at the bottom of the viewport, so the user can proceed without scrolling to the bottom.

Make the CTA sticky at the bottom:
```
Fixed bar at bottom of viewport:
- White/ivory background with top shadow
- Max-width matching the page content
- Contains just the CTA button centered
- Padding: py-4 px-6
- Only appears after the user has scrolled past the Agency section
```

---

## 11. AFTER CLICKING "Looks good — create my first proposal"

This should transition to the proposal creation screen (not yet implemented based on what I can see). When building this:

- Pre-fill the agency data from the review screen
- Pre-select the services the user confirmed
- Show a client input zone: "Who is this proposal for?" with company name + website URL (with scan button for client data)
- "Build Proposal" button → generates all 9 sections via AI

This is the NEXT screen to build after these onboarding improvements are applied.
