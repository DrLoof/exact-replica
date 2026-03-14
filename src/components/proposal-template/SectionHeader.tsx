import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";

interface SectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  onTitleEdit?: (value: string) => void;
  onSubtitleEdit?: (value: string) => void;
}

export function SectionHeader({
  number, title, subtitle, align = "left",
  onTitleEdit, onSubtitleEdit,
}: SectionHeaderProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isCenter = align === "center";
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;

  if (isElegant) {
    const accentTint = `${accent}0F`;
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`mb-12 ${isCenter ? "text-center" : ""}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className={`flex items-center gap-4 mb-6 ${isCenter ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: accentTint, color: accent, fontSize: "13px", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            {number}
          </div>
          <div className="w-8 h-px" style={{ background: `${accent}33` }} />
        </div>
        {onTitleEdit ? (
          <EditableText value={title} placeholder="Section title..." onSave={onTitleEdit} as="h1"
            style={{
              fontFamily: "'Fraunces', serif", fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 500, lineHeight: 1.1, color: dark, letterSpacing: "-0.01em",
            }} />
        ) : (
          <h2 style={{
            fontFamily: "'Fraunces', serif", fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 500, lineHeight: 1.1, color: dark, letterSpacing: "-0.01em",
          }}>
            {title}
          </h2>
        )}
        {(subtitle || onSubtitleEdit) && (
          onSubtitleEdit ? (
            <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
              className="mt-3 max-w-xl"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, color: template.colors.textMuted }} />
          ) : (
            <p className="mt-3 max-w-xl"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, color: template.colors.textMuted }}>
              {subtitle}
            </p>
          )
        )}
      </motion.div>
    );
  }

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`mb-12 ${isCenter ? "text-center" : ""}`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className={`flex items-start gap-5 ${isCenter ? "justify-center" : ""}`}>
          <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: accent, color: "white",
              fontSize: "24px", fontWeight: 800,
              fontFamily: "'Fraunces', serif",
              boxShadow: `4px 4px 0px ${dark}`,
            }}>
            {number}
          </div>
          <div className="pt-1">
            {onTitleEdit ? (
              <EditableText value={title} placeholder="Section title..." onSave={onTitleEdit} as="h1"
                className="tracking-tight" style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  fontWeight: 700, lineHeight: 1.1, color: dark,
                }} />
            ) : (
              <h2 className="tracking-tight" style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 700, lineHeight: 1.1, color: dark,
              }}>
                {title}
              </h2>
            )}
            {(subtitle || onSubtitleEdit) && (
              onSubtitleEdit ? (
                <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
                  className="mt-3 max-w-xl"
                  style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.6, color: "#9CA3AF" }} />
              ) : (
                <p className="mt-3 max-w-xl"
                  style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.6, color: "#9CA3AF" }}>
                  {subtitle}
                </p>
              )
            )}
          </div>
        </div>
        <div className="mt-8">
          <svg width="100%" height="6" viewBox="0 0 400 6" preserveAspectRatio="none">
            <path d="M0 3 Q10 0 20 3 Q30 6 40 3 Q50 0 60 3 Q70 6 80 3 Q90 0 100 3 Q110 6 120 3 Q130 0 140 3 Q150 6 160 3 Q170 0 180 3 Q190 6 200 3 Q210 0 220 3 Q230 6 240 3 Q250 0 260 3 Q270 6 280 3 Q290 0 300 3 Q310 6 320 3 Q330 0 340 3 Q350 6 360 3 Q370 0 380 3 Q390 6 400 3"
              fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.15" />
          </svg>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`mb-14 ${isCenter ? "text-center" : ""}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className={`flex items-start gap-6 ${isCenter ? "justify-center" : ""}`}>
        <span className="tracking-tight block shrink-0"
          style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 700, lineHeight: 0.85, color: brand.primaryColor }}>
          {number}
        </span>
        <div className={`${isCenter ? "" : "border-l-2 pl-6"} pt-1`}
          style={isCenter ? {} : { borderColor: brand.primaryColor }}>
          {onTitleEdit ? (
            <EditableText value={title} placeholder="Section title..." onSave={onTitleEdit} as="h1"
              className="tracking-tight" style={{
                fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 700, lineHeight: 1.1, color: brand.darkColor,
              }} />
          ) : (
            <h2 className="tracking-tight"
              style={{ fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 700, lineHeight: 1.1, color: brand.darkColor }}>
              {title}
            </h2>
          )}
          {(subtitle || onSubtitleEdit) && (
            onSubtitleEdit ? (
              <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
                className="text-[#888] mt-2 max-w-xl"
                style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.6 }} />
            ) : (
              <p className="text-[#888] mt-2 max-w-xl"
                style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.6 }}>
                {subtitle}
              </p>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
