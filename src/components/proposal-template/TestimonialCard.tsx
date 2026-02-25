import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  clientName: string;
  clientTitle?: string;
  clientCompany?: string;
  quote: string;
  metricValue?: string;
  metricLabel?: string;
  avatarUrl?: string;
  featured?: boolean;
  delay?: number;
}

export function TestimonialCard({
  clientName,
  clientTitle,
  clientCompany,
  quote,
  metricValue,
  metricLabel,
  avatarUrl,
  featured = false,
  delay = 0,
}: TestimonialCardProps) {
  const brand = useBrand();

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl p-10 lg:p-12"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          backgroundColor: brand.darkColor,
        }}
      >
        <Quote size={28} className="text-white/20 mb-6" />
        <blockquote
          className="text-white mb-8"
          style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1.6 }}
        >
          "{quote}"
        </blockquote>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={clientName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>
                {clientName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>
              {clientName}
            </span>
            {(clientTitle || clientCompany) && (
              <span className="block text-white/50" style={{ fontSize: "13px", fontWeight: 400 }}>
                {clientTitle}{clientTitle && clientCompany ? " · " : ""}{clientCompany}
              </span>
            )}
          </div>
          {metricValue && (
            <div className="ml-auto text-right">
              <span className="block text-white" style={{ fontSize: "24px", fontWeight: 700 }}>
                {metricValue}
              </span>
              {metricLabel && (
                <span className="block text-white/50 uppercase tracking-[0.1em]" style={{ fontSize: "10px", fontWeight: 500 }}>
                  {metricLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="bg-white border border-[#EBEBEB] rounded-2xl p-8"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <Quote size={20} style={{ color: `${brand.primaryColor}40` }} className="mb-4" />
      <blockquote
        className="text-[#555] mb-6"
        style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}
      >
        "{quote}"
      </blockquote>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={clientName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700 }}>
              {clientName.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: brand.darkColor }}>
            {clientName}
          </span>
          {(clientTitle || clientCompany) && (
            <span className="block text-[#999]" style={{ fontSize: "12px", fontWeight: 400 }}>
              {clientTitle}{clientTitle && clientCompany ? " · " : ""}{clientCompany}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
