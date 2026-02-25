import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";

interface TimelineStepProps {
  number: number;
  name: string;
  duration: string;
  description?: string;
  isLast?: boolean;
  delay?: number;
}

export function TimelineStep({
  number,
  name,
  duration,
  description,
  isLast = false,
  delay = 0,
}: TimelineStepProps) {
  const brand = useBrand();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex gap-6"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>
            {String(number).padStart(2, "0")}
          </span>
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[40px]"
            style={{ backgroundColor: `${brand.primaryColor}30` }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-8 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-3 mb-2">
          <h3
            className="tracking-tight"
            style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }}
          >
            {name}
          </h3>
          <span
            className="inline-block rounded-full px-3 py-0.5"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: `${brand.primaryColor}15`,
              color: brand.primaryColor,
            }}
          >
            {duration}
          </span>
        </div>
        {description && (
          <p
            className="text-[#888] max-w-md"
            style={{
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
