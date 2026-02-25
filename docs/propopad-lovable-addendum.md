# PROPOPAD — Spec Addendum
# Missing features, detailed flows, and seed content

This document supplements the main Lovable spec (`propopad-lovable-spec.md`) with features and content that were designed in our prototypes but not fully captured in the spec.

**Give this to Lovable AFTER the main spec and service modules seed data.**

---

## 1. SINGLE-PAGE PROPOSAL CREATION (Replaces Wizard)

The main spec describes proposal creation as a multi-step wizard. Our refined design replaces this with a **single-page flow using zones** — faster and more natural.

### The Concept
Everything the user needs to create a proposal lives on ONE scrollable page. No "Step 1 → Step 2 → Step 3" navigation. No "Next" buttons. The user fills in zones from top to bottom, then clicks "Build Proposal" to enter the editor.

### Route: `/proposals/new`

### Page Layout
Single column, max-width 720px, centered. Clean and focused. No preview panel on this page — the page IS the input. The preview comes when they click "Build Proposal" and enter the editor.

### Zone 1: Client
**Prompt:** "Who is this proposal for?"

A single search input that serves dual purpose:
- **Existing client:** Type to search → dropdown shows matching clients → click to select → input shows client as a pill/chip: "✕ Meridian Technologies" with contact name + email below in compact read-only line. A "Change" link allows reselection.
- **New client:** If no match found, the typed text becomes the company name. Below, 2 optional fields slide in: Contact Name + Client Website URL (with auto-fill button). A "Add context about this client" expandable link opens a textarea for notes used by AI.

The zone collapses to ~60px height once a client is selected, keeping the page compact.

### Zone 2: Services
**Prompt:** "What are you proposing?"

This is the largest zone. Two sections:

**Top: Bundle cards** (only if agency has bundles)
- 2-3 bundle cards in a horizontal row
- Each card: name, tagline, included services as small pills, bundle price, individual price (strikethrough), savings badge
- Click to select (brand color border + check icon)
- Below bundles: expandable "+ Add individual services" section

**Bottom: Individual services** (expanded if no bundles, or as add-on)
- Service modules as selectable cards grouped by service category
- Category headers are collapsible
- Each card: checkbox, name, pricing model badge (FIXED / MONTHLY / HOURLY as color-coded pills), editable price, one-line description on hover
- Price badge is clickable for inline editing. Yellow dot shows "modified" price. Double-click resets to default.

**Running total bar** (sticky at bottom of zone):
- "Total Investment: $XX,XXX" (or "$XX,XXX + $X,XXX/mo" for mixed pricing)
- If bundle: "Bundle savings: -$X,XXX"
- Service count: "X services selected"

### Zone 3: Timeline (collapsed by default)
**Prompt:** "When does this start?" with an expand chevron.

- Project start date picker (defaults to next Monday)
- Auto-generated phase summary: "~12 weeks: Discovery → Strategy → Build → Launch"
- Expandable to show full phase breakdown with adjustable durations

### Zone 4: Action Bar (sticky bottom)
- "Build Proposal" primary button — enabled when client name + ≥1 service selected
- "Save as Draft" ghost button
- The Build Proposal button triggers the editor transition

### Creation Shortcuts (5 paths into this page)

| Path | Entry Point | What's Pre-filled |
|------|------------|-------------------|
| Blank | "New Proposal" button anywhere | Nothing — empty page |
| From Bundle | Click bundle card on dashboard | Bundle pre-selected in Zone 2 |
| From Services | Select service chips on dashboard | Those services pre-checked in Zone 2 |
| Repeat for Client | "Repeat" action on a client | Client zone filled + their last proposal's services suggested |
| Duplicate | "Duplicate" on existing proposal | Skips creation page entirely → opens editor with all data cloned |

---

## 2. ENHANCED DASHBOARD

The main spec's dashboard is good but missing the quick-creation shortcuts we designed. Add these sections:

### Quick Create Section (top of dashboard, below stat cards)
Three action cards in a horizontal row:

| Card | Label | Sublabel | Action |
|------|-------|----------|--------|
| Start from scratch | "New Proposal" | "Blank canvas" | → `/proposals/new` |
| Start from bundle | "Use a package" | "Pre-selected services" | → opens bundle picker, then `/proposals/new?bundle=ID` |
| Repeat for a client | "Same services" | "As their last proposal" | → opens client picker, then `/proposals/new?client=ID&repeat=true` |

### Bundle Quick Start (below Quick Create)
- Horizontal scrollable row of the agency's active bundle cards
- Each card shows: name, tagline, service count, price
- Click → "Create proposal with [Bundle Name]" CTA appears → navigates to `/proposals/new?bundle=ID`

### Service Quick Select (optional, below bundles)
- Toggleable chips for the agency's most-used services
- Select several → CTA appears: "Create proposal with X services" → navigates to `/proposals/new?services=ID1,ID2,ID3`

---

## 3. PROPOSAL EDITOR — FLOATING TOOLBAR & SECTION CONTROLS

After clicking "Build Proposal", the user enters the **proposal editor**. This is NOT a form — it's the actual proposal rendered as it will appear in the PDF, with edit affordances on hover.

### Editor Layout
- Full-width scrollable proposal (the 9 sections rendered vertically)
- **Floating section nav** on left edge: small pills showing section names, click to scroll
- **Top bar**: "← Back to creation" link, proposal title, status badge, "Share" button

### Section Hover Toolbar
When the user hovers over any section, a subtle toolbar appears at the top of that section:

| Control | Icon | What it does |
|---------|------|-------------|
| Section label | — | Shows section name (e.g., "Executive Summary") |
| ↻ Regenerate | refresh | Re-generates AI content for this section (only on AI sections) |
| 👁 Visibility | eye | Toggles section on/off. Hidden sections don't appear in PDF. |
| ⋮ More | dots | Menu: "Edit in settings" (for Why Us, Terms), "Reset to default" |

### Inline Editing Rules
- **Text sections** (Executive Summary, Scope descriptions, Timeline descriptions): Click any text to edit it directly. Contenteditable or rich text input.
- **Service cards** in Scope: Click to edit name, description, price. "✕" to remove. "+ Add service" button at bottom to add from module library.
- **Timeline phases**: Click name/description to edit. Click week badge to change range. Drag to reorder.
- **Investment table**: Click price to edit. "+ Add discount" link below table. Discount row with % or $ input.
- **Terms clauses**: Click to expand. Edit text inline. Toggle visibility per clause.
- **Why Us / Testimonials**: Click to edit. "Edit library →" link to go to settings for full management.
- **Signature block**: Contact info auto-filled from client + agency data.

### Empty Section Behavior
- **In editor**: Ghost state with action prompt (e.g., "Add testimonials to build trust → Settings")
- **In PDF export**: Section auto-hidden. Never show empty/broken sections in the PDF.

### Adding/Removing Services from Editor
The Scope of Services section has a "+ Add service" button and "✕" on each service card. When services are added or removed:
- Investment table auto-updates
- Timeline auto-recalculates
- Executive Summary can be regenerated
- No need to go back to the creation page

---

## 4. SHARE & SEND MODAL

When the user clicks "Share" in the editor top bar, a modal appears with 3 action cards:

### Download PDF
- One-click → generates PDF → browser download
- Progress bar during generation (1-2 sec)
- PDF matches the editor exactly (same components, same styles)

### Send via Email
- Pre-fills client email (from client record)
- Editable subject line (default: "[Agency Name] — [Proposal Title]")
- Editable cover message textarea (default: "Hi [Contact Name], Please find our proposal attached...")
- "Send" button dispatches email with:
  - Cover message as email body
  - PDF attached
  - Link to web version (`/p/:shareId`)
- Sets proposal status to "sent" and records `sent_at`

### Copy Link
- Generates unique shareable URL: `https://app.propopad.com/p/:shareId`
- Click-to-copy with visual confirmation
- Shows expiry date (matches proposal validity_days)
- "Link active until [date]"

---

## 5. FOLLOW-UP ACTIONS

On the proposals list and dashboard, proposals with status "sent" or "viewed" should show contextual follow-up actions:

### On "Sent" proposals (no client activity):
- "Follow up" action → opens email composer with follow-up template:
  - Subject: "Following up: [Proposal Title]"
  - Body: "Hi [Name], I wanted to follow up on the proposal I sent on [date]..."
- "Resend" action → resends the original email

### On "Viewed" proposals (client has opened):
- "Follow up" action → email composer with engagement-aware template:
  - "Hi [Name], I noticed you've had a chance to review our proposal..."
- Show "Viewed [time ago]" badge with relative timestamp

### Automatic reminders (future feature flag):
- Optional auto-reminder email 3 days after sending if not viewed
- Optional auto-reminder 2 days after viewing if not accepted
- Configurable in settings

---

## 6. DEFAULT TERMS & CONDITIONS — FULL TEXT

The spec lists 8 clause titles but doesn't include the actual default legal text. Here is the seed content for each clause:

### 1. Payment Terms
All fees are due according to the payment schedule outlined in the Investment section of this proposal. Invoices will be issued at each milestone and are payable within 14 days of receipt. Late payments may incur a charge of 1.5% per month on the outstanding balance. Work may be paused on accounts with payments overdue by more than 30 days. All prices quoted are exclusive of applicable taxes unless otherwise stated.

### 2. Project Timeline & Milestones
The project timeline outlined in this proposal is an estimate based on the defined scope of work. Actual timelines may vary depending on the timely provision of client feedback, content, assets, and approvals. Delays in client deliverables may result in corresponding delays to the project schedule. We will communicate any anticipated changes to the timeline promptly and work collaboratively to minimize impact.

### 3. Revision Policy
This proposal includes the number of revision rounds specified per deliverable. A revision is defined as a set of consolidated feedback provided at one time. Additional revision rounds beyond the included allowance will be billed at our standard hourly rate. Major changes to the agreed scope, direction, or strategy after approval may constitute new work and will be quoted separately.

### 4. Intellectual Property
Upon receipt of full and final payment, the client will receive full ownership of all final deliverables created specifically for this project. This includes design files, code, copy, and other materials as outlined in the deliverables. The agency retains the right to use project work in portfolios, case studies, and marketing materials unless otherwise agreed in writing. Any pre-existing intellectual property, frameworks, tools, or templates used in the creation of deliverables remain the property of the agency and are licensed for the client's use.

### 5. Confidentiality
Both parties agree to keep confidential any proprietary or sensitive information shared during the course of this engagement. This includes but is not limited to business strategies, financial information, customer data, technical specifications, and unpublished creative work. Confidential information will not be disclosed to third parties without prior written consent. This obligation survives the termination of this agreement for a period of two years.

### 6. Termination
Either party may terminate this agreement with written notice as specified in the notice period above. In the event of termination, the client will be invoiced for all work completed up to the termination date, plus any committed third-party costs. Any deposits or advance payments for work not yet started will be refunded within 30 days. Termination does not affect either party's rights or obligations that accrued prior to the termination date.

### 7. Liability
The agency's total liability under this agreement shall not exceed the total fees paid by the client for the services. The agency shall not be liable for any indirect, incidental, consequential, or special damages arising from or related to this agreement. The agency does not guarantee specific business results, rankings, traffic levels, or conversion rates, as these are influenced by many factors beyond the agency's control. Both parties will make reasonable efforts to resolve any disputes through good-faith negotiation before pursuing formal resolution.

### 8. Governing Law
This agreement shall be governed by and construed in accordance with the laws of [Agency Jurisdiction]. Any disputes arising from this agreement shall be resolved through mediation before either party may pursue litigation. Both parties consent to the jurisdiction of the courts located in [Agency Jurisdiction] for any legal proceedings related to this agreement.

**Note:** The `[Agency Jurisdiction]` placeholder should be editable by the agency in settings. If not set, it shows the placeholder text prompting the agency to fill it in.

---

## 7. DASHBOARD PIPELINE VIEW (Future Enhancement)

Add an optional pipeline/kanban view toggle on the proposals page:

### Kanban Columns
| Draft | Sent | Viewed | Accepted | Declined |
|-------|------|--------|----------|----------|

- Proposals as cards that can be dragged between columns (status updates on drop)
- Cards show: client name, title, value, days in current stage
- Column headers show count and total value
- Toggle between list/grid/pipeline views

This can be a Phase 2 feature, but the spec should mention it exists.

---

## 8. NOTIFICATION SYSTEM

### In-App Notifications
- Bell icon in top header bar with unread count badge
- Dropdown showing recent events:
  - "🔵 [Client] viewed your proposal" + timestamp
  - "🟢 [Client] accepted your proposal!" + timestamp
  - "🔴 [Client] declined your proposal" + timestamp
  - "⚠️ Proposal for [Client] expires in 3 days" + timestamp
- Click notification → navigate to proposal

### Email Notifications (sent to agency user)
- Proposal viewed (first time only)
- Proposal accepted
- Proposal declined
- Proposal expiring soon (3 days before validity_until)

### Database Table: `notifications`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
agency_id       UUID REFERENCES agencies(id)
user_id         UUID REFERENCES users(id)
proposal_id     UUID REFERENCES proposals(id)
type            TEXT NOT NULL    -- 'viewed' | 'accepted' | 'declined' | 'expiring'
title           TEXT NOT NULL
message         TEXT
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## 9. ADDITIONAL DATABASE TABLE: `proposal_shares`

Track unique share links for proposals:
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
proposal_id     UUID REFERENCES proposals(id) ON DELETE CASCADE
share_id        TEXT UNIQUE NOT NULL    -- short unique ID for URL
share_type      TEXT DEFAULT 'link'     -- 'link' | 'email'
recipient_email TEXT                    -- if sent via email
expires_at      TIMESTAMPTZ             -- matches proposal validity
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

The public route `/p/:shareId` looks up this table to find the proposal. If `is_active` is false or `expires_at` has passed, show an "This proposal has expired" page.

---

## 10. COVER MESSAGE TEMPLATES

When sending proposals via email, the system should provide default cover message templates:

### Initial Send
Subject: `[Agency Name] — [Proposal Title]`
Body:
```
Hi [Contact First Name],

Thank you for the opportunity to put this together. Please find our proposal for [Proposal Title] — we've outlined our recommended approach, timeline, and investment.

You can view the full proposal here: [Link]

Happy to discuss any questions. Looking forward to hearing your thoughts.

Best regards,
[User Name]
[Agency Name]
```

### Follow-Up (No Activity)
Subject: `Following up: [Proposal Title]`
Body:
```
Hi [Contact First Name],

I wanted to follow up on the proposal I sent on [sent date]. I know things get busy — just wanted to make sure it landed and see if you had any questions.

Here's the link again: [Link]

Happy to hop on a quick call if that's easier.

Best,
[User Name]
```

### Follow-Up (Viewed)
Subject: `Re: [Proposal Title]`
Body:
```
Hi [Contact First Name],

I noticed you've had a chance to review our proposal — great! I'd love to hear your initial thoughts and answer any questions.

Would [suggest day] work for a quick 15-minute call?

Best,
[User Name]
```

These templates are editable by the agency in settings.

---

## 11. PRICING TABLE DISPLAY LOGIC (Clarification)

The Investment section needs to handle 4 scenarios cleanly:

### Scenario A: All Fixed Pricing
Simple flat table. No grouping headers. One total at bottom.

### Scenario B: All Monthly Pricing
Simple flat table with "/mo" suffix on all prices. Total shows as "$X,XXX/mo".

### Scenario C: Mixed Pricing (most common with bundles)
Grouped table with section headers:

```
PROJECT FEES
  Brand Identity System          $12,000
  Website Design & Development    $25,000
  Subtotal                        $37,000

MONTHLY RETAINERS
  Social Media Management          $3,500/mo
  SEO Strategy                     $2,500/mo
  Subtotal                         $6,000/mo

BUNDLE SAVINGS                    -$4,500

TOTAL INVESTMENT       $32,500 + $6,000/mo
```

### Scenario D: Bundle with Discount
Show individual service prices, then bundle savings row, then total.

The total should never collapse mixed pricing into a single annual number. Always show the structure: `$X fixed + $Y/mo` (or `+ $Z/hr estimated`).

---

## 12. IMPLEMENTATION PRIORITY ORDER

Suggested build order for Lovable (each phase should be deployable):

### Phase 1: Foundation
- Supabase setup (all tables, RLS policies)
- Auth (signup, login, logout)
- Onboarding flow (Steps 1-7)
- Service module seed data loading

### Phase 2: Core Product
- Dashboard (stats + recent proposals)
- Single-page proposal creation
- Proposal editor (WYSIWYG sections)
- PDF export
- Client management (CRUD)

### Phase 3: Sharing & Tracking
- Public proposal page (`/p/:shareId`)
- Share modal (PDF, Email, Link)
- Proposal analytics
- Notifications (in-app + email)
- Status auto-updates (viewed, expired)

### Phase 4: Polish
- Settings pages (all)
- Bundle management
- Service module editor
- Quick Create dashboard shortcuts
- Cover message templates
- Follow-up flows

### Phase 5: Growth
- Subscription/billing (Stripe)
- Team features (Agency plan)
- Pipeline/kanban view
- API access
- Client portal

---

*End of addendum. This document fills the gaps identified in the main spec. Together with `propopad-lovable-spec.md` and `propopad-service-modules-seed.md`, you have the complete specification for building Propopad.*
