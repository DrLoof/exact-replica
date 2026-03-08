# Lovable Prompt: Improved Signup Flow for Higher Conversion

## The Problem

Right now, the signup gate appears when a guest user clicks "Save as Draft" or "Share & Send" on their first proposal. At that point, the user has:
1. Scanned their website
2. Reviewed their services, testimonials, and differentiators
3. Selected a client and services
4. Seen a generated proposal

But they haven't had a chance to **edit** the proposal or **feel** the product. The proposal is a best guess from a website scrape — it might have wrong prices, missing services, or a generic summary. Asking for signup at this moment means the user is committing based on a first draft, not a finished product.

## The New Flow

Let the user experience the full proposal editing before asking them to sign up. The gate moves from "save/share" to "share/send/export" — the moment they want to deliver the proposal to a real client.

### What guests CAN do (no signup required):
- Scan their website and complete onboarding
- Create their first proposal
- **Edit the proposal in the full editor** — change the title, rewrite the executive summary, adjust prices, remove/reorder services, edit phase descriptions
- **Write a new version** of the executive summary
- See how the proposal looks as a client would see it
- Save their work (auto-saved to localStorage, persisted across browser sessions)

### What guests CANNOT do (requires signup):
- **Share the proposal** (copy link, send email)
- **Export/download** the proposal as PDF
- **Create a second proposal**
- **Access the dashboard** with pipeline metrics
- **Access settings** to customize branding, terms, testimonials
- **Access the clients, services, or bundles management pages**

### Why this works:
The more time someone spends editing a proposal, the more invested they are. By the time they want to share it with a real client, they've customized it, they feel ownership, and creating an account feels like saving their work — not paying an entrance fee. The signup wall appears at the moment of highest intent.

---

## Implementation Details

### 1. Make the Guest Proposal Preview fully editable

The current `GuestProposalPreview.tsx` already allows editing the title and executive summary (stored in local state). Expand this to match the full `ProposalEditor.tsx` editing experience:

**Add these editing capabilities to the guest preview:**
- Edit service descriptions and deliverables (save to localStorage)
- Edit timeline phase names, durations, and descriptions (save to localStorage)
- Hide/show sections (already works)
- Edit the "About" text in Why Us section (save to localStorage)
- "Write new version" for the executive summary (call the edge function — this works without auth since it uses the Supabase anon key)
- Edit prices inline (save to localStorage)

**Save all edits to localStorage** under the existing `propopad_guest_proposal` key. Update the stored object whenever the user makes a change. This means if they close the browser and come back, their edits are preserved.

**Add auto-save indicator** in the top bar: a small "All changes saved" text that appears briefly after each edit. This builds trust — the user knows their work isn't lost.

### 2. Add a Timeline section to the guest preview

The current guest preview is missing the Timeline section (it goes from Scope of Services directly to Investment). The full editor has it. Add the Timeline section to `GuestProposalPreview.tsx` between Scope of Services and Investment, showing the generated phases with editable names, durations, and descriptions.

The phases should come from the `propopad_guest_proposal` localStorage data. If the proposal was created with the timeline generation edge function, the phases will already be there.

### 3. Move the signup gate to share/export/second-proposal actions

**In `GuestProposalPreview.tsx`:**

Change the "Save as Draft" button behavior:
- Currently: triggers `requireSignup()`  
- New behavior: save current state to localStorage, show toast "Draft saved", and do NOT trigger signup

Change the "Share & Send" button behavior:
- Keep triggering `requireSignup()` — this is the primary conversion point

Add a "Download PDF" option that also triggers `requireSignup()`.

**In the sidebar navigation / header:**

When a guest user tries to navigate to any of these pages, show the signup gate instead:
- `/dashboard`
- `/proposals` (the list page)
- `/clients`
- `/services`
- `/bundles`
- `/settings/*`
- `/proposals/new` (creating a second proposal)

The "Back" button in the guest preview should go to the homepage or the onboarding flow, NOT to the proposal creation page. The user's one proposal is their playground — they shouldn't need to go back to creation.

### 4. Update the signup gate messaging

The current signup gate says: "Create your account to save" / "Your agency profile is ready. Sign up to save it and start sending proposals."

**Change the messaging based on the trigger:**

**When triggered by "Share & Send":**
- Headline: "Create your free account to send this proposal"
- Subtitle: "Your proposal is ready. Sign up to share it with {clientName} and start tracking responses."
- Button: "Create account & send"

**When triggered by "Download PDF":**
- Headline: "Create your free account to download"
- Subtitle: "Sign up to export this proposal as a PDF and start sending to clients."
- Button: "Create account & download"

**When triggered by navigating to dashboard/other pages:**
- Headline: "Create your free account"
- Subtitle: "Sign up to access your dashboard, manage clients, and create more proposals."
- Button: "Create account"

**When triggered by "Create new proposal" (second proposal):**
- Headline: "Create your free account to make more proposals"
- Subtitle: "You've built a great first proposal. Sign up to create unlimited proposals and manage your pipeline."
- Button: "Create account"

Pass a `trigger` prop to `SignupGate` to determine which message to show:

```
type SignupTrigger = 'share' | 'download' | 'navigate' | 'new_proposal';

<SignupGate 
  trigger="share" 
  clientName={clientName}
  onAuthenticated={handlePostSignup} 
  onCancel={() => setShowSignupGate(false)} 
/>
```

### 5. Add a gentle conversion nudge in the guest editor

After the user has been editing for 2+ minutes or has made 3+ edits, show a subtle, non-blocking banner at the bottom of the proposal:

"Looking good. Create a free account to share this with your client. → Sign up"

Style it as a thin bar pinned to the bottom of the viewport — dark background (#2A2118), warm text, small "Sign up" link in brass color. Include a small "×" to dismiss it. Once dismissed, don't show it again (store in localStorage).

This is NOT a modal or popup — it's a gentle reminder that doesn't block editing.

### 6. Show a "Powered by Propopad" watermark in guest mode

In the guest preview, add a small watermark in the bottom-right corner of each page: "Preview — Powered by Propopad". This serves two purposes:
- Reminds the user this is a preview, not a final deliverable
- Creates subtle urgency to sign up (to remove the watermark)

Style: light gray text, 10px, positioned in the bottom-right margin area. Only visible in guest mode — remove it in the real editor and public proposal views.

### 7. Handle the "Back" navigation for guests

The current "Back" button in the guest preview navigates to `/proposals/new?guest=true` — which takes the user back to the creation page. This is confusing because:
- They might accidentally create a new proposal and lose their edits
- The creation page in guest mode still has all their previous selections

**Change:** The "Back" button should navigate to `/` (homepage). If they want to re-edit, they can access their preview directly. Store a flag in localStorage (`propopad_has_guest_proposal: true`) and check it on the homepage — if it exists, show a "Continue editing your proposal →" link.

### 8. Homepage: show "Continue" for returning guests

On the `Home.tsx` page, check if `propopad_guest_proposal` exists in localStorage. If it does, show a prominent banner near the top of the hero section:

"You have an unfinished proposal. Continue editing →"

Clicking it navigates to `/proposals/preview`. This handles the case where someone starts a proposal, closes the tab, and comes back later.

---

## What NOT to change

- Don't change the onboarding scan flow — it works well
- Don't change the `ProposalNew.tsx` creation flow — it's already functional
- Don't change the edge functions — they work
- Don't change the post-signup migration logic in `handlePostSignup` — it correctly creates the real proposal and agency data
- Don't change the full editor (`ProposalEditor.tsx`) — that's for authenticated users only
- Don't change the public proposal view (`PublicProposal.tsx`) — that's client-facing

## Summary of changes

| File | Change |
|------|--------|
| `GuestProposalPreview.tsx` | Add full editing (services, timeline, prices, phases). Save all edits to localStorage. Add auto-save indicator. Add Timeline section. Move signup gate to share/export only. Add gentle conversion nudge. Add preview watermark. Change Back button to go to homepage. |
| `SignupGate.tsx` | Accept `trigger` prop. Show context-specific headline, subtitle, and button text based on trigger type. |
| `Home.tsx` | Check for existing guest proposal in localStorage. Show "Continue editing" banner if found. |
| `App.tsx` / `ProtectedRoute.tsx` | When guest tries to access dashboard/settings/proposals list, show SignupGate instead of redirect. |

## Expected conversion path

1. User lands on homepage → "Create your first proposal in under 3 minutes"
2. Scans website → sees their brand, services, testimonials auto-detected
3. Reviews and adjusts in onboarding → picks services, approves testimonials
4. Selects a client, picks services, builds proposal → sees the generation progress screen
5. **Lands in the editable preview** → sees a professional proposal with their branding, executive summary, services, timeline, pricing
6. **Spends 2-5 minutes editing** → fixes prices, tweaks the summary, adjusts timeline, hides a section they don't need
7. **Clicks "Share & Send"** → signup gate appears
8. At this point the user has invested real effort, the proposal looks like theirs, and signup feels like saving their work — not starting over

The key insight: **the value is demonstrated before the ask.** The user isn't signing up for a promise — they're signing up to keep something they've already built.
