import React, { type ReactNode } from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";

interface TextContentProps {
  children: ReactNode;
  dropCap?: boolean;
  columns?: 1 | 2;
}

export function TextContent({
  children,
  dropCap = false,
  columns = 1,
}: TextContentProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';

  const bodyFont = isModern ? "'Outfit', sans-serif" : "'Inter', sans-serif";
  const bodyColor = isModern ? "#6B7280" : "#555";
  const dropCapFont = isModern ? "'Fraunces', serif" : "'Space Grotesk', sans-serif";
  const dropCapColor = isModern ? "#34D399" : brand.primaryColor;
  const dropCapSize = isModern ? "64px" : "56px";
  const dropCapWeight = isModern ? 800 : 700;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={columns === 2 ? "columns-1 md:columns-2 gap-10" : ""}
      style={{
        fontFamily: bodyFont,
        fontSize: "15px",
        fontWeight: 400,
        lineHeight: 1.8,
        color: bodyColor,
      }}
    >
      {dropCap ? (
        <div>
          <span
            className="float-left mr-3 mt-1"
            style={{
              fontFamily: dropCapFont,
              fontSize: dropCapSize,
              fontWeight: dropCapWeight,
              lineHeight: 0.85,
              color: dropCapColor,
            }}
          >
            {typeof children === "string" ? children.charAt(0) : ""}
          </span>
          {typeof children === "string" ? children.slice(1) : children}
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}
