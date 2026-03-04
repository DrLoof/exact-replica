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
      className="flex gap-5"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Timeline line + number square */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#1E1E2E" }}
        >
          <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>
            {String(number).padStart(2, "0")}
          </span>
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[48px]"
            style={{ backgroundColor: "#E5E7EB" }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-10 pt-1 ${isLast ? "" : ""}`}>
        <div className="flex items-center gap-3 mb-2">
          {onNameEdit ? (
            <EditableText
              value={name}
              placeholder="Phase name..."
              onSave={onNameEdit}
              as="h3"
              className="tracking-tight"
              style={{ fontSize: "18px", fontWeight: 700, color: "#1E1E2E" }}
            />
          ) : (
            <h3 className="tracking-tight" style={{ fontSize: "18px", fontWeight: 700, color: "#1E1E2E" }}>
              {name}
            </h3>
          )}
          {onDurationEdit ? (
            <EditableText
              value={duration}
              placeholder="Duration..."
              onSave={onDurationEdit}
              as="span"
              className="inline-block rounded-full px-3 py-0.5 border uppercase tracking-wider"
              style={{ fontSize: "11px", fontWeight: 700, borderColor: "#4880FF", color: "#4880FF", backgroundColor: "transparent" }}
            />
          ) : (
            <span
              className="inline-block rounded-full px-3 py-0.5 border uppercase tracking-wider"
              style={{ fontSize: "11px", fontWeight: 700, borderColor: "#4880FF", color: "#4880FF", backgroundColor: "transparent" }}
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
              className="max-w-xl"
              style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#6B7280", fontFamily: "'Inter', sans-serif" }}
            />
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
