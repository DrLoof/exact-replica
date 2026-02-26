import React, { useState } from "react";
import { motion } from "motion/react";

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
      // Calculate subtotal from price strings
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
    return <span className="text-[#0A0A0A] shrink-0 ml-4" style={{ fontSize: "16px", fontWeight: 600 }}>{price}</span>;
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        defaultValue={numericValue}
        onBlur={(e) => { setEditing(false); const v = parseFloat(e.target.value); if (!isNaN(v)) onEdit(v); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
        className="w-28 rounded border border-[#DDD] bg-white px-2 py-1 text-right text-[15px] font-semibold text-[#0A0A0A] outline-none focus:border-[#fc956e] print:hidden"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="text-[#0A0A0A] shrink-0 ml-4 cursor-pointer hover:underline hover:decoration-dashed hover:underline-offset-4 print:no-underline"
      style={{ fontSize: "16px", fontWeight: 600 }}
      title="Click to edit price"
    >
      {price}
    </span>
  );
}

export function PricingSummary({
  items,
  groups,
  total,
  totalBreakdown,
  paymentTerms,
  validUntil,
  bundleSavings,
  brandColor = "#fc956e",
  onPriceEdit,
}: PricingSummaryProps) {
  const uniqueModels = new Set(items.map((i) => i.model || "fixed"));
  const isMixed = uniqueModels.size > 1;
  const displayGroups = groups || (isMixed ? autoGroupItems(items) : null);

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
          <span className="text-[#999] uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600 }}>
            Service
          </span>
          <span className="text-[#999] uppercase tracking-[0.2em]" style={{ fontSize: "11px", fontWeight: 600 }}>
            Investment
          </span>
        </div>

        {displayGroups
          ? displayGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <div className="px-8 py-3 bg-[#FAFAFA]/60 border-b border-[#F0F0F0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: brandColor }} />
                    <div>
                      <span className="text-[#0A0A0A] block" style={{ fontSize: "13px", fontWeight: 700 }}>
                        {group.label}
                      </span>
                      <span className="text-[#BBB] block" style={{ fontSize: "11px", fontWeight: 400 }}>
                        {group.sublabel}
                      </span>
                    </div>
                  </div>
                </div>

                {group.items.map((item, idx) => {
                  const originalIdx = items.indexOf(item);
                  return (
                  <div
                    key={idx}
                    className={`px-8 py-5 flex items-center justify-between ${
                      idx < group.items.length - 1 ? "border-b border-[#F0F0F0]" : ""
                    } hover:bg-[#FAFAFA]/50 transition-colors`}
                  >
                    <div className="pl-4">
                      <span className="text-[#0A0A0A] block" style={{ fontSize: "16px", fontWeight: 600 }}>
                        {item.service}
                        {item.isAddon && (
                          <span className="ml-2 text-[#999] uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600 }}>
                            Add-on
                          </span>
                        )}
                        {item.isBundled && (
                          <span className="ml-2 uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600, color: brandColor }}>
                            Bundled
                          </span>
                        )}
                      </span>
                      {item.note && (
                        <span className="text-[#BBB] block mt-0.5" style={{ fontSize: "13px", fontWeight: 400 }}>
                          {item.note}
                        </span>
                      )}
                    </div>
                    <EditablePrice price={item.price} onEdit={onPriceEdit ? (v) => onPriceEdit(originalIdx, v) : undefined} />
                  </div>
                  );
                })}

                {group.subtotal && (
                  <div className="px-8 py-3 bg-[#FAFAFA] border-t border-[#EBEBEB] flex items-center justify-between">
                    <span className="text-[#999] uppercase tracking-[0.15em] pl-4" style={{ fontSize: "11px", fontWeight: 600 }}>
                      Subtotal — {group.label}
                    </span>
                    <span className="text-[#0A0A0A]" style={{ fontSize: "16px", fontWeight: 700 }}>
                      {group.subtotal}
                    </span>
                  </div>
                )}

                {gIdx < displayGroups.length - 1 && <div className="border-b-2 border-[#EBEBEB]" />}
              </div>
            ))
          : items.map((item, idx) => (
              <div
                key={idx}
                className={`px-8 py-5 flex items-center justify-between ${
                  idx < items.length - 1 ? "border-b border-[#F0F0F0]" : ""
                } hover:bg-[#FAFAFA]/50 transition-colors`}
              >
                <div>
                  <span className="text-[#0A0A0A] block" style={{ fontSize: "16px", fontWeight: 600 }}>
                    {item.service}
                    {item.isAddon && (
                      <span className="ml-2 text-[#999] uppercase tracking-wider" style={{ fontSize: "10px", fontWeight: 600 }}>
                        Add-on
                      </span>
                    )}
                  </span>
                  {item.note && (
                    <span className="text-[#BBB] block mt-0.5" style={{ fontSize: "13px", fontWeight: 400 }}>
                      {item.note}
                    </span>
                  )}
                </div>
                <EditablePrice price={item.price} onEdit={onPriceEdit ? (v) => onPriceEdit(idx, v) : undefined} />
              </div>
            ))}

        {/* Bundle savings */}
        {bundleSavings && (
          <div
            className="px-8 py-4 flex items-center justify-between border-t border-[#EBEBEB]"
            style={{ backgroundColor: `${brandColor}08` }}
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
              <span className="text-[#555]" style={{ fontSize: "14px", fontWeight: 500 }}>
                {bundleSavings.bundleName} bundle discount
              </span>
              <span className="text-[#BBB] line-through" style={{ fontSize: "13px", fontWeight: 400 }}>
                {bundleSavings.individualTotal}
              </span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: brandColor }}>
              {bundleSavings.savings}
            </span>
          </div>
        )}

        {/* Total bar */}
        <div className="bg-[#0A0A0A] px-8 py-6 flex items-center justify-between">
          <div>
            <span className="text-white/60 uppercase tracking-[0.2em] block" style={{ fontSize: "12px", fontWeight: 500 }}>
              Total Investment
            </span>
            {totalBreakdown && (
              <span className="text-white/40 block mt-1" style={{ fontSize: "13px", fontWeight: 400 }}>
                {totalBreakdown}
              </span>
            )}
          </div>
          <span className="text-white" style={{ fontSize: "32px", fontWeight: 700 }}>
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
          className="mt-8 bg-[#FAFAFA] rounded-2xl p-8 border border-[#EBEBEB]"
        >
          <h4 className="text-[#0A0A0A] mb-4 uppercase tracking-[0.15em]" style={{ fontSize: "12px", fontWeight: 600 }}>
            Payment Terms
          </h4>
          <div className="space-y-3">
            {paymentTerms.map((term, idx) => {
              const termText = typeof term === "string" ? term : term.label;
              const termAmount = typeof term === "string" ? undefined : term.amount;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: `${brandColor}15`,
                      color: brandColor,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 flex items-start justify-between gap-4">
                    <span className="text-[#555]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}>
                      {termText}
                    </span>
                    {termAmount && (
                      <span className="text-[#0A0A0A] shrink-0" style={{ fontSize: "14px", fontWeight: 600 }}>
                        {termAmount}
                      </span>
                    )}
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
            <span style={{ fontWeight: 600, color: brandColor }}>
              {validUntil}
            </span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
