import React, { type ReactNode } from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";

interface ServiceCardProps {
  icon: ReactNode;
  name: string;
  price: string;
  pricingModel?: "fixed" | "monthly" | "hourly" | "per_unit";
  description: string;
  deliverables: string[];
  isAddon?: boolean;
  delay?: number;
  onNameEdit?: (value: string) => void;
  onDescriptionEdit?: (value: string) => void;
}

const MODEL_LABELS: Record<string, string> = {
  fixed: "",
  monthly: "/mo",
  hourly: "/hr",
  per_unit: "/unit",
};

export function ServiceCard({
  icon,
  name,
  price,
  pricingModel,
  description,
  deliverables,
  isAddon = false,
  delay = 0,
}: ServiceCardProps) {
  const brand = useBrand();
  const suffix = pricingModel ? MODEL_LABELS[pricingModel] || "" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="group relative bg-white border border-[#EBEBEB] rounded-2xl p-8 transition-all duration-300"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${brand.primaryColor}4D`;
        e.currentTarget.style.boxShadow = `0 10px 30px -10px ${brand.primaryColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#EBEBEB";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Price badge */}
      <div className="absolute top-6 right-6">
        <span
          className="inline-block text-white px-4 py-1.5 rounded-full"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            backgroundColor: brand.darkColor,
          }}
        >
          {price}
          {suffix && (
            <span style={{ fontWeight: 400, opacity: 0.6 }}>{suffix}</span>
          )}
        </span>
      </div>

      {/* Add-on badge */}
      {isAddon && (
        <span
          className="inline-block px-3 py-1 rounded-full mb-4 uppercase tracking-[0.15em]"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            backgroundColor: `${brand.primaryColor}15`,
            color: brand.primaryColor,
          }}
        >
          Add-on
        </span>
      )}

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl border flex items-center justify-center mb-5 transition-all duration-300"
        style={{
          backgroundColor: "#FAFAFA",
          borderColor: "#EBEBEB",
          color: brand.darkColor,
        }}
      >
        {icon}
      </div>

      {/* Name & description */}
      <h3
        className="mb-3 tracking-tight"
        style={{
          fontSize: "20px",
          fontWeight: 700,
          lineHeight: 1.2,
          color: brand.darkColor,
        }}
      >
        {name}
      </h3>
      <p
        className="text-[#888] mb-6"
        style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6 }}
      >
        {description}
      </p>

      {/* Deliverables */}
      <div className="border-t border-[#F0F0F0] pt-5">
        <span
          className="block text-[#BBB] uppercase tracking-[0.2em] mb-3"
          style={{ fontSize: "10px", fontWeight: 600 }}
        >
          Deliverables
        </span>
        <ul className="space-y-2">
          {deliverables.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: brand.primaryColor }}
              />
              <span
                className="text-[#555]"
                style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5 }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
