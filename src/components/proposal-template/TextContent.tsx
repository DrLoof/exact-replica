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
  children, dropCap = false, columns = 1,
}: TextContentProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;

  const bodyFont = isSoft ? "'DM Sans', sans-serif" : isElegant ? "'DM Sans', sans-serif" : isModern ? "'Outfit', sans-serif" : "'Inter', sans-serif";
  const bodyColor = isSoft ? template.colors.textBody : isElegant ? template.colors.textBody : isModern ? "#6B7280" : "#555";
  const dropCapFont = isSoft ? "'DM Sans', sans-serif" : isElegant ? "'Fraunces', serif" : isModern ? "'Fraunces', serif" : "'Space Grotesk', sans-serif";
  const dropCapColor = isSoft ? accent : isElegant ? accent : isModern ? accent : brand.primaryColor;
  const dropCapSize = isSoft ? "60px" : isElegant ? "60px" : isModern ? "64px" : "56px";
  const dropCapWeight = isSoft ? 600 : isElegant ? 600 : isModern ? 800 : 700;
  const lineHeight = isSoft ? 1.85 : isElegant ? 1.85 : 1.8;

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
        lineHeight,
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
