import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import * as LucideIcons from "lucide-react";

interface WhyUsCardProps {
  title: string;
  description: string;
  statValue?: string;
  statLabel?: string;
  icon?: string;
  delay?: number;
}

export function WhyUsCard({
  title,
  description,
  statValue,
  statLabel,
  icon,
  delay = 0,
}: WhyUsCardProps) {
  const brand = useBrand();

  // Dynamically resolve icon from lucide
  const IconComponent = icon && (LucideIcons as any)[icon]
    ? (LucideIcons as any)[icon]
    : LucideIcons.Star;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="bg-white border border-[#EBEBEB] rounded-2xl p-8 transition-all duration-300"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${brand.primaryColor}4D`;
        e.currentTarget.style.boxShadow = `0 8px 24px -8px ${brand.primaryColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#EBEBEB";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Stat badge */}
      {statValue && (
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-block rounded-xl px-4 py-2"
            style={{
              backgroundColor: brand.primaryColor,
              color: "#FFFFFF",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {statValue}
          </span>
          {statLabel && (
            <span className="text-[#999]" style={{ fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {statLabel}
            </span>
          )}
        </div>
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{
          backgroundColor: `${brand.primaryColor}15`,
          color: brand.primaryColor,
        }}
      >
        <IconComponent size={20} />
      </div>

      <h3
        className="tracking-tight mb-2"
        style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }}
      >
        {title}
      </h3>
      <p
        className="text-[#888]"
        style={{
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: 1.6,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}
