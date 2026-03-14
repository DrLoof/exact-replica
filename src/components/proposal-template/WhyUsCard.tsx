import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";
import * as LucideIcons from "lucide-react";

interface WhyUsCardProps {
  title: string;
  description: string;
  statValue?: string;
  statLabel?: string;
  icon?: string;
  delay?: number;
  onTitleEdit?: (value: string) => void;
  onDescriptionEdit?: (value: string) => void;
}

export function WhyUsCard({
  title, description, statValue, statLabel, icon, delay = 0,
  onTitleEdit, onDescriptionEdit,
}: WhyUsCardProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;

  const IconComponent = icon && (LucideIcons as any)[icon]
    ? (LucideIcons as any)[icon]
    : LucideIcons.Star;

  if (isElegant) {
    const accentTint = `${accent}0F`;
    const border = template.colors.border;
    const muted = template.colors.textMuted;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="group relative rounded-3xl p-8 h-full flex flex-col transition-all duration-300"
        style={{
          background: "white", border: `1px solid ${border}`,
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accent}40`;
          e.currentTarget.style.boxShadow = `0 20px 40px -10px ${accent}0D`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Stat above icon */}
        {statValue && (
          <div className="mb-4">
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: "32px", fontWeight: 500, color: accent }}>
              {statValue}
            </span>
            {statLabel && (
              <span className="block mt-0.5" style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: muted }}>
                {statLabel}
              </span>
            )}
          </div>
        )}

        {/* Icon */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
          style={{ background: accentTint, color: accent }}
          onMouseEnter={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = accentTint; e.currentTarget.style.color = accent; }}
        >
          <IconComponent size={20} />
        </div>

        {onTitleEdit ? (
          <EditableText value={title} placeholder="Title..." onSave={onTitleEdit} as="h3"
            className="mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 500, lineHeight: 1.2, color: dark }} />
        ) : (
          <h3 className="mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 500, lineHeight: 1.2, color: dark }}>
            {title}
          </h3>
        )}

        {onDescriptionEdit ? (
          <EditableText value={description} placeholder="Description..." onSave={onDescriptionEdit} as="p"
            className="flex-1" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
        ) : (
          <p className="flex-1" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }}>
            {description}
          </p>
        )}

        {/* Expanding bar accent */}
        <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${border}` }}>
          <div className="h-2 rounded-full transition-all duration-300 group-hover:w-14"
            style={{ width: "32px", background: `${accent}33` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}80`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${accent}33`; }}
          />
        </div>
      </motion.div>
    );
  }

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="group relative rounded-3xl p-8 h-full flex flex-col transition-transform duration-300 hover:-translate-y-1.5"
        style={{
          background: "white", border: "2px solid #E5E7EB",
          boxShadow: "0 2px 12px rgba(30,27,75,0.04)", fontFamily: "'Outfit', sans-serif",
        }}
      >
        {statValue && (
          <div className="absolute -top-4 -right-3 z-10">
            <div className="px-4 py-2 rounded-2xl text-center"
              style={{ background: accent, color: "white", boxShadow: `3px 3px 0px ${dark}` }}>
              <span className="block" style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1, fontFamily: "'Fraunces', serif" }}>
                {statValue}
              </span>
              {statLabel && (
                <span className="block mt-0.5" style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7 }}>
                  {statLabel}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: `${accent}10`, color: accent }}>
          <IconComponent size={22} />
        </div>
        {onTitleEdit ? (
          <EditableText value={title} placeholder="Title..." onSave={onTitleEdit} as="h3"
            className="mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, lineHeight: 1.2, color: dark }} />
        ) : (
          <h3 className="mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, lineHeight: 1.2, color: dark }}>
            {title}
          </h3>
        )}
        {onDescriptionEdit ? (
          <EditableText value={description} placeholder="Description..." onSave={onDescriptionEdit} as="p"
            className="flex-1" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }} />
        ) : (
          <p className="flex-1" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }}>
            {description}
          </p>
        )}
        <div className="mt-6 pt-4 flex items-center gap-1.5" style={{ borderTop: "2px dashed #E5E7EB" }}>
          {[0.15, 0.25, 0.4, 0.55, 0.7].map((opacity, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: accent, opacity }} />
          ))}
        </div>
      </motion.div>
    );
  }

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
      {statValue && (
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-block rounded-xl px-4 py-2"
            style={{ backgroundColor: brand.primaryColor, color: "#FFFFFF", fontSize: "20px", fontWeight: 700 }}>
            {statValue}
          </span>
          {statLabel && (
            <span className="text-[#999]" style={{ fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {statLabel}
            </span>
          )}
        </div>
      )}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}>
        <IconComponent size={20} />
      </div>
      {onTitleEdit ? (
        <EditableText value={title} placeholder="Title..." onSave={onTitleEdit} as="h3"
          className="tracking-tight mb-2" style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }} />
      ) : (
        <h3 className="tracking-tight mb-2" style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }}>
          {title}
        </h3>
      )}
      {onDescriptionEdit ? (
        <EditableText value={description} placeholder="Description..." onSave={onDescriptionEdit} as="p"
          className="text-[#888]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }} />
      ) : (
        <p className="text-[#888]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
