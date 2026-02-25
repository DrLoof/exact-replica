import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";

interface SectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  number,
  title,
  subtitle,
  align = "left",
}: SectionHeaderProps) {
  const brand = useBrand();
  const isCenter = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`mb-14 ${isCenter ? "text-center" : ""}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div
        className={`flex items-start gap-6 ${isCenter ? "justify-center" : ""}`}
      >
        <span
          className="tracking-tight block shrink-0"
          style={{
            fontSize: "clamp(48px, 6vw, 80px)",
            fontWeight: 700,
            lineHeight: 0.85,
            color: brand.primaryColor,
          }}
        >
          {number}
        </span>
        <div
          className={`${isCenter ? "" : "border-l-2 pl-6"} pt-1`}
          style={
            isCenter ? {} : { borderColor: brand.primaryColor }
          }
        >
          <h2
            className="tracking-tight"
            style={{
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 700,
              lineHeight: 1.1,
              color: brand.darkColor,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-[#888] mt-2 max-w-xl"
              style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.6 }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
