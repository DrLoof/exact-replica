## Add Legal Pages, Cookie Banner & Legal UI Amendments

Create the legal infrastructure for Propopad: Terms of Service page, Privacy Policy page, cookie consent banner, signup consent, and in-app legal amendments. All pages should use the existing app design system (Satoshi font, cream/espresso/brass palette, Paper Studio aesthetic).

---

## 1. CREATE ROUTE: `/terms`

Create a new public page (no authentication required) at `/terms` with the full Terms of Service.

**Layout:** Centered single column, `max-width: 680px`, generous padding. White paper card on cream background. No sidebar. Propopad logo at top linking to homepage.

**Header:**
- Propopad logo (paper-fold P mark) + "Propopad" text, linked to `/`
- Title: "Terms of Service" in `text-[28px] font-bold` espresso
- "Last updated: February 2026" in `text-[13px]` muted
- A subtle `1px` parchment divider below

**Content — render the following as formatted text with proper headings:**

### 1. About Propopad

Propopad is a proposal creation platform for service businesses, operated by Propopad, based in Sweden.

Contact: hello@propopad.com

### 2. Agreement

By creating an account, you agree to these Terms and our Privacy Policy. If you represent a business, you confirm you have authority to agree on its behalf. You must be at least 18 years old.

### 3. The Service

Propopad lets you create, customize, send, and track business proposals. This includes creating proposals using pre-built service templates and AI-generated content, sending proposals via shareable web links and PDF export, tracking client engagement with your proposals, managing your services, pricing, and client information, and scanning your own website to set up your account.

### 4. Your Account

You're responsible for keeping your login credentials secure and for all activity under your account. Provide accurate information. One account per business. We may suspend accounts that appear fraudulent or violate these Terms.

### 5. Your Content & Responsibility

You own all content you create in Propopad — proposals, services, client data, branding. We don't claim ownership.

You grant us a limited license to store, process, display, and transmit your content solely to provide the Service. This license ends when you delete your content or account.

You are responsible for the accuracy of pricing, service descriptions, and terms you present to clients. You are responsible for having proper permission to use testimonials, client logos, and third-party content. You are responsible for reviewing and editing all AI-generated content before sending.

Propopad provides templates, default terms, and AI-generated text as starting points. These are not legal, financial, or professional advice.

### 6. AI-Generated Content

Parts of the Service use AI to generate proposal content including summaries, titles, descriptions, and projections. AI-generated content is a suggestion that you should always review before sending. It may contain inaccuracies. It becomes your responsibility once you send a proposal containing it. It does not constitute professional advice of any kind.

### 7. Website Scanning

When you choose to scan your website during setup, we read only publicly accessible content from the URL you provide. We extract business information, services, testimonials, and branding. Extracted content is stored in your account only. You review and approve all extracted content before use. You confirm you have the right to use any testimonials or third-party content found. We respect robots.txt and do not scan pages behind authentication.

### 8. Acceptable Use

Do not use Propopad to create fraudulent, deceptive, or illegal proposals, include defamatory or unlawful content, attempt to access other users' data, reverse-engineer or interfere with the Service, create multiple free accounts to circumvent limits, or resell or white-label the Service without permission.

### 9. Subscription & Payment

Free plan is subject to usage limits shown on our pricing page. We may modify free plan limits with 30 days' notice.

Paid plans are billed monthly via Stripe. Cancel anytime — access continues through the current billing period. No refunds for partial periods. We may change pricing with 30 days' email notice, effective at the next billing cycle.

### 10. Proposal Links & Analytics

Proposals shared via link are accessible to anyone with the link. We track engagement (views, time spent per section) to provide you with analytics. On free plans, a "Powered by Propopad" notice appears on proposals.

### 11. Limitation of Liability

To the maximum extent permitted by law, our total liability is limited to fees you've paid us in the 12 months before the claim. We are not liable for indirect, incidental, or consequential damages, lost deals, lost revenue, or business interruption. We are not liable for the accuracy of AI content, scan results, or analytics. We are not liable for actions your clients take based on your proposals.

### 12. Disclaimer

The Service is provided "as is" without warranties of any kind. Templates, AI content, and default terms are starting points, not professional advice.

### 13. Account Deletion

You can delete your account from Settings at any time. We delete your data within 30 days. Public proposal links become inactive upon deletion.

### 14. Governing Law

These Terms are governed by Swedish law. Nothing in these Terms limits your rights under mandatory consumer protection laws in your jurisdiction.

### 15. Changes

We may update these Terms with 30 days' email notice. Continued use after the effective date means acceptance.

### 16. Contact

Questions: hello@propopad.com

**Styling for the text content:**
- Section headings: `text-[16px] font-semibold` in espresso, with `mt-8 mb-3`
- Body paragraphs: `text-[14px] leading-relaxed` in `#4A3F32` (ink-soft)
- Spacing between paragraphs: `mb-4`
- The page should feel like a well-typeset document — generous line height, comfortable reading width

---

## 2. CREATE ROUTE: `/privacy`

Same layout as `/terms`. Title: "Privacy Policy".

**Content:**

### 1. Who We Are

Propopad is operated from Sweden by Propopad.

Privacy contact: privacy@propopad.com

This policy explains how we handle data for users worldwide, with specific sections for EU/EEA users (GDPR) and California users (CCPA).

### 2. Data We Collect

Account information: Email, name, and password (hashed) when you sign up.

Business information: Agency name, website, logo, brand colors, contact details, and business settings you provide.

Proposal content: Everything in your proposals — service descriptions, pricing, client information, testimonials, terms, timelines.

Client information: Names, emails, companies, and notes about your clients that you enter.

Website scan data: When you choose to scan your website, we extract publicly available business information, services, testimonials, and branding from the URL you provide. Raw scan data is deleted after 90 days; extracted results remain in your account.

Analytics data: When your clients view proposals, we record page views, sections viewed, time spent, device type, and IP address. IP addresses are anonymized after 30 days.

Usage data: How you use Propopad — pages visited, features used, timestamps. Collected to improve the Service.

Payment data: Processed entirely by Stripe. We never see or store card numbers.

Cookies: Session cookies for authentication (essential), preference cookies for settings (optional), analytics cookies for service improvement (optional). No advertising or tracking cookies.

### 3. How We Use Your Data

We use your data to provide and maintain the Service, generate AI content for your proposals, show you proposal engagement analytics, process your payments, send transactional emails (proposal viewed, accepted, etc.), and improve the Service.

We do NOT sell your data. We do NOT use your content to train AI models. We do NOT share your data with advertisers.

### 4. Third-Party Data

You may enter personal data of others (clients, testimonial subjects). You are responsible for having appropriate permission to store and use this data. For testimonials detected during website scanning, you explicitly approve each one before it is used in proposals.

### 5. Service Providers

We share data with these providers to operate the Service: Supabase (database and authentication, EU), Anthropic (AI content generation, US), Stripe (payment processing, US), and our website scanning provider (US). For transfers to the US, appropriate safeguards are in place.

### 6. Data Retention

Account data, proposals, and client information are kept until you delete them or your account, then deleted within 30 days. Proposal analytics are kept 12 months after proposal expiry. Raw website scan data is kept 90 days. Payment records are kept 7 years (Swedish accounting law). Server logs are kept 90 days. Backups containing deleted data are purged within 90 days.

### 7. Your Rights

All users can access and export all their data from Settings, correct inaccurate data in-app, delete specific data or their entire account, and contact us at privacy@propopad.com.

EU/EEA users additionally have GDPR rights to restrict processing, data portability, object to processing based on legitimate interest, withdraw consent for website scanning, and lodge a complaint with the Swedish Authority for Privacy Protection (IMY) or your local supervisory authority.

California users have CCPA rights to know what personal information is collected, delete personal information, opt out of sale of personal information (we don't sell data), and non-discrimination for exercising privacy rights.

We respond to all requests within 30 days.

### 8. Security

We protect your data with encryption in transit and at rest, row-level security isolating each account's data, regular security monitoring, and access controls limiting employee access to customer data.

### 9. Cookies

We use essential cookies for authentication (cannot be disabled) and optional analytics cookies to improve the Service (can be disabled). We do NOT use advertising or tracking cookies.

### 10. Children

Propopad is for users 18 and older. We do not knowingly collect data from minors.

### 11. Changes

Material changes are communicated via email 30 days in advance.

### 12. Contact

Privacy questions: privacy@propopad.com

---

## 3. COOKIE CONSENT BANNER

Create a cookie consent banner component that appears at the bottom of the screen on first visit (before or after login). Store consent in localStorage.

**Design:**
- Fixed to bottom of viewport
- White paper card with shadow, `rounded-t-xl` (rounded top corners only)
- Max-width: 520px, centered horizontally
- Padding: `px-5 py-4`

**Content:**
```
We use essential cookies for the app to work and optional
cookies to improve your experience. No advertising cookies.

[ Essential only ]  [ Accept all ]
```

- Text: `text-[13px]` in ink-soft
- "Essential only" button: ghost style — `border: 1px solid parchment`, text in ink-muted, `rounded-[8px] px-4 py-2 text-[12px] font-medium`
- "Accept all" button: espresso bg, white text, `rounded-[8px] px-4 py-2 text-[12px] font-semibold`

**Behavior:**
- On "Accept all": set `cookie_consent: "all"` in localStorage, hide banner
- On "Essential only": set `cookie_consent: "essential"` in localStorage, hide banner
- If `cookie_consent` exists in localStorage, don't show banner
- Banner should not block page interaction (no overlay behind it)

**Link:** Add "Learn more" link after the text that goes to `/privacy#cookies`

---

## 4. SIGNUP LEGAL CONSENT

On the signup page (or before the first save in the gated-onboarding flow), add a checkbox:

```
[ ] I agree to the Terms of Service and Privacy Policy
```

- "Terms of Service" links to `/terms` (opens in new tab)
- "Privacy Policy" links to `/privacy` (opens in new tab)
- Text: `text-[12px]` in ink-muted
- Links: `text-[12px] font-medium underline` in ink-soft
- Checkbox uses the standard app checkbox style
- The signup/continue button is disabled until this is checked

---

## 5. IN-APP LEGAL AMENDMENTS

### 5A. Website Scan Consent Line

On the onboarding screen where the user enters their website URL and clicks "Scan my website", add a line of text below the button:

```
By scanning, you allow Propopad to read publicly available
content from this URL to set up your account.
```

Style: `text-[11px]` in muted text (`#B8B0A5`), centered, `mt-2`

### 5B. Testimonial Approval Toggles

On the onboarding review screen where scraped testimonials are shown, add:

**Above the testimonials list:**
```
We found these on your website. Confirm you have permission
to use each one in proposals.
```
Style: `text-[12px]` in ink-muted, with a small `ℹ` info icon in brass color

**On each testimonial card:**
- Add a checkbox: "Approve for proposals" — default UNCHECKED
- Add a "Remove" text button in muted color
- Only checked/approved testimonials are saved to the database and used in proposals
- If zero approved, the testimonials section is hidden from generated proposals

### 5C. AI Content Notice

The FIRST time AI generates content for a user (during onboarding step "Generate Proposal" or first proposal creation), show a small dismissible banner at the top of the proposal editor:

```
✨ AI-generated content — review and edit before sending to clients.    [ Got it ]
```

Style:
- Background: `#F5F2EC` (cream) with `1px` brass `#BE8E5E` left border
- Text: `text-[12px]` in ink-soft
- "Got it" button: `text-[12px] font-medium` in ink-muted
- Dismiss stores preference in user record or localStorage so it doesn't show again

After dismissal, AI-generated sections in the proposal editor show a tiny "AI" label:
- `text-[9px] font-medium uppercase tracking-[0.05em]` in muted color
- Positioned at top-right of the section
- Visible in editor only, NOT visible in the client-facing proposal or PDF

### 5D. Terms Template Disclaimer

In the onboarding step where default terms/conditions are shown, AND in the Settings → Pricing & Terms page, add a note at the top of the terms section:

```
These are template clauses, not legal advice. Have a lawyer
review your terms before using them with clients.
```

Style: `text-[12px]` in ink-muted, with a `⚠` icon in `#C07A5C` (warm muted orange)

### 5E. Proposal Analytics Notice (Client-Facing)

On every client-facing proposal page (`/p/:shareId`), add at the very bottom, below the signature section:

```
Viewing activity is tracked to help [Agency Name] follow up.
```

Style: `text-[10px]` in `#B8B0A5` (very muted), centered, with generous top margin (`mt-16`). This should be unobtrusive — a legal footnote, not a prominent notice.

---

## 6. FOOTER LINKS

Add footer links to the legal pages in two places:

**A. Sidebar footer** (below the user profile in the sidebar):
Add small text links:
```
Terms · Privacy
```
Style: `text-[10px]` in muted (`#B8B0A5`), centered below the user area. Links go to `/terms` and `/privacy`.

**B. Public proposal pages** (`/p/:shareId`):
The analytics notice (5E above) serves as the only footer element. No additional legal links needed on proposal pages.

**C. Login/signup pages:**
Add the same "Terms · Privacy" links below the signup form.

---

## 7. NAVIGATION

Add `/terms` and `/privacy` to the router as PUBLIC routes (no authentication required). They should be accessible to anyone, including non-logged-in visitors and clients who click through from proposals.

The legal pages should NOT show the app sidebar. They should show:
- Propopad logo at top left (links to homepage or `/`)
- A "Back to app" link at top right if the user is logged in
- The legal content
- Nothing else — clean, distraction-free reading
