## Implement Standard Bundle Library

Add a pre-built bundle library that agencies can browse and activate. Bundles can be added during onboarding OR from the Bundles page in the app. When a bundle is added that contains services not yet in the agency's service library, those services are automatically added.

---

## 1. BUNDLE DATA

Create these 8 standard bundles as seed data. Each bundle has a name, tagline, description, included services, and default pricing.

### Bundle 1: Brand Launch
- **Tagline:** "From identity to online presence — everything to launch your brand."
- **Description:** A complete brand foundation package covering visual identity, messaging framework, website design, and the copy to bring it all together. Ideal for new businesses, rebrand projects, or companies launching a new product line.
- **Services:** Brand Identity System ($8,000 fixed), Brand Messaging & Voice ($4,000 fixed), Website Design & Development ($15,000 fixed), Website Copywriting ($4,000 fixed)
- **Individual total:** $31,000
- **Bundle price:** $26,350 (85%)
- **Savings:** $4,650

### Bundle 2: Digital Growth Engine
- **Tagline:** "Content, SEO, and analytics working together to grow your pipeline."
- **Description:** A data-driven organic growth package combining SEO, content strategy, regular blog content, and the analytics infrastructure to track results. Built for businesses ready to invest in compounding organic growth.
- **Services:** SEO Strategy & Implementation ($3,000/mo), Content Strategy & Planning ($5,000 fixed), Blog & Article Writing ($2,000/mo), Analytics & Reporting Setup ($3,500 fixed)
- **Individual total:** $8,500 fixed + $5,000/mo
- **Bundle price:** $7,225 fixed + $4,250/mo
- **Savings:** $1,275 fixed + $750/mo

### Bundle 3: Lead Generation Machine
- **Tagline:** "Targeted ads, optimized landing pages, and full-funnel tracking."
- **Description:** An end-to-end paid acquisition package. We build the landing pages, run the ads across search and social, set up email nurture for captured leads, and give you the analytics to see exactly what's working.
- **Services:** Paid Search (PPC) Management ($2,000/mo), Paid Social Advertising ($2,000/mo), Landing Page Design & Development ($3,500 fixed), Email Marketing Management ($2,000/mo), Analytics & Reporting Setup ($3,500 fixed)
- **Individual total:** $7,000 fixed + $6,000/mo
- **Bundle price:** $5,950 fixed + $5,100/mo
- **Savings:** $1,050 fixed + $900/mo

### Bundle 4: Social Media Presence
- **Tagline:** "Strategy, content, and community management across every platform."
- **Description:** Everything needed for a professional social media presence. From strategy and content calendar to daily management, video content, and paid amplification. Keeps your brand visible, engaging, and growing.
- **Services:** Social Media Management ($2,500/mo), Short-Form Video Content ($3,000/mo), Content Strategy & Planning ($5,000 fixed), Paid Social Advertising ($2,000/mo)
- **Individual total:** $5,000 fixed + $7,500/mo
- **Bundle price:** $4,250 fixed + $6,375/mo
- **Savings:** $750 fixed + $1,125/mo

### Bundle 5: Marketing Foundation
- **Tagline:** "Strategy, messaging, and measurement — the foundation everything else builds on."
- **Description:** Before you run ads or post content, you need a plan. This package delivers a complete marketing strategy, brand messaging framework, content roadmap, and the analytics to measure success. The blueprint for everything that follows.
- **Services:** Marketing Strategy & Consulting ($6,000 fixed), Brand Messaging & Voice ($4,000 fixed), Content Strategy & Planning ($5,000 fixed), Analytics & Reporting Setup ($3,500 fixed)
- **Individual total:** $18,500
- **Bundle price:** $15,725
- **Savings:** $2,775

### Bundle 6: Full-Service Retainer
- **Tagline:** "Your outsourced marketing department — content, social, email, and design."
- **Description:** A comprehensive ongoing retainer covering the core marketing channels. Social media, email campaigns, fresh blog content, design support, and analytics reporting. For businesses that want consistent, professional marketing without hiring an in-house team.
- **Services:** Social Media Management ($2,500/mo), Email Marketing Management ($2,000/mo), Blog & Article Writing ($2,000/mo), Graphic Design Retainer ($2,500/mo), Analytics & Reporting Setup ($3,500 fixed)
- **Individual total:** $3,500 fixed + $9,000/mo
- **Bundle price:** $2,975 fixed + $7,650/mo
- **Savings:** $525 fixed + $1,350/mo

### Bundle 7: Website & SEO Launch
- **Tagline:** "A website built to rank — design, content, SEO, and analytics from the start."
- **Description:** Combines a complete website build with SEO strategy, professional copywriting, and analytics setup. Instead of building a site and retrofitting SEO later, this package bakes search performance into every page from day one.
- **Services:** Website Design & Development ($15,000 fixed), Website Copywriting ($4,000 fixed), SEO Strategy & Implementation ($3,000/mo), Analytics & Reporting Setup ($3,500 fixed)
- **Individual total:** $22,500 fixed + $3,000/mo
- **Bundle price:** $19,125 fixed + $2,550/mo
- **Savings:** $3,375 fixed + $450/mo

### Bundle 8: Conversion & Growth
- **Tagline:** "Turn your existing traffic into more revenue with testing, automation, and optimization."
- **Description:** You're already getting traffic — now make it work harder. This package combines conversion rate optimization, marketing automation, email nurturing, and advanced analytics to squeeze more revenue from your existing audience.
- **Services:** CRO & A/B Testing ($2,500/mo), Marketing Automation Setup ($5,000 fixed), Email Marketing Management ($2,000/mo), Analytics & Reporting Setup ($3,500 fixed)
- **Individual total:** $8,500 fixed + $4,500/mo
- **Bundle price:** $7,225 fixed + $3,825/mo
- **Savings:** $1,275 fixed + $675/mo

---

## 2. BUNDLE TEMPLATE TABLE

Add a new table to store the standard bundle templates (separate from agency-specific bundles):

```sql
-- Standard bundle templates (read-only reference)
CREATE TABLE bundle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  discount_percentage INTEGER DEFAULT 15,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Which service modules belong to each template
CREATE TABLE bundle_template_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_template_id UUID REFERENCES bundle_templates(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL  -- matches service_modules.name for lookup
);
```

Seed the 8 bundles above into `bundle_templates` and their services into `bundle_template_modules` on database setup.

The existing `bundles` and `bundle_modules` tables remain for agency-specific bundles (which are copies that agencies can customize).

---

## 3. "ADD FROM LIBRARY" FLOW — Bundles Page

On the `/bundles` page, add a button in the top area: **"Browse bundle templates"** (or "Add from library").

Clicking it opens a modal or slide-over panel showing all 8 standard bundles as cards.

### Bundle Template Card Design:

Each card shows:
- Bundle name in `text-[16px] font-semibold` espresso
- Tagline in `text-[12px]` ink-muted, below the name
- Number of services: "4 services" or "5 services" as a small badge
- Included service names as small pills/tags in a row (e.g., "Brand Identity", "Website Design", etc.)
- Pricing summary: Show the bundle price prominently. If mixed pricing, show like "$26,350" or "$7,225 + $4,250/mo"
- Savings badge: "Save $4,650" in a small green-tinted badge
- An **"Add to my bundles"** button

### Card States:

**Available:** All services in this bundle exist in the agency's service library. Show the "Add to my bundles" button normally.

**Partially available:** Some services in this bundle are NOT in the agency's service library. Show the button as "Add bundle + 2 services" (where 2 is the number of missing services). Below the service pills, highlight the missing ones with a different style — e.g., dashed border instead of solid, with a small "will be added" label.

**Already added:** If the agency already has a bundle with the same name, show "Already in your library" in muted text instead of the button. Disable the card slightly.

### On Click "Add to my bundles" (or "Add bundle + X services"):

1. **Check which services are missing** from the agency's `service_modules` table.

2. **For each missing service:** Copy the default service module from the seed data into the agency's `service_modules` table. This means the service gets the full seed data — name, description, short_description, deliverables, client_responsibilities, out_of_scope, default_timeline, suggested_kpis, common_tools, and default pricing. Set `is_active = true` and `agency_id` to the current agency.

3. **Create the bundle:** Insert a new row into `bundles` with the agency_id, copying name, tagline, description, and calculated pricing from the template.

4. **Link the services:** Insert rows into `bundle_modules` linking the new bundle to the agency's service module IDs (including the ones just auto-added).

5. **Show confirmation:** A toast message: "Brand Launch added to your bundles" — and if services were auto-added: "Brand Launch added. 2 services were also added to your library: Website Copywriting, Brand Messaging & Voice."

6. **Close the modal** and show the new bundle in the agency's bundle list.

---

## 4. ONBOARDING BUNDLE STEP

In the onboarding flow (on the review screen or as part of service selection), show a "Suggested bundles" section.

### Auto-Suggestion Logic:

After the user confirms their services, check which bundles have ALL their services in the agency's active service list. Show up to 3 matching bundles, prioritized by total value (highest first).

If fewer than 2 bundles fully match, also show the best "partial match" bundles — ones where only 1 service is missing. For partial matches, show: "Add 1 more service to unlock this bundle" with the missing service name.

### Onboarding Bundle Card (compact version):

Smaller than the full Bundles page card. Show:
- Bundle name (bold)
- Tagline (one line)
- Included services as tiny pills
- Bundle price + savings badge
- **"Use this bundle"** button

When clicked during onboarding:
- The bundle is created in the agency's account (same flow as section 3)
- Any missing services are auto-added
- A check mark replaces the button: "✓ Added"
- The user can add multiple bundles

### If No Bundles Match:

Show a note: "You can create custom bundles or browse templates in Settings → Bundles after setup."

---

## 5. BUNDLES PAGE LAYOUT UPDATE

Update the `/bundles` page to have two sections:

### Top: "Your Bundles"
Shows the agency's active bundles (from `bundles` table). Each as an editable card:
- Name, tagline (editable on click)
- Included services with prices
- Bundle price (editable) vs individual total (calculated)
- Savings display (auto-calculated)
- "Edit", "Duplicate", "Deactivate" actions
- Drag to reorder

### Bottom: "Bundle Templates"
Shows the 8 standard bundles that the agency hasn't added yet. Uses the same card design as the modal (section 3). Button: "Add to my bundles" with the auto-add service logic.

This way the user doesn't need to open a modal — they can see available templates right on the page.

---

## 6. SERVICE AUTO-ADD BEHAVIOR — Important Details

When a service is automatically added because a bundle requires it:

- The service gets ALL default seed data (full description, deliverables array, client responsibilities, out of scope, timeline, pricing). It's a complete, usable service module from day one.

- The service is set to `is_active = true` so it appears in the agency's service library.

- The service appears in the correct `service_group` (e.g., "Brand & Creative" for Brand Identity System).

- The service uses the default pricing from the seed data. The agency can change this later.

- A notification/toast clearly tells the user which services were added: "Added 'Website Copywriting' and 'Brand Messaging & Voice' to your service library." Include a link: "View in Services →"

- If the service already exists in the agency's library but is set to `is_active = false` (they previously deactivated it), reactivate it instead of creating a duplicate. Show: "Reactivated 'Website Copywriting' in your service library."

---

## 7. BUNDLE PRICING DISPLAY

Bundles can contain a mix of fixed and monthly services. Display pricing correctly:

**All fixed services:** Show as single price. "$26,350" with strikethrough of "$31,000"

**All monthly services:** Show as monthly. "$7,650/mo" with strikethrough of "$9,000/mo"

**Mixed (most common):** Show both parts separately:
```
$7,225 + $4,250/mo
Individual: $8,500 + $5,000/mo    Save $2,025
```

The savings amount is the sum of fixed savings + annual monthly savings shown separately, or as a simple total.

On bundle cards, keep the display compact:
- Bundle price: `text-[16px] font-bold` in espresso
- Strikethrough individual price: `text-[13px] line-through` in muted
- Savings badge: `text-[11px] font-semibold` on a sage-tinted background (#F0F5F1 bg, #6E9A7A text) or using the app's status "won" color styling

---

## 8. BUNDLE EDITING

After a bundle is added to the agency's library, they can customize it:

- **Rename** the bundle and tagline
- **Edit the description**
- **Add or remove services** (from their active service library)
- **Change the bundle price** (overrides the 85% default)
- **Individual total and savings auto-recalculate** when services change

When a service is removed from a bundle, it stays in the agency's service library — only the bundle link is removed.

When a service is added to a bundle, it must already be in the agency's service library (show only active services in the "add service to bundle" picker).

Minimum 2 services per bundle. Show a validation message if the user tries to save with fewer than 2.
