import React, { type ReactNode } from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={columns === 2 ? "columns-1 md:columns-2 gap-10" : ""}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "15px",
        fontWeight: 400,
        lineHeight: 1.8,
        color: "#555",
      }}
    >
      {dropCap ? (
        <div>
          <span
            className="float-left mr-3 mt-1"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "56px",
              fontWeight: 700,
              lineHeight: 0.85,
              color: brand.primaryColor,
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
