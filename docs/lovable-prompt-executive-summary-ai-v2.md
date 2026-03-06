# Lovable Prompt: Executive Summary AI + Proposal Title Generation

## Overview

Two things need to happen when a user creates a proposal:

1. **A proposal title is generated** based on the selected services (shown on the cover page and in the proposal list)
2. **An executive summary is generated** based on the selected services and optional client context

Both should happen automatically when the user creates a proposal. Both are editable after generation.

---

## What the User Sees vs. What They Don't

### User-facing (visible in UI)

| Element | Where it appears | Editable? |
|---------|-----------------|-----------|
| Proposal title | Cover page, proposal list, editor header | Yes |
| Executive summary text | Section 01 of proposal | Yes |
| "Main challenge" dropdown | Proposal creation page | Yes |
| "Primary goal" dropdown | Proposal creation page | Yes |
| "Additional context" text field | Proposal creation page | Yes |
| Stat bar (investment, timeline, services, goal) | Section 01 of proposal | Auto-calculated |

### Internal only (never shown to user)

| Data | Purpose |
|------|---------|
| Service AI context (per module) | Feeds into AI prompt to generate better summaries. Stored in the database as part of each service module but never displayed in any UI. |

The service AI context is a single text field on each service module that gives the AI background about what challenge the service typically addresses and what outcome it drives. The user never sees or edits this — it's pre-populated system data.

---

## PART 1: Proposal Title Generation

### How It Works

When the user selects services and creates a proposal, the system generates a title. The title should feel like what a real agency would put on a cover page — professional but not generic.

### Title Generation Rules

The title follows a simple pattern:

**{Primary Service Theme} Proposal for {Client Name}**

The "primary service theme" is derived from the selected services. Use these rules:

**If all services are from one category:**
Use the category name.
- Example: SEO Strategy + Local SEO → "Search & SEO Proposal for Meridian Technologies"

**If services span 2 categories:**
Combine them naturally.
- Example: Brand Identity + Website Design → "Brand & Web Proposal for Meridian Technologies"
- Example: SEO + Content Strategy + Blog Writing → "Content & SEO Proposal for Meridian Technologies"
- Example: Paid Search + Paid Social → "Paid Media Proposal for Meridian Technologies"

**If services span 3+ categories:**
Use a broader label.
- Example: SEO + Social Media + Paid Ads + Content → "Digital Marketing Proposal for Meridian Technologies"
- Example: Brand Identity + Website + Content + Social + Email → "Marketing Services Proposal for Meridian Technologies"

**Category → Title Label mapping:**

| Category | Short label for titles |
|----------|----------------------|
| Brand & Creative | Brand |
| Website & Digital | Web |
| Content & Copywriting | Content |
| SEO & Organic Growth | SEO |
| Social Media | Social Media |
| Paid Advertising | Paid Media |
| Email Marketing | Email Marketing |
| Marketing Automation & CRM | Marketing Automation |
| Analytics & Reporting | Analytics |
| Strategy & Consulting | Marketing Strategy |
| Conversion Rate Optimization | CRO |
| PR & Communications | PR |

**Combination rules for 2 categories:**
Join with "&" — pick the two that represent the biggest share of selected services. Put the more strategic/foundational one first (Brand before Web, Strategy before Execution, SEO before Content).

**Priority order when combining:**
Strategy > Brand > Web > Content > SEO > Social Media > Paid Media > Email > Automation > Analytics > CRO > PR

**Fallback for 3+ categories:**
- If one of them is Strategy & Consulting → "Marketing Strategy & Services Proposal for {client}"
- If Brand & Creative is included → "Brand & Marketing Proposal for {client}"
- Otherwise → "Digital Marketing Proposal for {client}"
- If literally everything → "Marketing Services Proposal for {client}"

### Title Database Field

```sql
-- Already exists in proposals table, just needs to be auto-populated
proposals.title TEXT NOT NULL
```

### Title is Editable

After generation, the title appears in the proposal editor header and is fully editable. Show it as an inline-editable text field — click to edit, blur to save.

---

## PART 2: Service AI Context (Internal Data)

### What This Is

Each service module gets one new internal field that the AI uses when generating executive summaries. This field is **not visible in any user interface** — it's system data that exists purely to help the AI write better.

### Database Change

```sql
ALTER TABLE service_modules ADD COLUMN ai_context TEXT;
```

This single field contains a short description of what challenge the service addresses and what outcome it drives. The AI uses this as background when writing the executive summary.

### Pre-populated Values for All 20 Modules

**Brand & Creative**

| Module | ai_context |
|--------|-----------|
| Brand Identity System | Addresses outdated or inconsistent visual identity. Delivers a professional brand that works across all touchpoints. Typical goal: cohesive brand presence across all channels. |
| Brand Messaging & Voice | Addresses unclear positioning — the business struggles to explain what makes them different. Delivers a messaging framework for consistent communication. Typical goal: compelling messaging that resonates with target customers. |
| Graphic Design Retainer | Addresses lack of dedicated design resource, causing inconsistent or slow creative output. Delivers ongoing design support. Typical goal: faster creative turnaround with consistent quality. |

**Website & Digital**

| Module | ai_context |
|--------|-----------|
| Website Design & Development | Addresses a website that doesn't convert, looks dated, or performs poorly on mobile. Delivers a modern site focused on conversion. Typical goal: better conversion rate and user experience. |
| Landing Page Design & Development | Addresses campaigns lacking a focused destination, wasting ad spend. Delivers a conversion-optimized landing page. Typical goal: higher conversion rate and lower cost per lead. |
| Website Maintenance & Support | Addresses security risks, slow load times, and outdated content nobody has time to fix. Delivers ongoing site maintenance. Typical goal: reliable site performance with no surprises. |

**Content & Copywriting**

| Module | ai_context |
|--------|-----------|
| Content Strategy & Planning | Addresses no clear plan for what content to create or how to measure it. Delivers a structured content strategy and editorial calendar. Typical goal: consistent content output tied to business goals. |
| Blog & Article Writing | Addresses not enough content to rank in search or engage the audience. Delivers regular SEO-optimized articles. Typical goal: steady growth in organic traffic. |
| Website Copywriting | Addresses website copy that doesn't communicate value or drive action. Delivers conversion-focused page copy. Typical goal: more conversions from existing traffic. |
| Email Copywriting | Addresses emails that aren't getting opened or driving revenue. Delivers professionally written email campaigns. Typical goal: better open rates and email-driven revenue. |

**SEO & Organic Growth**

| Module | ai_context |
|--------|-----------|
| SEO Strategy & Implementation | Addresses the business not showing up when potential customers search for what they offer. Delivers a structured SEO program. Typical goal: higher rankings and more organic traffic. |
| Local SEO | Addresses poor visibility in local search results and Google Maps. Delivers local search optimization. Typical goal: more local visibility and nearby customer inquiries. |

**Social Media**

| Module | ai_context |
|--------|-----------|
| Social Media Management | Addresses inactive or inconsistent social channels with low engagement. Delivers strategic social media presence. Typical goal: growing audience with real engagement. |
| Short-Form Video Content | Addresses missing out on short-form video as the fastest-growing content format. Delivers professional Reels/TikTok/Shorts content. Typical goal: increased video reach and brand awareness. |

**Paid Advertising**

| Module | ai_context |
|--------|-----------|
| Paid Search (PPC) Management | Addresses spending on ads without clear returns or missing high-intent search traffic. Delivers data-driven PPC campaigns. Typical goal: lower cost per lead and better ROAS. |
| Paid Social Advertising | Addresses not reaching the right audience on social or underperforming ad campaigns. Delivers targeted social advertising. Typical goal: more qualified leads at lower cost. |

**Email Marketing**

| Module | ai_context |
|--------|-----------|
| Email Marketing Management | Addresses an email list that isn't used effectively — no strategy, inconsistent sends, low engagement. Delivers a structured email program. Typical goal: higher engagement and revenue from email. |

**Marketing Automation & CRM**

| Module | ai_context |
|--------|-----------|
| Marketing Automation Setup | Addresses too many manual tasks, leads falling through cracks, no connection between marketing and sales. Delivers automated workflows. Typical goal: more leads converted with less manual effort. |

**Analytics & Reporting**

| Module | ai_context |
|--------|-----------|
| Analytics & Reporting Setup | Addresses no clear picture of what's working — decisions based on gut feeling. Delivers proper tracking and dashboards. Typical goal: data-driven decisions with clear performance visibility. |

**Strategy & Consulting**

| Module | ai_context |
|--------|-----------|
| Marketing Strategy & Consulting | Addresses scattered marketing efforts without a clear direction. Delivers a focused strategy and prioritized plan. Typical goal: clear marketing roadmap aligned with business goals. |

**Conversion Rate Optimization**

| Module | ai_context |
|--------|-----------|
| CRO & A/B Testing | Addresses getting traffic but not enough converting to leads or customers. Delivers systematic testing and optimization. Typical goal: higher conversion rate from existing traffic. |

**PR & Communications**

| Module | ai_context |
|--------|-----------|
| PR & Media Relations | Addresses low brand awareness or limited credibility in the market. Delivers earned media coverage and press outreach. Typical goal: increased awareness and third-party credibility. |

---

## PART 3: Client Context Inputs (User-Facing, Optional)

### Where They Live

On the **proposal creation page**, add a section below the client name/details area. This section is:
- Always visible (not collapsed — keep it lightweight enough that it doesn't need hiding)
- Clearly optional
- Labeled: **"Client context"** with a subtitle: *"Optional — makes the proposal more specific to this client"*

### The Three Inputs

**Input 1: "Main challenge"**
- Type: Single-select dropdown with "Other" option
- Required: No
- Placeholder: "Select one..."
- Options:
  - Not enough website traffic
  - Website isn't converting visitors
  - Low brand awareness
  - Inconsistent or outdated branding
  - No clear marketing strategy
  - Social media isn't driving results
  - Not generating enough leads
  - Ad spend isn't delivering results
  - Email marketing underperforming
  - Can't measure what's working
  - Other → reveals a short text input (max 100 chars)
- Database: `proposals.client_challenge` (text, nullable)

**Input 2: "Primary goal"**
- Type: Single-select dropdown with "Other" option
- Required: No
- Placeholder: "Select one..."
- Options:
  - Get more leads
  - Increase website traffic
  - Build brand awareness
  - Launch or relaunch a brand
  - Grow social media following
  - Increase online sales or revenue
  - Build a marketing foundation
  - Improve marketing ROI
  - Enter a new market
  - Other → reveals a short text input (max 100 chars)
- Database: `proposals.client_goal` (text, nullable)

**Input 3: "Quick note"**
- Type: Single-line text input
- Required: No
- Max length: 200 characters
- Placeholder: "e.g. They just raised a round and need to scale quickly"
- Database: `proposals.client_context_note` (text, nullable)

### Layout

Desktop: Dropdown 1 and Dropdown 2 side by side (50/50). Text input below, full width. Compact vertical spacing — this section should feel lightweight, not like a form.

Mobile: All three stacked.

### Database Schema

```sql
ALTER TABLE proposals ADD COLUMN client_challenge TEXT;
ALTER TABLE proposals ADD COLUMN client_goal TEXT;  
ALTER TABLE proposals ADD COLUMN client_context_note TEXT;
```

---

## PART 4: Executive Summary AI Generation

### Generation Tiers

**Tier 1 — No context provided (only selected services)**

The AI uses the `ai_context` field from each selected service module to understand what challenges the services address and what outcomes they drive. It writes a short, structured paragraph.

After generation, show a subtle inline hint below the text: "Add client context on the creation page to make this more specific →"

**Tier 2 — Dropdown(s) filled in**

The dropdown values override the service-level defaults. If the user selected "Not generating enough leads" as the challenge and "Get more leads" as the goal, the AI leads with that framing instead of deriving it from services.

**Tier 3 — Dropdowns + quick note**

The quick note adds specificity. "They just raised a round and need to scale quickly" changes the entire tone and urgency of the output.

### AI Prompt

```
You are writing an executive summary paragraph for a marketing 
proposal from {agency_name} to {client_name}.

RULES:
- Write 3-5 sentences. One paragraph. No headers or bullets.
- Write in plain, professional English. Direct and warm.
- Sound like a confident agency owner, not a chatbot.
- Do NOT use these words: leverage, synergy, holistic, elevate, 
  cutting-edge, game-changer, spearhead, unlock, empower, 
  innovative, robust, seamless.
- Do NOT start with "Dear", "This proposal", or "We are pleased".
- Start with the client's name or their situation.

STRUCTURE:
1. One sentence about the client's current situation or challenge
2. One to two sentences about the approach (reference services 
   naturally — don't list them mechanically)
3. One sentence about the expected outcome

CONTEXT:
- Client: {client_name}
- Agency: {agency_name}
- Selected services: {comma_separated_service_names}
- Service context: {combined_ai_context_from_selected_modules}
{if client_challenge}
- Client's main challenge (from agency): {client_challenge}
  USE THIS as the primary framing. It overrides the service context.
{endif}
{if client_goal}
- Client's primary goal (from agency): {client_goal}
  USE THIS as the outcome framing.
{endif}
{if client_context_note}
- Additional context: {client_context_note}
  Weave this in naturally. This is insider knowledge — use it to 
  make the proposal feel like it came from a real conversation.
{endif}
```

### Example Outputs

**Tier 1 — Services only (SEO + Content Strategy + Blog Writing):**

> Meridian Technologies has a solid product offering but isn't showing up when potential customers search online. Organic traffic has been flat, and without a content plan there's no engine driving new visitors to the site. This engagement covers three connected pieces: an SEO audit and strategy to fix the technical foundation, a content plan to focus efforts on the right topics, and ongoing article production to build authority over time. The expected result is a steady climb in organic traffic and a pipeline of inbound leads from search.

**Tier 2 — Challenge: "Not generating enough leads" / Goal: "Get more leads" (same services):**

> Meridian Technologies has the product and the team but not enough leads coming in the door to hit growth targets. Organic search should be a major source of qualified prospects, but right now the website isn't ranking for the terms their buyers are searching. We'll start with a full SEO strategy to capture that demand, build a content plan around the topics their audience cares about, and produce a steady stream of articles that rank and convert. The goal is simple: more of the right people finding Meridian through search, and more of them becoming leads.

**Tier 3 — Same as Tier 2 + note: "They just lost a key account and need pipeline fast":**

> Meridian Technologies is rebuilding their sales pipeline after a recent client departure and needs qualified leads coming in quickly. Their website should be a lead generation engine, but it's not ranking for the searches that matter and there's no content strategy driving traffic. We're going to move fast: an SEO audit to fix what's holding the site back, a focused content plan targeting high-intent topics, and immediate production of articles designed to rank and convert. The priority is getting results quickly — new organic leads within the first 90 days while building a foundation for sustained growth.

---

## PART 5: Stat Bar

The stat bar below the executive summary text stays as-is with one addition:

| INVESTMENT | TIMELINE | SERVICES | GOAL |
|-----------|----------|----------|------|
| Auto-calculated from pricing | Auto-calculated from timelines | Count of selected modules | From goal dropdown or top service default |

**"GOAL" stat logic:**
- If `client_goal` is set (Tier 2/3) → use that value (e.g., "Get more leads")
- If not set → pull the "Typical goal" from the `ai_context` of the first selected service (just the short goal phrase, e.g., "Higher rankings and more organic traffic")
- Display: All caps label "GOAL", value below in bold dark text, same styling as the other stats

---

## PART 6: Edit + Regenerate Behavior

1. Executive summary text appears in an editable text area, pre-filled after generation
2. Below the text area: a "Regenerate" button (small, secondary style — not prominent)
3. Proposal title appears as inline-editable text in the editor header
4. If the user edits the text manually and then changes a dropdown on the creation page, do NOT auto-regenerate. Instead show: "Context updated — click Regenerate to update the summary"
5. Regenerate always uses current inputs (services + any context provided)
6. The executive summary and title are saved independently — regenerating one doesn't affect the other

---

## Build Summary

| What to build | Type | Priority |
|--------------|------|----------|
| `ai_context` field on service_modules table | Database + seed data | Must have |
| `client_challenge`, `client_goal`, `client_context_note` on proposals table | Database | Must have |
| Proposal title auto-generation (from service categories + client name) | Logic + UI | Must have |
| Client context section on creation page (2 dropdowns + 1 text field) | UI | Must have |
| Executive summary AI generation endpoint | Backend | Must have |
| Editable title in proposal editor | UI | Must have |
| Editable executive summary with regenerate button | UI | Must have |
| "GOAL" stat in stat bar | UI | Nice to have |
| "Context updated" prompt when inputs change after manual edit | UI | Nice to have |
