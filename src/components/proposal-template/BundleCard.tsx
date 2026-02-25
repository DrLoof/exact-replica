import React from "react";
import { motion } from "motion/react";
import { Package } from "lucide-react";

interface BundleCardProps {
  name: string;
  tagline?: string;
  includedServices: string[];
  bundlePrice: string;
  individualPrice?: string;
  savings?: string;
  description?: string;
  delay?: number;
  brandColor?: string;
}

export function BundleCard({
  name,
  tagline,
  includedServices,
  bundlePrice,
  individualPrice,
  savings,
  description,
  delay = 0,
  brandColor = "#fc956e",
}: BundleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      className="relative rounded-2xl overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div
        className="p-8 lg:p-10"
        style={{ backgroundColor: brandColor }}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <span
                className="block text-white/60 uppercase tracking-[0.2em] mb-1"
                style={{ fontSize: "10px", fontWeight: 600 }}
              >
                Package
              </span>
              <h3
                className="text-white tracking-tight"
                style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.1 }}
              >
                {name}
              </h3>
            </div>
          </div>

          {savings && (
            <div className="bg-white text-center px-4 py-2 rounded-xl shrink-0">
              <span
                style={{ fontSize: "14px", fontWeight: 700, color: brandColor }}
              >
                {savings}
              </span>
            </div>
          )}
        </div>

        {tagline && (
          <p
            className="text-white/70 mb-8 max-w-xl"
            style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.6 }}
          >
            {tagline}
          </p>
        )}

        {description && (
          <p
            className="text-white/60 mb-8 max-w-xl"
            style={{
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.7,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {description}
          </p>
        )}

        <div className="mb-8">
          <span
            className="block text-white/40 uppercase tracking-[0.2em] mb-3"
            style={{ fontSize: "10px", fontWeight: 600 }}
          >
            Included Services
          </span>
          <div className="flex flex-wrap gap-2">
            {includedServices.map((service, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1.5 rounded-full"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {service}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-4 pt-6 border-t border-white/15">
          <div>
            <span
              className="block text-white/40 uppercase tracking-[0.2em] mb-1"
              style={{ fontSize: "10px", fontWeight: 600 }}
            >
              Bundle Price
            </span>
            <span
              className="text-white"
              style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1 }}
            >
              {bundlePrice}
            </span>
          </div>
          {individualPrice && (
            <div className="pb-1">
              <span
                className="text-white/40 line-through"
                style={{ fontSize: "16px", fontWeight: 400 }}
              >
                {individualPrice}
              </span>
              <span
                className="text-white/40 ml-2"
                style={{ fontSize: "12px", fontWeight: 400 }}
              >
                if purchased individually
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
