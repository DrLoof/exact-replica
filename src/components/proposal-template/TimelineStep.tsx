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
  onNameEdit?: (value: string) => void;
  onDurationEdit?: (value: string) => void;
  onDescriptionEdit?: (value: string) => void;
}

export function TimelineStep({
  number,
  name,
  duration,
  description,
  isLast = false,
  delay = 0,
  onNameEdit,
  onDurationEdit,
  onDescriptionEdit,
}: TimelineStepProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;

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
            style={{ background: accent, boxShadow: `4px 4px 0px ${dark}` }}>
            <span className="text-white"
              style={{ fontSize: "20px", fontWeight: 800, fontFamily: "'Fraunces', serif" }}>
              {String(number).padStart(2, "0")}
            </span>
          </div>
          {!isLast && (
            <div className="w-0.5 flex-1 min-h-[50px]"
              style={{ background: `repeating-linear-gradient(to bottom, ${accent}40 0, ${accent}40 6px, transparent 6px, transparent 12px)` }} />
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
            {onDurationEdit ? (
              <EditableText value={duration} placeholder="Duration..." onSave={onDurationEdit} as="span"
                className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${accent}12`, color: accent, fontSize: "12px", fontWeight: 600 }} />
            ) : (
              <span className="inline-block px-3 py-1 rounded-full"
                style={{ background: `${accent}12`, color: accent, fontSize: "12px", fontWeight: 600 }}>
                {duration}
              </span>
            )}
          </div>
          {(description || onDescriptionEdit) && (
            onDescriptionEdit ? (
              <EditableText value={description || ''} placeholder="Click to add a description..." onSave={onDescriptionEdit} as="p"
                className="max-w-lg"
                style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }} />
            ) : (
              <p className="max-w-lg" style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }}>
                {description}
              </p>
            )
          )}
        </div>
      </motion.div>
    );
  }

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
          style={{ backgroundColor: "#1E1E2E" }}>
          <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>
            {String(number).padStart(2, "0")}
          </span>
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[48px]" style={{ backgroundColor: "#E5E7EB" }} />
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
          {onDurationEdit ? (
            <EditableText value={duration} placeholder="Duration..." onSave={onDurationEdit} as="span"
              className="inline-block rounded-full px-3 py-0.5 border uppercase tracking-wider"
              style={{ fontSize: "11px", fontWeight: 700, borderColor: "#4880FF", color: "#4880FF", backgroundColor: "transparent" }} />
          ) : (
            <span className="inline-block rounded-full px-3 py-0.5 border uppercase tracking-wider"
              style={{ fontSize: "11px", fontWeight: 700, borderColor: "#4880FF", color: "#4880FF", backgroundColor: "transparent" }}>
              {duration}
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
