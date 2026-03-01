## Fix Testimonial Scraping — Smart Multi-Page Discovery

The current scraper is failing to find testimonials because it only looks at the homepage and a few standard pages. Most agency websites put client testimonials inside case study pages, not on the homepage. The scraper needs a multi-step approach.

---

## THE PROBLEM

Agency websites typically structure testimonials in one of these ways:

1. **Dedicated testimonials section on homepage** — easy to scrape (current scraper handles this)
2. **Case study/portfolio pages with client quotes embedded** — this is the most common pattern for marketing agencies, and the current scraper misses it entirely
3. **A `/testimonials` or `/reviews` page** — sometimes exists, easy to scrape
4. **Scattered across service pages** — least common, hardest to find

The test site (saltycom.se) uses pattern #2. The case studies live at `/kundcase/` with individual pages like `/kundcase/gordetmedrw/`. Each case study page contains:
- Client description and results/metrics
- Client quotes in `<blockquote>` elements with attribution (name, title, company)
- BUT ALSO internal staff quotes in the same format ("Johan Skandevall, SEO-specialist på Salty")

The scraper is currently picking up the internal staff quotes and presenting them as testimonials. That's wrong.

---

## THE FIX — 3-Step Testimonial Discovery

### Step 1: Discover Testimonial-Bearing Pages

After scraping the homepage, look for links to pages that likely contain testimonials. Scan the site navigation and footer for links matching these patterns:

**URL patterns to follow:**
```
/case-studies, /cases, /kundcase, /portfolio, /work, /projects,
/testimonials, /reviews, /success-stories, /clients, /results,
/our-work, /what-we-do, /customers
```

**Link text patterns to follow:**
```
"case studies", "cases", "kundcase", "portfolio", "our work",
"testimonials", "reviews", "clients", "success stories", "results"
```

**What to do:**
1. From the homepage scrape, extract all internal links
2. Filter for links matching the patterns above
3. Fetch the first matching "index" page (e.g., `/kundcase/`)
4. From that index page, extract links to individual case study pages (e.g., `/kundcase/gordetmedrw/`)
5. Fetch up to 5 individual case study pages (don't scrape more than 5 to keep costs reasonable)

### Step 2: Extract Quotes from Case Study Pages

On each case study page, look for testimonial patterns:

**HTML patterns that indicate quotes:**
- `<blockquote>` elements
- Elements with class names containing: `quote`, `testimonial`, `review`, `client-quote`, `pullquote`
- Text wrapped in quotation marks ("..." or "...") with an attribution line below
- `<cite>` elements
- Text preceded by a large quotation mark icon (", «, »)

**For each quote found, extract:**
- The quote text
- The attribution line (name, title, company) — usually found in a `<cite>`, `<figcaption>`, or a line below the quote containing a comma-separated format like "Name, Title, Company" or "Name, Title at Company"

### Step 3: AI Filtering — Separate Client Quotes from Staff Quotes

This is the critical step. Send ALL extracted quotes to Claude with this prompt:

```
You are analyzing quotes found on a marketing agency's website. The 
agency's name is "{agency_name}".

Below are quotes extracted from case study pages. Some are CLIENT 
TESTIMONIALS (quotes from the agency's customers about working with 
the agency). Others are INTERNAL STAFF QUOTES (quotes from people 
who work at the agency itself).

For proposals, we ONLY want client testimonials — quotes from people 
OUTSIDE the agency praising the agency's work.

For each quote, determine:
1. Is this a CLIENT TESTIMONIAL or an INTERNAL STAFF QUOTE?
2. If it's a client testimonial, extract:
   - quote_text (translate to English if not already in English)
   - client_name
   - client_title
   - client_company
   - A relevant_metric if one is mentioned nearby (e.g., "+265% ROAS")

Rules for classification:
- If the person's title/role mentions the agency name, it's INTERNAL 
  (e.g., "SEO-specialist på Salty" → internal)
- If the person is described as owner/CEO/director of a DIFFERENT 
  company → CLIENT TESTIMONIAL
- If unsure, mark as "uncertain" and we'll skip it

Quotes to analyze:
{quotes_json}

Return JSON array of client testimonials ONLY:
[
  {
    "quote_text": "English translation of the quote",
    "client_name": "Name",
    "client_title": "Title",
    "client_company": "Company",
    "metric_value": "+265%",
    "metric_label": "ROAS increase",
    "is_testimonial": true,
    "confidence": "high"
  }
]

Only include quotes where is_testimonial is true AND confidence is 
"high" or "medium". Skip uncertain ones.
```

---

## EXAMPLE: How This Works for saltycom.se

**Step 1 — Discovery:**
- Homepage scraped → finds nav link "Kundcase" → `/kundcase/`
- Fetches `/kundcase/` → finds 4 case study links
- Fetches up to 5 individual pages: `/kundcase/gordetmedrw/`, `/kundcase/toyota-helsingborg-hoor/`, `/kundcase/brodernas/`, `/kundcase/ica-maxi-vaxjo/`

**Step 2 — Extraction:**
From `/kundcase/gordetmedrw/`, extracts 3 blockquotes:
1. "Saltys styrka är att de har specialistkompetens..." — Robin Westberg, ägare och grundare av GörDetMedRW
2. "Jag såg direkt att detta kommer bli riktigt roligt..." — Johan Skandevall, SEO-specialist på Salty
3. "Att jobba med Salty och deras sökmotoroptimering..." — Robin Westerberg, grundare av GörDetMedRW

From `/kundcase/toyota-helsingborg-hoor/`, extracts 1 quote:
4. "Sedan vi startade samarbetet med Salty har vi cementerat vår position..." — Jonas Nilsson, VD Kinch Bil

**Step 3 — AI Filtering:**
- Quote 1: Robin Westberg, "ägare och grundare av GörDetMedRW" → CLIENT (different company) ✓
- Quote 2: Johan Skandevall, "SEO-specialist på Salty" → INTERNAL (works at Salty) ✗
- Quote 3: Robin Westerberg, "grundare av GörDetMedRW" → CLIENT ✓ (but duplicate of quote 1's author — keep both, they're different quotes)
- Quote 4: Jonas Nilsson, "VD Kinch Bil" → CLIENT ✓

**Result: 3 client testimonials found, translated to English:**

```json
[
  {
    "quote_text": "Salty's strength is their specialist expertise across all areas of digital marketing. Their work always has a common thread, and the different campaigns reinforce each other.",
    "client_name": "Robin Westberg",
    "client_title": "Owner & Founder",
    "client_company": "GörDetMedRW",
    "metric_value": "+265%",
    "metric_label": "Facebook ROAS increase"
  },
  {
    "quote_text": "Working with Salty's SEO team is both reliable and profitable. They stay on their toes, analyzing competitors and search behavior frequently to ensure I get the best possible return on investment.",
    "client_name": "Robin Westberg",
    "client_title": "Founder",
    "client_company": "GörDetMedRW",
    "metric_value": "+55%",
    "metric_label": "Organic traffic increase"
  },
  {
    "quote_text": "Since we started working with Salty, we've cemented our position in the local market. We're the most visible brand in our entire region, and it's really created a ripple effect.",
    "client_name": "Jonas Nilsson",
    "client_title": "CEO, Kinch Bil",
    "client_company": "Toyota Center Helsingborg & Höör",
    "metric_value": "+687%",
    "metric_label": "Organic reach increase"
  }
]
```

---

## IMPLEMENTATION IN THE EDGE FUNCTION

Update the `scrape-agency-website` edge function:

### Current flow:
1. Scrape homepage → extract agency info → done

### New flow:
1. Scrape homepage → extract agency info
2. **NEW:** Look for case study / testimonial links in nav and page content
3. **NEW:** If found, fetch the index page (e.g., `/kundcase/`)
4. **NEW:** From the index, get up to 5 individual case study URLs
5. **NEW:** Fetch each case study page
6. **NEW:** Extract all blockquotes / quote patterns with attribution
7. **NEW:** Send quotes to Claude for filtering (client vs. staff)
8. **NEW:** Return only client testimonials, translated to English
9. Return complete agency profile with testimonials

### Cost Impact:
- Extra pages fetched: 1 (index) + up to 5 (case studies) = 6 additional page scrapes
- Extra Firecrawl cost: ~$0.03
- Extra AI call for filtering: ~$0.01
- **Total added cost per agency onboarding: ~$0.04**
- This only happens once during onboarding, not per proposal

### Timeout Handling:
Case study scraping adds 3-10 seconds to the onboarding scan. Update the scan progress screen to reflect this:

```
✓ Agency name found
✓ Logo detected  
✓ Brand colors extracted
✓ Contact details found
✓ Services identified
○ Searching for testimonials...     ← new step
○ Generating your profile...
```

If the case study scraping takes too long (>8 seconds), skip it gracefully:
- Show "No testimonials found — add them manually in Settings"
- Don't block the rest of the onboarding

### Fallback: No Case Study Pages Found
If the site doesn't have case studies or the patterns don't match, fall back to checking for testimonials on these pages:
- `/testimonials`
- `/reviews`  
- Homepage sections with class names containing "testimonial" or "review"

If nothing is found anywhere, show the empty state: "No testimonials found on your website. Add them here or in Settings later."

---

## UI — DISPLAYING FOUND TESTIMONIALS

When testimonials ARE found, display them exactly as the current implementation does but with these additions:

### Show the Metric
Each testimonial card should show the associated metric if found:

```
┌──────────────────────────────────────────────────────┐
│  "                                           Remove  │
│                                                      │
│  "Salty's strength is their specialist expertise      │
│   across all areas of digital marketing. Their work   │
│   always has a common thread."                        │
│                                                      │
│  Robin Westberg · Owner & Founder · GörDetMedRW      │
│                                                      │
│  📈 +265% Facebook ROAS          ☐ Approve for use   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The metric badge adds credibility and makes the testimonial more powerful in proposals.

### Approval Checkbox
Keep the current "Approve for proposals" checkbox with default unchecked — this is correct for the legal framework.

### Translation Note
Since testimonials from non-English sites are AI-translated, add a small note:
```
ℹ Testimonials were translated to English from your website. 
  Review for accuracy before using in proposals.
```
Style: `text-[11px]` muted, below the info banner.
