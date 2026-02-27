# PROPOPAD — Alternative Onboarding
# From 7 steps to 2 + first proposal

## The Principle

The user should see a complete, generated proposal within 3 minutes of entering their website URL. Everything that can be scraped is scraped. Everything that can be defaulted is defaulted. The user's job is to confirm, not to create.

---

## What the Website Scrape Extracts

When the user enters their URL, we scrape their entire site (homepage + about + services + testimonials pages) and extract:

```
AGENCY IDENTITY
├── Agency name              ← from <title>, og:site_name, or domain
├── Logo URL                 ← from og:image, favicon, or detected img near site name
├── Brand colors             ← from CSS variables, meta theme-color, logo dominant colors
├── Email                    ← from mailto: links
├── Phone                    ← from tel: links
├── Address                  ← from structured data or footer
└── Tagline / description    ← from meta description or hero text

SERVICES
├── Service keywords         ← from page content ("SEO", "branding", "web design", etc.)
├── Service pages            ← from nav links and /services/* URLs
└── Service descriptions     ← from service page content

ABOUT / WHY US
├── About paragraph          ← from /about page or homepage "about" section
├── Mission / values         ← from about page
├── Team size                ← from team page or "about us" mentions
├── Years in business        ← from "since 20XX" or "X years" mentions
├── Client count             ← from "50+ clients" or similar mentions
├── Process / methodology    ← from "how we work" or "our process" sections
└── Awards / certifications  ← from badges, award mentions

TESTIMONIALS
├── Client quotes            ← from testimonial sections, carousels, or review blocks
├── Client names             ← from attribution text near quotes
├── Client titles            ← from attribution text
├── Client companies         ← from attribution text
├── Metrics / results        ← from case study pages or stat callouts near testimonials
└── Client logos             ← from logo grids or "trusted by" sections

CASE STUDIES / RESULTS (bonus)
├── Project names            ← from case study pages
├── Metrics achieved         ← from stat blocks ("+156% traffic", "3x revenue")
└── Industries served        ← from case study tags or client descriptions
```

### Scraping Implementation

The edge function should:
1. Fetch the homepage
2. Parse all internal links from navigation
3. Fetch key pages: /about, /services, /work, /testimonials, /clients, /contact (and variants)
4. Use structured extraction (looking for common HTML patterns: blockquote for testimonials, .testimonial class, schema.org Review markup)
5. Send all extracted text to Claude for structured parsing:

```
System prompt for scrape parsing:

You are parsing a marketing agency's website content. Extract structured data.

Return JSON:
{
  "agency": {
    "name": "...",
    "tagline": "...",
    "about_paragraph": "...",
    "years_in_business": null or number,
    "team_size": null or "5-10" or "20+",
    "client_count": null or "50+" etc
  },
  "services_detected": [
    "SEO", "Brand Identity", "Web Design", ...
  ],
  "testimonials": [
    {
      "quote": "...",
      "client_name": "...",
      "client_title": "...",
      "client_company": "...",
      "metric_value": "+156%",
      "metric_label": "Organic Traffic"
    }
  ],
  "differentiators": [
    {
      "title": "...",
      "description": "...",
      "stat_value": "...",
      "stat_label": "..."
    }
  ],
  "process_steps": [
    {"name": "Discovery", "description": "..."},
    ...
  ],
  "case_study_metrics": [
    {"metric": "+156%", "label": "Organic Traffic", "client": "Acme Corp"}
  ]
}
```

---

## The New Onboarding Flow

### Screen 1: "Enter your website"

**One input. One button. That's it.**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    [P] Propopad                      │
│                                                     │
│           Create your first proposal                │
│           in under 3 minutes                        │
│                                                     │
│    ┌────────────────────────────────────────────┐   │
│    │  https://saltycomm.com                     │   │
│    └────────────────────────────────────────────┘   │
│                                                     │
│              [ Scan my website ]                     │
│                                                     │
│         No website? Set up manually →               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**After clicking "Scan my website":**

The screen transitions to a progress view. This is the "magic moment" — the user watches as their agency is assembled in real time:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│        Scanning saltycomm.com...                    │
│                                                     │
│        ✓  Agency name found                         │
│        ✓  Logo detected                             │
│        ✓  Brand colors extracted                    │
│        ✓  Contact details found                     │
│        ✓  8 services identified                     │
│        ✓  3 testimonials found                      │
│        ●  Generating your profile...                │
│                                                     │
│        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  87%       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Each line appears one at a time with a staggered animation (200ms between each). Checkmarks are green. The progress bar fills smoothly. This takes 5-10 seconds total (scraping + AI parsing in parallel).

**What happens behind the scenes:**
1. Edge function scrapes the website (2-4 seconds)
2. Claude parses the scraped content into structured data (2-3 seconds)
3. Matching service modules are pre-selected from the 22-module library
4. Testimonials are formatted and stored
5. AI generates "Why Us" differentiator cards from about text + scraped data
6. AI generates "Why Us" intro paragraph
7. Default terms, payment templates, timeline phases are loaded
8. Everything is saved to the agency record

---

### Screen 2: "Review your profile"

Everything the scrape found is displayed in a single, scrollable page. The user reviews, edits what's wrong, and confirms. This replaces Steps 1 through 6 of the old onboarding.

**Layout:** Single column, max-width 680px, centered. Clean and focused.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  YOUR AGENCY                                              Edit   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Logo]  Salty Communication                             │   │
│  │  ●━━━━━━━━━━ #E8825C (brand color)                      │   │
│  │  hello@saltycomm.com · +46 70 123 4567                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  YOUR SERVICES                                    12 found       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ✓ Brand Identity System         $12,000                 │   │
│  │  ✓ Brand Messaging & Voice        $5,000                 │   │
│  │  ✓ Website Design & Development  $25,000                 │   │
│  │  ✓ SEO Strategy                   $2,500/mo              │   │
│  │  ✓ Content Strategy               $5,000                 │   │
│  │  ✓ Social Media Management        $3,500/mo              │   │
│  │  ○ Paid Search (PPC)              $2,000/mo              │   │
│  │  ○ Email Marketing                $1,500/mo              │   │
│  │  · · ·  + 4 more available                               │   │
│  │                                                           │   │
│  │  Each service has full deliverables, timelines, and       │   │
│  │  scope pre-filled. You can customize in Settings later.   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TESTIMONIALS                              3 found from website  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  "Salty transformed our brand from forgettable to         │   │
│  │   unforgettable. Traffic up 200% in 6 months."           │   │
│  │   — Sarah Chen, CEO, Meridian Technologies               │   │
│  │     +200% Organic Traffic                                │   │
│  │                                                           │   │
│  │  "Best agency we've worked with. They actually            │   │
│  │   understand our business, not just marketing."           │   │
│  │   — Marcus Webb, CMO, Apex Dynamics                       │   │
│  │                                                           │   │
│  │  "Professional, fast, and the results speak               │   │
│  │   for themselves."                                        │   │
│  │   — Lisa Park, Founder, Helix Studios                     │   │
│  │     3x Lead Volume                                       │   │
│  │                                                           │   │
│  │  + Add testimonial                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  WHY CHOOSE YOU                        Generated from your site  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  "Salty Communication combines strategic thinking with     │   │
│  │   hands-on execution across brand, web, and growth..."    │   │
│  │                                                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │   │
│  │  │ 87%      │ │ 50+      │ │ 8        │                │   │
│  │  │ Retention│ │ Clients  │ │ Years    │                │   │
│  │  │ Strategy │ │ Proven   │ │ Deep     │                │   │
│  │  │ First    │ │ Results  │ │ Expertise│                │   │
│  │  └──────────┘ └──────────┘ └──────────┘                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │   │
│  │  │ Weekly   │ │ 1        │ │ End-to-  │                │   │
│  │  │ Updates  │ │ Contact  │ │ End      │                │   │
│  │  │ Full     │ │ Dedicated│ │ Complete │                │   │
│  │  │ Reporting│ │ Team     │ │ Delivery │                │   │
│  │  └──────────┘ └──────────┘ └──────────┘                │   │
│  │                                                           │   │
│  │  These appear in your proposals. Edit anytime in Settings.│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│              [ Looks good — create my first proposal ]           │
│                                                                  │
│              Everything can be edited later in Settings           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key UX behaviors:**

**Services section:**
- Services are shown as a compact checklist (not large cards)
- Pre-checked services are the ones matching keywords found on the website
- Unchecked services are still available (shown dimmed)
- Each service shows name + default price
- Prices are editable inline (click to change)
- A small note: "Each service has full deliverables, timelines, and scope pre-filled"
- The user does NOT need to review deliverables, client responsibilities, etc. Those are pre-loaded from seed data and will appear automatically in proposals

**Testimonials section:**
- Show scraped testimonials as quote cards
- Each is editable (click to change text, name, company, metric)
- "Remove" icon on each
- "+ Add testimonial" for manual addition
- If no testimonials found: "No testimonials found on your website. Add them here or skip for now."
- AI can enhance raw testimonials (fix formatting, extract metrics from adjacent text)

**Why Choose You section:**
- Intro paragraph: generated by AI from scraped about text. Editable.
- 6 differentiator cards: generated from scraped content. Where the scrape found specific stats ("50+ clients", "8 years"), those are used. Where not, AI generates plausible defaults based on the agency's service mix.
- Each card is editable (click to change title, stat, description)
- Compact 3×2 grid preview

**Edit patterns:**
- Clicking "Edit" next to any section header expands it into an inline editor
- Changes save automatically (no explicit save button)
- Errors are non-blocking — the user can always proceed

**What is NOT on this screen:**
- Payment terms (defaults to Equal Thirds)
- Validity period (defaults to 30 days)
- Revision rounds (defaults to 2)
- Notice period (defaults to 30 days)
- Terms & conditions (8 default clauses pre-loaded)
- Currency (auto-detected from website TLD or browser locale)
- Proposal reference prefix (auto-generated from agency name)
- Hourly rate (not needed for first proposal)

All of these have sensible defaults and are accessible in Settings from day one. None of them are required to generate a good first proposal.

---

### Screen 3: "Create your first proposal"

This is the single-page creation flow (from the addendum). The user fills in:

**Zone 1: Client** — "Who is this for?"
- Company name (required)
- Contact name (optional)
- Industry dropdown (optional — helps AI generate better summary)
- "Tell us about the project" textarea (optional — the more context, the better the AI summary)

**Zone 2: Services** — "What are you proposing?"
- The services they selected in Screen 2 are shown
- Quick toggle on/off
- Bundles auto-suggested if 3+ complementary services selected
- Inline price editing

**Zone 3: Build**
- "Generate Proposal" button
- Clicking it:
  1. Creates the proposal record
  2. Fires AI generation (title, summary, timeline, stats) — 3-5 seconds
  3. Transitions to the proposal editor with all 9 sections populated

**What populates each proposal section:**

| Section | Data Source | Auto-populated? |
|---------|-----------|----------------|
| Cover | agency name, logo, color, client name | ✓ Fully |
| Executive Summary | AI from: client industry, notes, services | ✓ Fully |
| Scope of Services | selected service modules (seed data) | ✓ Fully |
| Timeline | default phases + AI descriptions | ✓ Fully |
| Investment | service prices, default payment terms | ✓ Fully |
| Terms & Conditions | 8 default clauses | ✓ Fully |
| Why Us | scraped/AI intro + 6 differentiators | ✓ Fully |
| Testimonials | scraped testimonials | ✓ If found |
| Signature | agency + client contact info | ✓ Fully |

**Every single section is populated before the user does anything in the editor.** The editor is for reviewing and refining, not for filling in blanks.

---

## What If the Scrape Finds Nothing?

Not every agency has a polished website. The flow handles degradation gracefully:

| Scrape Result | Fallback |
|--------------|----------|
| No agency name | Use domain name (e.g., "saltycomm.com" → "Saltycomm") |
| No logo | Text initial with brand color background |
| No brand colors | Default: `#E8825C` |
| No services detected | Show all 22 modules unchecked, let user pick |
| No testimonials | Section hidden from proposals until user adds manually. Review page shows: "No testimonials found — add them here or in Settings later." |
| No about text | AI generates generic intro from selected services. Differentiators use standard defaults. |
| No process steps | Default 5 phases used |
| Scrape completely fails | "We couldn't access your website. No worries — let's set up manually." → Shows manual entry form for name, services, etc. |

The worst case is a user who enters a URL that can't be scraped or who clicks "No website? Set up manually." They get:
- Screen 1: Enter agency name + upload logo + pick brand color
- Screen 2: Select services from the 22-module grid + defaults for everything else
- Screen 3: Create first proposal

Still 3 screens. Still fast. Just less magical.

---

## Scraping Edge Function Spec

### Endpoint: `POST /functions/v1/scrape-agency-website`

### Input:
```json
{
  "url": "https://saltycomm.com"
}
```

### Process:
1. **Fetch pages** using a scraping API (Firecrawl recommended — it handles JavaScript rendering, follows links, and returns structured markdown):
   - Homepage
   - /about, /about-us, /who-we-are (try variants)
   - /services, /what-we-do
   - /work, /case-studies, /portfolio
   - /testimonials, /reviews, /clients
   - /contact

2. **Extract raw data:**
   - meta tags (title, description, og:image, theme-color)
   - structured data (schema.org, JSON-LD)
   - visible text content per page
   - image URLs (for logo detection)
   - mailto: and tel: links

3. **Send to Claude for parsing** with the structured extraction prompt (from above)

4. **Return:**
```json
{
  "agency": {
    "name": "Salty Communication",
    "tagline": "Strategic marketing for ambitious brands",
    "about_text": "We combine strategic thinking with...",
    "email": "hello@saltycomm.com",
    "phone": "+46 70 123 4567",
    "logo_url": "https://saltycomm.com/logo.png",
    "brand_colors": ["#E8825C", "#1A1917", "#F6F5F3"],
    "years_in_business": 8,
    "team_size": "5-10",
    "client_count": "50+"
  },
  "services_detected": [
    "branding", "web design", "seo", "content strategy",
    "social media", "graphic design"
  ],
  "service_module_matches": [
    { "module_name": "Brand Identity System", "confidence": 0.92 },
    { "module_name": "Website Design & Development", "confidence": 0.88 },
    { "module_name": "SEO Strategy & Implementation", "confidence": 0.85 },
    { "module_name": "Content Strategy & Planning", "confidence": 0.80 },
    { "module_name": "Social Media Management", "confidence": 0.78 },
    { "module_name": "Graphic Design Retainer", "confidence": 0.72 }
  ],
  "testimonials": [
    {
      "quote": "Salty transformed our brand from forgettable to unforgettable. Our traffic is up 200% in 6 months.",
      "client_name": "Sarah Chen",
      "client_title": "CEO",
      "client_company": "Meridian Technologies",
      "metric_value": "+200%",
      "metric_label": "Organic Traffic"
    }
  ],
  "differentiators": {
    "intro": "Salty Communication combines strategic thinking with hands-on execution...",
    "cards": [
      {
        "title": "Strategy First",
        "description": "Every engagement starts with research and strategy, not assumptions.",
        "stat_value": "87%",
        "stat_label": "Client Retention",
        "source": "scraped"
      },
      {
        "title": "Proven Results",
        "description": "Measurable results across brand, web, and growth projects.",
        "stat_value": "50+",
        "stat_label": "Clients Served",
        "source": "scraped"
      }
    ]
  },
  "scrape_quality": {
    "pages_fetched": 6,
    "confidence": "high",
    "missing": ["testimonial_metrics"]
  }
}
```

### Filling the Gaps

After the structured scrape returns, a second AI call generates anything that's missing:

**If < 3 testimonials found:** Leave as-is. Don't generate fake testimonials. Show "No testimonials found" or "1 testimonial found" honestly.

**If < 6 differentiator cards:** AI generates the remaining ones based on the agency's service mix and any scraped about text. Generated cards are tagged `"source": "generated"` so the UI can show them slightly differently (subtle "AI-generated" label or different opacity until the user confirms).

**If no about text found:** AI generates an intro paragraph from: agency name + detected services + any tagline/description found. It won't be perfect, but it's a starting point.

---

## Database Updates for Scraping

Add to `agencies` table (already exists):
```sql
scraped_data        JSONB       -- full raw scrape response for reference
scrape_status       TEXT        -- 'pending' | 'complete' | 'failed' | 'manual'
scrape_url          TEXT        -- the URL that was scraped
scraped_at          TIMESTAMPTZ -- when scraping completed
```

Add to `testimonials` table:
```sql
source              TEXT DEFAULT 'manual'  -- 'scraped' | 'manual' | 'imported'
```

Add to `differentiators` table:
```sql
source              TEXT DEFAULT 'manual'  -- 'scraped' | 'generated' | 'manual'
```

---

## Timing Budget

| Step | Time |
|------|------|
| User types URL + clicks scan | 5 sec |
| Scraping + AI parsing | 5-10 sec (shown as animated progress) |
| User reviews profile (scrolls, maybe edits 1-2 things) | 30-60 sec |
| User clicks "Create first proposal" | 2 sec |
| User enters client name + picks services | 20-30 sec |
| AI generates proposal | 3-5 sec |
| **Total time to first proposal** | **~90 seconds to 2 minutes** |

vs. the old 7-step onboarding: **8-15 minutes**

---

## What Happens After Onboarding

The user is now in the proposal editor with a fully populated proposal. Every section has real content. They can:

1. Review and edit any section
2. Share, download, or send the proposal
3. Go to the dashboard

**The Settings pages still exist** for deeper customization:
- Agency Profile: edit name, logo, contact info
- Branding: adjust colors
- Services: full module editor (deliverables, pricing, scope, etc.)
- Pricing & Terms: payment templates, default terms, currency
- Why Us: edit differentiator cards and intro
- Testimonials: manage library

But none of these are required to send a professional, complete proposal. That's the key insight: **the default experience should produce something the user is proud to send, without them configuring anything beyond confirming what the scraper found.**
