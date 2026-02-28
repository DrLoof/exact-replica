import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex gap-6"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>
            {String(number).padStart(2, "0")}
          </span>
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[40px]"
            style={{ backgroundColor: `${brand.primaryColor}30` }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-8 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-3 mb-2">
          {onNameEdit ? (
            <EditableText
              value={name}
              placeholder="Phase name..."
              onSave={onNameEdit}
              as="h3"
              className="tracking-tight"
              style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }}
            />
          ) : (
            <h3 className="tracking-tight" style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }}>
              {name}
            </h3>
          )}
          {onDurationEdit ? (
            <EditableText
              value={duration}
              placeholder="Duration..."
              onSave={onDurationEdit}
              as="span"
              className="inline-block rounded-full px-3 py-0.5"
              style={{ fontSize: "12px", fontWeight: 600, backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
            />
          ) : (
            <span
              className="inline-block rounded-full px-3 py-0.5"
              style={{ fontSize: "12px", fontWeight: 600, backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
            >
              {duration}
            </span>
          )}
        </div>
        {(description || onDescriptionEdit) && (
          onDescriptionEdit ? (
            <EditableText
              value={description || ''}
              placeholder="Click to add a description..."
              onSave={onDescriptionEdit}
              as="p"
              className="text-[#888] max-w-md"
              style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}
            />
          ) : (
            <p className="text-[#888] max-w-md" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
              {description}
            </p>
          )
        )}
      </div>
    </motion.div>
  );
}
