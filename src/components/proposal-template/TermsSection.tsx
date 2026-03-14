import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";

interface TermsSectionProps {
  clauses: { title: string; content: string }[];
  onClauseEdit?: (index: number, field: 'title' | 'content', value: string) => void;
}

export function TermsSection({ clauses, onClauseEdit }: TermsSectionProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;
  const [openIndex, setOpenIndex] = useState<number | null>(isModern ? 0 : null);

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-3"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {clauses.map((clause, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="rounded-2xl overflow-hidden transition-colors duration-200"
              style={{ border: `2px solid ${isOpen ? `${accent}30` : '#F3F4F6'}` }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                  style={{
                    fontSize: "12px", fontWeight: 700,
                    backgroundColor: isOpen ? accent : "#F9FAFB",
                    color: isOpen ? "#FFFFFF" : "#D1D5DB",
                    boxShadow: isOpen ? `2px 2px 0px ${dark}` : "none",
                  }}>
                  {idx + 1}
                </span>
                <span className="flex-1" style={{
                  fontSize: "16px",
                  fontWeight: isOpen ? 700 : 500,
                  color: isOpen ? dark : "#6B7280",
                }}>
                  {onClauseEdit ? (
                    <EditableText value={clause.title} placeholder="Clause title..." onSave={(val) => onClauseEdit(idx, 'title', val)} as="span" />
                  ) : clause.title}
                </span>
                <ChevronDown size={18}
                  className="shrink-0 transition-transform duration-200"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: isOpen ? accent : "#D1D5DB",
                  }} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5" style={{ paddingLeft: "76px" }}>
                      {onClauseEdit ? (
                        <EditableText value={clause.content} placeholder="Clause content..." onSave={(val) => onClauseEdit(idx, 'content', val)} as="p"
                          style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }} />
                      ) : (
                        <p style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }}>
                          {clause.content}
                        </p>
                      )}
                      <p className="mt-3" style={{ fontSize: "13px", color: "#D1D5DB" }}>
                        <span style={{ color: accent }}>*</span> Standard terms apply
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border border-[#EBEBEB] rounded-2xl overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {clauses.map((clause, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className={idx < clauses.length - 1 ? "border-b border-[#F0F0F0]" : ""}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-[#FAFAFA]/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    fontSize: "12px", fontWeight: 700,
                    backgroundColor: isOpen ? brand.primaryColor : `${brand.primaryColor}15`,
                    color: isOpen ? "#FFFFFF" : brand.primaryColor,
                    transition: "all 0.2s ease",
                  }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 600, color: brand.darkColor }}>
                  {onClauseEdit ? (
                    <EditableText value={clause.title} placeholder="Clause title..." onSave={(val) => onClauseEdit(idx, 'title', val)} as="span" />
                  ) : clause.title}
                </span>
              </div>
              <ChevronDown size={18}
                className="text-[#BBB] transition-transform duration-200 shrink-0"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6 pl-20">
                    {onClauseEdit ? (
                      <EditableText value={clause.content} placeholder="Clause content..." onSave={(val) => onClauseEdit(idx, 'content', val)} as="p"
                        className="text-[#666]"
                        style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }} />
                    ) : (
                      <p className="text-[#666]" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                        {clause.content}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}
