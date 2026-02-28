import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";

interface HeroCoverProps {
  proposalTitle: string;
  subtitle?: string;
  clientName: string;
  date?: string;
  proposalNumber?: string;
  confidential?: boolean;
  onTitleEdit?: (value: string) => void;
  onSubtitleEdit?: (value: string) => void;
}

export function HeroCover({
  proposalTitle,
  subtitle,
  clientName,
  date,
  proposalNumber,
  confidential = true,
  onTitleEdit,
  onSubtitleEdit,
}: HeroCoverProps) {
  const brand = useBrand();

  return (
    <div
      className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Abstract Graphic Panel */}
      <div className="absolute top-0 right-0 w-[35%] lg:w-[45%] h-full overflow-hidden pointer-events-none hidden md:block">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute top-0 right-0 w-full h-[65%] rounded-bl-[80px]"
            style={{ backgroundColor: brand.primaryColor }}
          />
          <div className="absolute bottom-[30%] right-[15%] w-40 h-40 bg-white rounded-full" />
          <div
            className="absolute top-[20%] right-[60%] w-6 h-6 rounded-full"
            style={{ backgroundColor: brand.primaryColor }}
          />
          <div
            className="absolute bottom-[20%] left-0 w-[80%] h-px"
            style={{ backgroundColor: `${brand.primaryColor}33` }}
          />
        </motion.div>
      </div>

      {/* Mobile accent bar */}
      <div
        className="absolute top-0 right-0 w-2 h-full md:hidden"
        style={{ backgroundColor: brand.primaryColor }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-12 pt-10 lg:px-16 lg:pt-14">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-3"
        >
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.agencyName}
              className="h-32 w-auto object-contain"
            />
          ) : (
            <span
              className="tracking-[0.15em] uppercase"
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: brand.darkColor,
                letterSpacing: "0.08em",
              }}
            >
              {brand.agencyFullName}
            </span>
          )}
        </motion.div>
        {proposalNumber && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-white md:text-[#999] tracking-wider uppercase relative z-10"
            style={{ fontSize: "12px", fontWeight: 400 }}
          >
            {proposalNumber}
          </motion.span>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 lg:px-16 max-w-full md:max-w-[60%] lg:max-w-[55%]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <span
            className="inline-block uppercase tracking-[0.25em] mb-6"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: brand.primaryColor,
            }}
          >
            Proposal for
          </span>
          <h1
            className="mb-4 tracking-tight outline-none"
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.05,
              color: brand.darkColor,
            }}
            contentEditable={!!onTitleEdit}
            suppressContentEditableWarning
            onBlur={(e) => onTitleEdit?.(e.currentTarget.textContent || '')}
          >
            {proposalTitle}
          </h1>
          {(subtitle || onSubtitleEdit) && (
            <p
              className="text-[#666] max-w-lg mt-4 outline-none"
              style={{ fontSize: "18px", fontWeight: 300, lineHeight: 1.6 }}
              contentEditable={!!onSubtitleEdit}
              suppressContentEditableWarning
              onBlur={(e) => onSubtitleEdit?.(e.currentTarget.textContent || '')}
            >
              {subtitle || 'Click to add a subtitle...'}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 flex items-center gap-8"
        >
          <div>
            <span
              className="block text-[#999] uppercase tracking-[0.15em] mb-1"
              style={{ fontSize: "11px", fontWeight: 500 }}
            >
              Prepared for
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: brand.darkColor,
              }}
            >
              {clientName}
            </span>
          </div>
          <div className="w-px h-10 bg-[#E0E0E0]" />
          <div>
            <span
              className="block text-[#999] uppercase tracking-[0.15em] mb-1"
              style={{ fontSize: "11px", fontWeight: 500 }}
            >
              Date
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: brand.darkColor,
              }}
            >
              {date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        className="relative z-10 mx-12 lg:mx-16 mb-10 h-px bg-[#E0E0E0] origin-left"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="relative z-10 px-12 lg:px-16 pb-10 flex items-center justify-between"
      >
        {confidential && (
          <span
            className="text-[#BBB] uppercase tracking-[0.15em]"
            style={{ fontSize: "11px" }}
          >
            Confidential
          </span>
        )}
        <span
          className="text-[#BBB] uppercase tracking-[0.15em]"
          style={{ fontSize: "11px" }}
        >
          Page 01
        </span>
      </motion.div>
    </div>
  );
}
