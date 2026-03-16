import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";

interface HighlightPanelProps {
  items: { label: string; value: string; accent?: boolean }[];
  variant?: "default" | "accent" | "dark";
  onItemEdit?: (index: number, field: 'label' | 'value', newValue: string) => void;
}

export function HighlightPanel({
  items, variant = "default", onItemEdit,
}: HighlightPanelProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;

  if (isSoft) {
    const softStyles = {
      default: {
        bg: template.colors.background, border: `1px solid ${accent}26`,
        textColor: dark, labelColor: template.colors.textBody,
        accentColor: accent,
      },
      accent: {
        bg: accent, border: "none",
        textColor: "white", labelColor: "rgba(255,255,255,0.6)",
        accentColor: "white",
      },
      dark: {
        bg: '#2A2520', border: "none",
        textColor: "white", labelColor: "#A8ADB8",
        accentColor: "white",
      },
    };
    const ss = softStyles[variant];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-2xl p-8 lg:p-10"
        style={{ backgroundColor: ss.bg, border: ss.border }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div key={idx}
              className={idx > 0 ? "sm:pl-8" : ""}
              style={idx > 0 ? { borderLeft: `1px solid ${variant === 'default' ? `${accent}26` : variant === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}` } : {}}
            >
              {onItemEdit ? (
                <EditableText value={item.label} placeholder="Label..." onSave={(val) => onItemEdit(idx, 'label', val)} as="span"
                  className="block uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: ss.labelColor }} />
              ) : (
                <span className="block uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: ss.labelColor }}>
                  {item.label}
                </span>
              )}
              {onItemEdit ? (
                <EditableText value={item.value} placeholder="Value..." onSave={(val) => onItemEdit(idx, 'value', val)} as="span"
                  className="block"
                  style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1.2, color: item.accent ? ss.accentColor : ss.textColor }} />
              ) : (
                <span className="block"
                  style={{ fontSize: "24px", fontWeight: 600, lineHeight: 1.2, color: item.accent ? ss.accentColor : ss.textColor }}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (isElegant) {
    const accentTint = `${accent}0F`;
    const elegantStyles = {
      default: {
        bg: accentTint, border: "none",
        textColor: dark, labelColor: template.colors.textMuted,
        accentColor: accent,
      },
      accent: {
        bg: accent, border: "none",
        textColor: "white", labelColor: "rgba(255,255,255,0.5)",
        accentColor: "white",
      },
      dark: {
        bg: '#1E1B3A', border: "none",
        textColor: "white", labelColor: "#A8ADB8",
        accentColor: "white",
      },
    };
    const es = elegantStyles[variant];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl p-8 lg:p-10"
        style={{ backgroundColor: es.bg }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div key={idx}
              className={idx > 0 ? "sm:pl-8" : ""}
              style={idx > 0 ? { borderLeft: `1px solid ${variant === 'default' ? `${accent}20` : variant === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'}` } : {}}
            >
              {onItemEdit ? (
                <EditableText value={item.label} placeholder="Label..." onSave={(val) => onItemEdit(idx, 'label', val)} as="span"
                  className="block uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 500, color: es.labelColor }} />
              ) : (
                <span className="block uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 500, color: es.labelColor }}>
                  {item.label}
                </span>
              )}
              {onItemEdit ? (
                <EditableText value={item.value} placeholder="Value..." onSave={(val) => onItemEdit(idx, 'value', val)} as="span"
                  className="block"
                  style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 500, lineHeight: 1.2, color: item.accent ? es.accentColor : es.textColor }} />
              ) : (
                <span className="block"
                  style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 500, lineHeight: 1.2, color: item.accent ? es.accentColor : es.textColor }}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (isModern) {
    const modernStyles = {
      default: {
        bg: "white", border: "2px dashed #E5E7EB",
        textColor: dark, labelColor: "#9CA3AF",
        accentColor: accent, shadow: "none",
      },
      accent: {
        bg: `linear-gradient(135deg, ${accent}, ${secondary})`, border: "none",
        textColor: "white", labelColor: "rgba(255,255,255,0.6)",
        accentColor: "white", shadow: `0 8px 30px ${accent}40`,
      },
      dark: {
        bg: '#1A1A3E', border: `2px dashed rgba(255,255,255,0.1)`,
        textColor: "white", labelColor: "#A8ADB8",
        accentColor: "white", shadow: `0 8px 30px #1A1A3E26`,
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
          border: ms.border, boxShadow: ms.shadow,
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          {items.map((item, idx) => (
            <div key={idx}>
              {onItemEdit ? (
                <EditableText value={item.label} placeholder="Label..." onSave={(val) => onItemEdit(idx, 'label', val)} as="span"
                  className="block uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 600, color: ms.labelColor }} />
              ) : (
                <span className="block uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", fontWeight: 600, color: ms.labelColor }}>
                  {item.label}
                </span>
              )}
              {onItemEdit ? (
                <EditableText value={item.value} placeholder="Value..." onSave={(val) => onItemEdit(idx, 'value', val)} as="span"
                  className="block"
                  style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 800, lineHeight: 1.2, color: item.accent ? ms.accentColor : ms.textColor }} />
              ) : (
                <span className="block"
                  style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 800, lineHeight: 1.2, color: item.accent ? ms.accentColor : ms.textColor }}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Classic variant
  const styles = {
    default: { bg: "#FAFAFA", text: brand.darkColor, label: "#999", border: "#EBEBEB" },
    accent: { bg: brand.primaryColor, text: "#FFFFFF", label: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.15)" },
    dark: { bg: "#0A0A0A", text: "#FFFFFF", label: "#A8ADB8", border: "rgba(255,255,255,0.1)" },
  };
  const s = styles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl p-8 lg:p-10"
      style={{ fontFamily: "'Space Grotesk', sans-serif", backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, idx) => (
          <div key={idx} className={idx > 0 ? "sm:pl-8" : ""}
            style={idx > 0 ? { borderLeft: `1px solid ${s.border}` } : {}}>
            {onItemEdit ? (
              <EditableText value={item.label} placeholder="Label..." onSave={(val) => onItemEdit(idx, 'label', val)} as="span"
                className="block uppercase tracking-[0.2em] mb-2"
                style={{ fontSize: "11px", fontWeight: 500, color: s.label }} />
            ) : (
              <span className="block uppercase tracking-[0.2em] mb-2"
                style={{ fontSize: "11px", fontWeight: 500, color: s.label }}>
                {item.label}
              </span>
            )}
            {onItemEdit ? (
              <EditableText value={item.value} placeholder="Value..." onSave={(val) => onItemEdit(idx, 'value', val)} as="span"
                className="block"
                style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2, color: item.accent ? brand.primaryColor : s.text }} />
            ) : (
              <span className="block"
                style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2, color: item.accent ? brand.primaryColor : s.text }}>
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
