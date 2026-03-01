## Fix Testimonial UX — Approval Visibility, Deduplication, and Empty Fields

---

## 1. MAKE TESTIMONIAL APPROVAL MORE PROMINENT

The "Approve for proposals" checkbox is too easy to miss. Users will skim past it, end up with zero testimonials in their proposals, and not understand why.

### Replace individual checkboxes with a toggle switch + visual state change

Instead of a small checkbox at the bottom of each card, use a toggle switch that changes the ENTIRE card's appearance:

**Unapproved state (default):**
- Card background: `#FFFFFF` (white)
- Subtle dashed border: `1px dashed #EEEAE3`
- Toggle switch at top-right: OFF position, muted gray
- Small label next to toggle: "Not approved" in `text-[11px]` muted

**Approved state (after toggling):**
- Card background: `#FAFCFA` (very subtle green tint)
- Solid border: `1px solid #C5DBC9` (soft green)
- Toggle switch: ON position, green `#6E9A7A`
- Small label: "✓ Approved" in `text-[11px]` green `#6E9A7A`
- Subtle green checkmark icon appears on the quote mark icon

The visual difference between approved and unapproved should be immediately obvious when scanning the page. The user should be able to see at a glance: "2 of 4 testimonials are approved."

### Add a summary line above the testimonials

Above the testimonial cards, show:
```
TESTIMONIALS                                    4 found

ℹ We found these on your website. Confirm you have permission 
  to use each one in proposals.

  0 of 4 approved for proposals
```

The "0 of 4 approved" text updates in real-time as the user toggles each one. When at least 1 is approved, it turns green: "2 of 4 approved for proposals ✓"

### If user proceeds with 0 approved

If the user clicks "Looks good — create my first proposal" and no testimonials have been approved, show a subtle toast notification:
```
No testimonials approved — you can add them later in Settings.
```
Don't block the user — just inform them. Testimonials are optional.

---

## 2. FIX DUPLICATE QUOTES

The scraper sometimes assigns the same quote to multiple people (e.g., "PragoMedia's team of talented and passionate professionals did an excellent job..." appears twice with different names).

### Add deduplication logic:

After the AI extracts testimonials and before displaying them, run a simple deduplication check:

```javascript
// Remove testimonials with identical or near-identical quote text
function deduplicateTestimonials(testimonials) {
  const seen = new Set();
  return testimonials.filter(t => {
    // Normalize: lowercase, trim, remove extra whitespace
    const normalized = t.quote_text.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check if we've seen a quote that's >85% similar
    for (const existing of seen) {
      if (similarity(normalized, existing) > 0.85) {
        return false; // Skip duplicate
      }
    }
    
    seen.add(normalized);
    return true;
  });
}
```

For a simpler approach, just check if the first 50 characters of two quotes match — that catches most duplicates.

### Also add this instruction to the AI filtering prompt:

```
If multiple people are attributed the exact same quote text, only 
include it once — use the attribution with the most complete 
information (name + title + company).
```

---

## 3. FIX EMPTY "TITLE" PLACEHOLDER

When the scraper can't find a person's job title, it currently shows the word "Title" in gold/muted text. This looks like broken data, not a placeholder.

### Fix:

- If `client_title` is null or empty: don't show the title field at all. Just show: `Name · Company`
- If both `client_title` AND `client_company` are empty: just show the name
- The field should be editable — if the user clicks on the name/attribution area, they can fill in the title manually

**Layout for attribution line:**

When all fields present:
```
Robin Westberg · Owner & Founder · GörDetMedRW
```

When title is missing:
```
Constantine La · iVisa
```

When both title and company are missing:
```
Denis A
```

Use `·` (middle dot) as separator, `text-[13px]` in `#4A3F32` (espresso soft). The whole attribution line should be clickable/editable.

---

## 4. KPI/METRIC DISPLAY

The metric display is working (Denis A shows "📈 Increased traffic and conversions"). Two improvements:

### Only show metrics when they contain actual numbers

Qualitative descriptions like "Increased traffic and conversions" aren't strong social proof. Only show the metric badge when it contains a specific number:
- ✅ Show: "+265% ROAS", "+55% organic traffic", "15,000 new visitors/month"
- ❌ Don't show: "Increased traffic and conversions", "Great results", "Improved performance"

Add this to the AI extraction prompt:
```
For metric_value: only include if there is a specific number or 
percentage. Examples: "+265%", "15,000", "3x". 
Do NOT include vague descriptions like "increased" or "improved".
If no specific metric exists, set metric_value to null.
```

### Metric badge styling

When a metric IS shown:
```
📈 +265% Facebook ROAS
```
Style: `text-[12px] font-medium` in `#6E9A7A` (green), with a small chart icon. Background: `#F0F5F1` rounded pill.

When no metric: don't show anything — no empty badge, no placeholder.
