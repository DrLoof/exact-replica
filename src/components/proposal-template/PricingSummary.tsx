import React, { useState } from "react";
import { motion } from "motion/react";
import { useTemplate } from "./TemplateProvider";

type PricingModel = "fixed" | "monthly" | "hourly" | "per_unit";

interface PricingItem {
  service: string;
  price: string;
  note?: string;
  model: PricingModel;
  isAddon?: boolean;
  isBundled?: boolean;
}

interface PricingGroup {
  label: string;
  sublabel: string;
  items: PricingItem[];
  subtotal: string;
}

interface BundleSavings {
  bundleName: string;
  individualTotal: string;
  bundlePrice: string;
  savings: string;
}

interface PaymentTerm {
  label: string;
  amount?: string;
}

interface PricingSummaryProps {
  items: PricingItem[];
  groups?: PricingGroup[];
  total: string;
  totalBreakdown?: string;
  paymentTerms?: (string | PaymentTerm)[];
  validUntil?: string;
  bundleSavings?: BundleSavings;
  brandColor?: string;
  onPriceEdit?: (index: number, newPrice: number) => void;
}

const GROUP_CONFIG: Record<PricingModel, { label: string; sublabel: string; order: number }> = {
  fixed:    { label: "Project Fees", sublabel: "One-time", order: 1 },
  monthly:  { label: "Monthly Retainers", sublabel: "Recurring", order: 2 },
  hourly:   { label: "Estimated Costs", sublabel: "Based on actual hours", order: 3 },
  per_unit: { label: "Per-Deliverable", sublabel: "Billed on completion", order: 4 },
};

function autoGroupItems(items: PricingItem[]): PricingGroup[] {
  const grouped: Record<string, PricingItem[]> = {};
  items.forEach((item) => {
    const model = item.model || "fixed";
    if (!grouped[model]) grouped[model] = [];
    grouped[model].push(item);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => (GROUP_CONFIG[a as PricingModel]?.order ?? 99) - (GROUP_CONFIG[b as PricingModel]?.order ?? 99))
    .map(([model, groupItems]) => {
      const config = GROUP_CONFIG[model as PricingModel] || { label: model, sublabel: "" };
      const numericSum = groupItems.reduce((sum, item) => {
        const num = parseFloat(item.price.replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);
      const suffix = model === 'monthly' ? '/mo' : model === 'hourly' ? '/hr' : '';
      const currency = groupItems[0]?.price.match(/^[^0-9]*/)?.[0] || '$';
      return {
        label: config.label,
        sublabel: config.sublabel,
        items: groupItems,
        subtotal: `${currency}${numericSum.toLocaleString()}${suffix}`,
      };
    });
}

function EditablePrice({ price, onEdit }: { price: string; onEdit?: (newPrice: number) => void }) {
  const [editing, setEditing] = useState(false);
  const numericValue = parseFloat(price.replace(/[^0-9.-]/g, ''));

  if (!onEdit) {
    return <span className="shrink-0 ml-4" style={{ fontSize: "16px", fontWeight: 600 }}>{price}</span>;
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" defaultValue={numericValue}
        onBlur={(e) => { setEditing(false); const v = parseFloat(e.target.value); if (!isNaN(v)) onEdit(v); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
        className="w-28 rounded border border-[#DDD] bg-white px-2 py-1 text-right text-[15px] font-semibold outline-none focus:border-[#fc956e] print:hidden"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)}
      className="shrink-0 ml-4 cursor-pointer hover:underline hover:decoration-dashed hover:underline-offset-4 print:no-underline"
      style={{ fontSize: "16px", fontWeight: 600 }} title="Click to edit price">
      {price}
    </span>
  );
}

export function PricingSummary({
  items, groups, total, totalBreakdown, paymentTerms, validUntil, bundleSavings, brandColor = "#fc956e", onPriceEdit,
}: PricingSummaryProps) {
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;
  const uniqueModels = new Set(items.map((i) => i.model || "fixed"));
  const isMixed = uniqueModels.size > 1;
  const displayGroups = groups || (isMixed ? autoGroupItems(items) : null);

  if (isSoft) {
    const border = template.colors.border;
    const bg = template.colors.background;
    const muted = template.colors.textMuted;
    const faint = template.colors.textFaint;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `1px solid ${border}` }}>
          <div className="px-8 py-4 flex items-center justify-between" style={{ background: bg }}>
            <span className="uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600, color: template.colors.textBody }}>Service</span>
            <span className="uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600, color: template.colors.textBody }}>Investment</span>
          </div>
          {(displayGroups ? displayGroups.flatMap(g => g.items) : items).map((item, idx) => {
            const originalIdx = items.indexOf(item);
            return (
              <div key={idx} className="px-8 py-5 flex items-center justify-between transition-colors"
                style={{ borderTop: `1px solid ${border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${bg}4D`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <span className="block" style={{ fontSize: "16px", fontWeight: 500, color: dark }}>
                    {item.service}
                    {item.isAddon && <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: accent }}>Add-on</span>}
                    {item.isBundled && <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: accent }}>Bundled</span>}
                  </span>
                  {item.note && <span className="block mt-0.5" style={{ fontSize: "13px", fontWeight: 400, color: faint }}>{item.note}</span>}
                </div>
                <span style={{ fontSize: "15px", fontWeight: 600, color: dark }}>
                  {onPriceEdit ? <EditablePrice price={item.price} onEdit={(v) => onPriceEdit(originalIdx, v)} /> : item.price}
                </span>
              </div>
            );
          })}
          {bundleSavings && (
            <div className="px-8 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${border}`, background: `${accent}0D` }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: dark }}>{bundleSavings.bundleName} bundle discount</span>
                <span className="line-through" style={{ fontSize: "13px", fontWeight: 400, color: faint }}>{bundleSavings.individualTotal}</span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: accent }}>{bundleSavings.savings}</span>
            </div>
          )}
          <div className="px-8 py-7 flex items-center justify-between" style={{ background: accent }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.8)" }}>
                Total Investment
              </span>
              {totalBreakdown && (
                <span className="block mt-1" style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>
                  {totalBreakdown}
                </span>
              )}
            </div>
            <span style={{ fontSize: "28px", fontWeight: 600, color: "white" }}>{total}</span>
          </div>
        </div>

        {paymentTerms && paymentTerms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 rounded-2xl p-8"
            style={{ background: "white", border: `1px solid ${border}` }}
          >
            <h4 className="mb-4 uppercase tracking-[0.15em]" style={{ fontSize: "12px", fontWeight: 600, color: dark }}>Payment Terms</h4>
            <div className="space-y-3">
              {paymentTerms.map((term, idx) => {
                const termText = typeof term === "string" ? term : term.label;
                const termAmount = typeof term === "string" ? undefined : term.amount;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ fontSize: "11px", fontWeight: 700, backgroundColor: bg, color: accent }}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 flex items-start justify-between gap-4">
                      <span style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, color: template.colors.textBody }}>{termText}</span>
                      {termAmount && <span className="shrink-0" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{termAmount}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {validUntil && (
          <div className="mt-6 text-center">
            <span style={{ fontSize: "13px", fontWeight: 400, color: muted }}>
              This proposal is valid until{" "}
              <span style={{ fontWeight: 600, color: accent }}>{validUntil}</span>
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  if (isElegant) {
    const border = template.colors.border;
    const accentTint = `${accent}0F`;
    const muted = template.colors.textMuted;
    const faint = template.colors.textFaint;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
          {/* Header */}
          <div className="px-8 py-4 flex items-center justify-between" style={{ background: accentTint }}>
            <span className="uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600, color: muted }}>Service</span>
            <span className="uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600, color: muted }}>Investment</span>
          </div>

          {/* Items */}
          {(displayGroups ? displayGroups.flatMap(g => g.items) : items).map((item, idx) => {
            const originalIdx = items.indexOf(item);
            return (
              <div key={idx} className="px-8 py-5 flex items-center justify-between transition-colors"
                style={{ borderTop: `1px solid ${border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}08`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <span className="block" style={{ fontSize: "16px", fontWeight: 500, color: dark }}>
                    {item.service}
                    {item.isAddon && (
                      <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: secondary }}>Add-on</span>
                    )}
                    {item.isBundled && (
                      <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: accent }}>Bundled</span>
                    )}
                  </span>
                  {item.note && <span className="block mt-0.5" style={{ fontSize: "13px", fontWeight: 400, color: faint }}>{item.note}</span>}
                </div>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", fontWeight: 500, color: dark }}>
                  {onPriceEdit ? <EditablePrice price={item.price} onEdit={(v) => onPriceEdit(originalIdx, v)} /> : item.price}
                </span>
              </div>
            );
          })}

          {/* Bundle savings */}
          {bundleSavings && (
            <div className="px-8 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${border}`, background: `${secondary}0D` }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: secondary }} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: dark }}>{bundleSavings.bundleName} bundle discount</span>
                <span className="line-through" style={{ fontSize: "13px", fontWeight: 400, color: faint }}>{bundleSavings.individualTotal}</span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: secondary }}>{bundleSavings.savings}</span>
            </div>
          )}

          {/* Total row - solid accent */}
          <div className="px-8 py-7 flex items-center justify-between" style={{ background: accent }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)" }}>
                Total Investment
              </span>
              {totalBreakdown && (
                <span className="block mt-1" style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>
                  {totalBreakdown}
                </span>
              )}
            </div>
            <span style={{ fontSize: "32px", fontWeight: 500, color: "white", fontFamily: "'Fraunces', serif" }}>
              {total}
            </span>
          </div>
        </div>

        {/* Payment terms */}
        {paymentTerms && paymentTerms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 rounded-3xl p-8"
            style={{ background: accentTint }}
          >
            <h4 className="mb-4 uppercase tracking-[0.15em]"
              style={{ fontSize: "12px", fontWeight: 600, color: dark }}>
              Payment Terms
            </h4>
            <div className="space-y-3">
              {paymentTerms.map((term, idx) => {
                const termText = typeof term === "string" ? term : term.label;
                const termAmount = typeof term === "string" ? undefined : term.amount;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ fontSize: "11px", fontWeight: 700, backgroundColor: "white", color: accent }}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 flex items-start justify-between gap-4">
                      <span style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, color: template.colors.textBody }}>{termText}</span>
                      {termAmount && <span className="shrink-0" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{termAmount}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Valid until */}
        {validUntil && (
          <div className="mt-6 text-center">
            <span style={{ fontSize: "13px", fontWeight: 400, color: faint }}>
              This proposal is valid until{" "}
              <span style={{ fontWeight: 600, color: accent }}>{validUntil}</span>
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="rounded-3xl overflow-hidden" style={{ border: `2px solid ${template.colors.border}` }}>
          {/* Header row */}
          <div className="px-8 py-4 flex items-center justify-between" style={{ background: `${template.colors.background}` }}>
            <span className="uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600, color: template.colors.textMuted }}>
              Service
            </span>
            <span className="uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600, color: template.colors.textMuted }}>
              Investment
            </span>
          </div>

          {/* Items */}
          {(displayGroups
            ? displayGroups.flatMap(g => g.items)
            : items
          ).map((item, idx) => {
            const originalIdx = items.indexOf(item);
            const dotOpacity = Math.min(0.3 + idx * 0.15, 1);
            return (
              <div key={idx} className="px-8 py-5 flex items-center justify-between"
                style={{ borderTop: `1px dashed ${template.colors.border}` }}>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
                  <div>
                    <span className="block" style={{ fontSize: "16px", fontWeight: 600, color: dark }}>
                      {item.service}
                      {item.isAddon && (
                        <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: secondary }}>
                          Add-on
                        </span>
                      )}
                      {item.isBundled && (
                        <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: accent }}>
                          Bundled
                        </span>
                      )}
                    </span>
                     {item.note && (
                      <span className="block mt-0.5" style={{ fontSize: "13px", fontWeight: 400, color: template.colors.textFaint }}>
                        {item.note}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 700, color: dark }}>
                  {onPriceEdit ? (
                    <EditablePrice price={item.price} onEdit={(v) => onPriceEdit(originalIdx, v)} />
                  ) : item.price}
                </span>
              </div>
            );
          })}

          {/* Bundle savings */}
          {bundleSavings && (
            <div className="px-8 py-4 flex items-center justify-between" style={{ borderTop: `1px dashed ${template.colors.border}`, background: `${secondary}08` }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ background: secondary }} />
                <span style={{ fontSize: "14px", fontWeight: 500, color: dark }}>
                  {bundleSavings.bundleName} bundle discount
                </span>
                <span className="line-through" style={{ fontSize: "13px", fontWeight: 400, color: template.colors.textFaint }}>
                  {bundleSavings.individualTotal}
                </span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: secondary }}>
                {bundleSavings.savings}
              </span>
            </div>
          )}

          {/* Total row - gradient */}
          <div className="px-8 py-7 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)" }}>
                Total Investment
              </span>
              {totalBreakdown && (
                <span className="block mt-1" style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>
                  {totalBreakdown}
                </span>
              )}
            </div>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "white", fontFamily: "'Fraunces', serif" }}>
              {total}
            </span>
          </div>
        </div>

        {/* Payment terms */}
        {paymentTerms && paymentTerms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 rounded-2xl p-8"
            style={{ background: template.colors.cardBackground, border: `2px dashed ${template.colors.border}` }}
          >
            <h4 className="mb-4 uppercase tracking-[0.15em]"
              style={{ fontSize: "12px", fontWeight: 600, color: dark }}>
              Payment Terms
            </h4>
            <div className="space-y-3">
              {paymentTerms.map((term, idx) => {
                const termText = typeof term === "string" ? term : term.label;
                const termAmount = typeof term === "string" ? undefined : term.amount;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ fontSize: "11px", fontWeight: 700, backgroundColor: `${accent}12`, color: accent }}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 flex items-start justify-between gap-4">
                      <span style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, color: "#6B7280" }}>{termText}</span>
                      {termAmount && (
                        <span className="shrink-0" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{termAmount}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Valid until */}
        {validUntil && (
          <div className="mt-6 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${secondary}15`, color: secondary, fontSize: "13px", fontWeight: 600 }}>
              Valid until {validUntil}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  // Classic rendering (unchanged)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="border border-[#EBEBEB] rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="bg-[#FAFAFA] px-8 py-4 flex items-center justify-between border-b border-[#EBEBEB]">
          <span className="text-[#999] uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600 }}>Service</span>
          <span className="text-[#999] uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600 }}>Investment</span>
        </div>

        {displayGroups
          ? displayGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <div className="px-8 py-3 bg-[#FAFAFA]/60 border-b border-[#F0F0F0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: brandColor }} />
                    <div>
                      <span className="text-[#0A0A0A] block" style={{ fontSize: "13px", fontWeight: 700 }}>{group.label}</span>
                      <span className="text-[#BBB] block" style={{ fontSize: "11px", fontWeight: 400 }}>{group.sublabel}</span>
                    </div>
                  </div>
                </div>
                {group.items.map((item, idx) => {
                  const originalIdx = items.indexOf(item);
                  return (
                    <div key={idx}
                      className={`px-8 py-5 flex items-center justify-between ${idx < group.items.length - 1 ? "border-b border-[#F0F0F0]" : ""} hover:bg-[#FAFAFA]/50 transition-colors`}>
                      <div className="pl-4">
                        <span className="text-[#0A0A0A] block" style={{ fontSize: "16px", fontWeight: 600 }}>
                          {item.service}
                          {item.isAddon && <span className="ml-2 text-[#999] uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600 }}>Add-on</span>}
                          {item.isBundled && <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: brandColor }}>Bundled</span>}
                        </span>
                        {item.note && <span className="text-[#BBB] block mt-0.5" style={{ fontSize: "13px", fontWeight: 400 }}>{item.note}</span>}
                      </div>
                      <EditablePrice price={item.price} onEdit={onPriceEdit ? (v) => onPriceEdit(originalIdx, v) : undefined} />
                    </div>
                  );
                })}
                {group.subtotal && (
                  <div className="px-8 py-3 bg-[#FAFAFA] border-t border-[#EBEBEB] flex items-center justify-between">
                    <span className="text-[#999] uppercase tracking-[0.15em] pl-4" style={{ fontSize: "11px", fontWeight: 600 }}>Subtotal — {group.label}</span>
                    <span className="text-[#0A0A0A]" style={{ fontSize: "16px", fontWeight: 700 }}>{group.subtotal}</span>
                  </div>
                )}
                {gIdx < displayGroups.length - 1 && <div className="border-b-2 border-[#EBEBEB]" />}
              </div>
            ))
          : items.map((item, idx) => (
              <div key={idx}
                className={`px-8 py-5 flex items-center justify-between ${idx < items.length - 1 ? "border-b border-[#F0F0F0]" : ""} hover:bg-[#FAFAFA]/50 transition-colors`}>
                <div>
                  <span className="text-[#0A0A0A] block" style={{ fontSize: "16px", fontWeight: 600 }}>
                    {item.service}
                    {item.isAddon && <span className="ml-2 text-[#999] uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600 }}>Add-on</span>}
                  </span>
                  {item.note && <span className="text-[#BBB] block mt-0.5" style={{ fontSize: "13px", fontWeight: 400 }}>{item.note}</span>}
                </div>
                <EditablePrice price={item.price} onEdit={onPriceEdit ? (v) => onPriceEdit(idx, v) : undefined} />
              </div>
            ))}

        {/* Bundle savings */}
        {bundleSavings && (
          <div className="px-8 py-4 flex items-center justify-between border-t border-[#EBEBEB]"
            style={{ backgroundColor: `${brandColor}08` }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
              <span className="text-[#555]" style={{ fontSize: "14px", fontWeight: 500 }}>{bundleSavings.bundleName} bundle discount</span>
              <span className="text-[#BBB] line-through" style={{ fontSize: "13px", fontWeight: 400 }}>{bundleSavings.individualTotal}</span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: brandColor }}>{bundleSavings.savings}</span>
          </div>
        )}

        {/* Total bar */}
        <div className="bg-[#0A0A0A] px-8 py-6 flex items-center justify-between">
          <div>
            <span className="text-white/60 uppercase tracking-[0.2em] block" style={{ fontSize: "12px", fontWeight: 500 }}>Total Investment</span>
            {totalBreakdown && <span className="text-white/40 block mt-1" style={{ fontSize: "13px", fontWeight: 400 }}>{totalBreakdown}</span>}
          </div>
          <span className="text-white" style={{ fontSize: "32px", fontWeight: 700 }}>{total}</span>
        </div>
      </div>

      {/* Payment terms */}
      {paymentTerms && paymentTerms.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 bg-[#FAFAFA] rounded-2xl p-8 border border-[#EBEBEB]">
          <h4 className="text-[#0A0A0A] mb-4 uppercase tracking-[0.15em]" style={{ fontSize: "12px", fontWeight: 600 }}>Payment Terms</h4>
          <div className="space-y-3">
            {paymentTerms.map((term, idx) => {
              const termText = typeof term === "string" ? term : term.label;
              const termAmount = typeof term === "string" ? undefined : term.amount;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ fontSize: "11px", fontWeight: 700, backgroundColor: `${brandColor}15`, color: brandColor }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 flex items-start justify-between gap-4">
                    <span className="text-[#555]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}>{termText}</span>
                    {termAmount && <span className="text-[#0A0A0A] shrink-0" style={{ fontSize: "14px", fontWeight: 600 }}>{termAmount}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Validity */}
      {validUntil && (
        <div className="mt-6 text-center">
          <span className="text-[#BBB]" style={{ fontSize: "13px", fontWeight: 400 }}>
            This proposal is valid until{" "}
            <span style={{ fontWeight: 600, color: brandColor }}>{validUntil}</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
