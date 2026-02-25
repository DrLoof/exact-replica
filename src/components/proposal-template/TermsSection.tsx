import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useBrand } from "./BrandTheme";

interface TermsSectionProps {
  clauses: { title: string; content: string }[];
}

export function TermsSection({ clauses }: TermsSectionProps) {
  const brand = useBrand();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
          <div
            key={idx}
            className={idx < clauses.length - 1 ? "border-b border-[#F0F0F0]" : ""}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-[#FAFAFA]/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: isOpen ? brand.primaryColor : `${brand.primaryColor}15`,
                    color: isOpen ? "#FFFFFF" : brand.primaryColor,
                    transition: "all 0.2s ease",
                  }}
                >
                  {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: brand.darkColor,
                  }}
                >
                  {clause.title}
                </span>
              </div>
              <ChevronDown
                size={18}
                className="text-[#BBB] transition-transform duration-200 shrink-0"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
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
                    <p
                      className="text-[#666]"
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: 1.7,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {clause.content}
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
