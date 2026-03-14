import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";

interface HighlightPanelProps {
  items: { label: string; value: string; accent?: boolean }[];
  variant?: "default" | "accent" | "dark";
}

export function HighlightPanel({
  items,
  variant = "default",
}: HighlightPanelProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';

  if (isModern) {
    const modernStyles = {
      default: {
        bg: "white", border: "2px dashed #E5E7EB",
        textColor: "#1E1B4B", labelColor: "#9CA3AF",
        accentColor: "#2563EB", shadow: "none",
      },
      accent: {
        bg: "linear-gradient(135deg, #2563EB, #34D399)", border: "none",
        textColor: "white", labelColor: "rgba(255,255,255,0.6)",
        accentColor: "white", shadow: "0 8px 30px rgba(37,99,235,0.25)",
      },
      dark: {
        bg: "#1E1B4B", border: "none",
        textColor: "white", labelColor: "rgba(255,255,255,0.45)",
        accentColor: "#93C5FD", shadow: "0 8px 30px rgba(30,27,75,0.15)",
      },
    };

    const ms = modernStyles[variant];
    const isGradient = variant === 'accent';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl p-8 lg:p-10"
        style={{
          ...(isGradient ? { background: ms.bg } : { backgroundColor: ms.bg }),
          border: ms.border,
          boxShadow: ms.shadow,
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          {items.map((item, idx) => (
            <div key={idx}>
              <span
                className="block uppercase tracking-[0.2em] mb-2"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: ms.labelColor,
                }}
              >
                {item.label}
              </span>
              <span
                className="block"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "28px",
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: item.accent ? ms.accentColor : ms.textColor,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Classic variant
  const styles = {
    default: {
      bg: "#FAFAFA",
      text: brand.darkColor,
      label: "#999",
      border: "#EBEBEB",
    },
    accent: {
      bg: brand.primaryColor,
      text: "#FFFFFF",
      label: "rgba(255,255,255,0.6)",
      border: "rgba(255,255,255,0.15)",
    },
    dark: {
      bg: brand.darkColor,
      text: "#FFFFFF",
      label: "rgba(255,255,255,0.6)",
      border: "rgba(255,255,255,0.1)",
    },
  };

  const s = styles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl p-8 lg:p-10"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={idx > 0 ? "sm:pl-8" : ""}
            style={
              idx > 0
                ? { borderLeft: `1px solid ${s.border}` }
                : {}
            }
          >
            <span
              className="block uppercase tracking-[0.2em] mb-2"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: s.label,
              }}
            >
              {item.label}
            </span>
            <span
              className="block"
              style={{
                fontSize: "24px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: item.accent ? brand.primaryColor : s.text,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
