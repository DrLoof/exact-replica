import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";

interface TimelineStepProps {
  number: number;
  name: string;
  duration: string;
  description?: string;
  isLast?: boolean;
  delay?: number;
  isOngoing?: boolean;
  isNextOngoing?: boolean;
  onNameEdit?: (value: string) => void;
  onDurationEdit?: (value: string) => void;
  onDescriptionEdit?: (value: string) => void;
}

export function TimelineStep({
  number, name, duration, description, isLast = false, delay = 0,
  isOngoing = false, isNextOngoing = false,
  onNameEdit, onDurationEdit, onDescriptionEdit,
}: TimelineStepProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;

  // For ongoing phases, use secondary accent colors
  const pillAccent = isOngoing ? secondary : accent;
  const circleAccent = isOngoing ? secondary : accent;

  // Render the number/symbol inside the circle
  const renderCircleContent = () => {
    if (isOngoing) {
      return <span style={{ fontSize: '18px', lineHeight: 1 }}>∞</span>;
    }
    return <span>{String(number).padStart(2, "0")}</span>;
  };

  // Connecting line style — dashed if next phase is ongoing
  const getLineStyle = (solidColor: string) => {
    if (isNextOngoing) {
      return {
        background: `repeating-linear-gradient(to bottom, ${solidColor} 0, ${solidColor} 4px, transparent 4px, transparent 8px)`,
      };
    }
    return { background: solidColor };
  };

  // Don't allow editing duration on ongoing phases
  const effectiveDurationEdit = isOngoing ? undefined : onDurationEdit;
  const displayDuration = isOngoing ? 'ONGOING' : duration;

  if (isSoft) {
    const bg = template.colors.background;
    const border = template.colors.border;
    const muted = template.colors.textBody;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="relative flex gap-6 lg:gap-10"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex flex-col items-center shrink-0">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center relative z-10"
            style={{ background: bg, border: `1px solid ${circleAccent}33`, color: circleAccent, fontSize: isOngoing ? undefined : '18px', fontWeight: 600 }}>
            {renderCircleContent()}
          </div>
          {!isLast && (
            <div className="w-px flex-1 min-h-[50px]"
              style={isNextOngoing
                ? getLineStyle(`${accent}4D`)
                : { background: `linear-gradient(to bottom, ${accent}4D, ${border})` }
              } />
          )}
        </div>
        <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {onNameEdit ? (
              <EditableText value={name} placeholder="Phase name..." onSave={onNameEdit} as="h3"
                style={{ fontSize: "19px", fontWeight: 600, lineHeight: 1.2, color: dark }} />
            ) : (
              <h3 style={{ fontSize: "19px", fontWeight: 600, lineHeight: 1.2, color: dark }}>{name}</h3>
            )}
            {effectiveDurationEdit ? (
              <EditableText value={displayDuration} placeholder="Duration..." onSave={effectiveDurationEdit} as="span"
                className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${pillAccent}1A`, color: pillAccent, fontSize: "11px", fontWeight: 600 }} />
            ) : (
              <span className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${pillAccent}1A`, color: pillAccent, fontSize: "11px", fontWeight: 600 }}>
                {displayDuration}
              </span>
            )}
          </div>
          {(description || onDescriptionEdit) && (
            onDescriptionEdit ? (
              <EditableText value={description || ''} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
                className="max-w-lg" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
            ) : (
              <p className="max-w-lg" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }}>{description}</p>
            )
          )}
        </div>
      </motion.div>
    );
  }

  if (isElegant) {
    const accentTint = `${circleAccent}0F`;
    const border = template.colors.border;
    const muted = template.colors.textMuted;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="relative flex gap-6 lg:gap-10"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex flex-col items-center shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
            style={{ background: accentTint, border: `1px solid ${circleAccent}26`, color: circleAccent }}>
            <span style={{ fontSize: isOngoing ? "18px" : "18px", fontWeight: 500, fontFamily: isOngoing ? undefined : "'Fraunces', serif" }}>
              {isOngoing ? '∞' : String(number).padStart(2, "0")}
            </span>
          </div>
          {!isLast && (
            <div className="w-px flex-1 min-h-[50px]"
              style={isNextOngoing
                ? getLineStyle(`${accent}40`)
                : { background: `linear-gradient(to bottom, ${accent}40, ${border})` }
              } />
          )}
        </div>
        <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {onNameEdit ? (
              <EditableText value={name} placeholder="Phase name..." onSave={onNameEdit} as="h3"
                style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, lineHeight: 1.2, color: dark }} />
            ) : (
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, lineHeight: 1.2, color: dark }}>
                {name}
              </h3>
            )}
            {effectiveDurationEdit ? (
              <EditableText value={displayDuration} placeholder="Duration..." onSave={effectiveDurationEdit} as="span"
                className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${pillAccent}26`, color: pillAccent, fontSize: "11px", fontWeight: 600 }} />
            ) : (
              <span className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${pillAccent}26`, color: pillAccent, fontSize: "11px", fontWeight: 600 }}>
                {displayDuration}
              </span>
            )}
          </div>
          {(description || onDescriptionEdit) && (
            onDescriptionEdit ? (
              <EditableText value={description || ''} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
                className="max-w-lg"
                style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
            ) : (
              <p className="max-w-lg" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: muted }}>
                {description}
              </p>
            )
          )}
        </div>
      </motion.div>
    );
  }

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="relative flex gap-6 lg:gap-10"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="flex flex-col items-center shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
            style={{ background: circleAccent, boxShadow: `4px 4px 0px ${dark}` }}>
            <span className="text-white"
              style={{ fontSize: isOngoing ? "18px" : "20px", fontWeight: 800, fontFamily: isOngoing ? undefined : "'Fraunces', serif" }}>
              {isOngoing ? '∞' : String(number).padStart(2, "0")}
            </span>
          </div>
          {!isLast && (
            <div className="w-0.5 flex-1 min-h-[50px]"
              style={isNextOngoing
                ? getLineStyle(`${accent}40`)
                : { background: `repeating-linear-gradient(to bottom, ${accent}40 0, ${accent}40 6px, transparent 6px, transparent 12px)` }
              } />
          )}
        </div>
        <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {onNameEdit ? (
              <EditableText value={name} placeholder="Phase name..." onSave={onNameEdit} as="h3"
                style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: dark }} />
            ) : (
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: dark }}>
                {name}
              </h3>
            )}
            {effectiveDurationEdit ? (
              <EditableText value={displayDuration} placeholder="Duration..." onSave={effectiveDurationEdit} as="span"
                className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${pillAccent}12`, color: pillAccent, fontSize: "12px", fontWeight: 600 }} />
            ) : (
              <span className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${pillAccent}12`, color: pillAccent, fontSize: "12px", fontWeight: 600 }}>
                {displayDuration}
              </span>
            )}
          </div>
          {(description || onDescriptionEdit) && (
            onDescriptionEdit ? (
              <EditableText value={description || ''} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
                className="max-w-lg"
                style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textMuted }} />
            ) : (
              <p className="max-w-lg" style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textMuted }}>
                {description}
              </p>
            )
          )}
        </div>
      </motion.div>
    );
  }

  // Classic template
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex gap-5"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="flex flex-col items-center shrink-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: isOngoing ? secondary : "#1E1E2E" }}>
          <span className="text-white" style={{ fontSize: isOngoing ? "18px" : "16px", fontWeight: 700 }}>
            {isOngoing ? '∞' : String(number).padStart(2, "0")}
          </span>
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[48px]"
            style={isNextOngoing
              ? getLineStyle('#9CA3AF')
              : { backgroundColor: "#E5E7EB" }
            } />
        )}
      </div>
      <div className={`pb-10 pt-1 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-3 mb-2">
          {onNameEdit ? (
            <EditableText value={name} placeholder="Phase name..." onSave={onNameEdit} as="h3"
              className="tracking-tight" style={{ fontSize: "18px", fontWeight: 700, color: "#1E1E2E" }} />
          ) : (
            <h3 className="tracking-tight" style={{ fontSize: "18px", fontWeight: 700, color: "#1E1E2E" }}>{name}</h3>
          )}
          {effectiveDurationEdit ? (
            <EditableText value={displayDuration} placeholder="Duration..." onSave={effectiveDurationEdit} as="span"
              className="inline-block rounded-full px-3 py-0.5 border uppercase tracking-wider"
              style={{ fontSize: "11px", fontWeight: 700, borderColor: pillAccent, color: pillAccent, backgroundColor: isOngoing ? `${pillAccent}14` : "transparent" }} />
          ) : (
            <span className="inline-block rounded-full px-3 py-0.5 border uppercase tracking-wider"
              style={{ fontSize: "11px", fontWeight: 700, borderColor: pillAccent, color: pillAccent, backgroundColor: isOngoing ? `${pillAccent}14` : "transparent" }}>
              {displayDuration}
            </span>
          )}
        </div>
        {(description || onDescriptionEdit) && (
          onDescriptionEdit ? (
            <EditableText value={description || ''} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
              className="max-w-xl"
              style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#6B7280", fontFamily: "'Inter', sans-serif" }} />
          ) : (
            <p className="max-w-xl" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#6B7280", fontFamily: "'Inter', sans-serif" }}>
              {description}
            </p>
          )
        )}
      </div>
    </motion.div>
  );
}
