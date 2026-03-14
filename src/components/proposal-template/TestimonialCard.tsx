import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";
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
  onQuoteEdit?: (value: string) => void;
  onNameEdit?: (value: string) => void;
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
  onQuoteEdit,
  onNameEdit,
}: TestimonialCardProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;

  const renderName = () => onNameEdit ? (
    <EditableText value={clientName} placeholder="Client name..." onSave={onNameEdit} as="span" />
  ) : clientName;

  if (isModern && featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-3xl p-10"
        style={{
          fontFamily: "'Outfit', sans-serif",
          backgroundColor: dark,
          boxShadow: `0 12px 40px ${dark}33`,
        }}
      >
        <Quote size={28} style={{ color: secondary }} className="mb-6" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-8"
            style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontFamily: "'Fraunces', serif", fontStyle: "italic" }} />
        ) : (
          <blockquote className="mb-8"
            style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
            "{quote}"
          </blockquote>
        )}

        {metricValue && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: `${secondary}26` }}>
            <span style={{ fontSize: "18px", fontWeight: 800, color: secondary, fontFamily: "'Fraunces', serif" }}>
              {metricValue}
            </span>
            {metricLabel && (
              <span style={{ fontSize: "11px", fontWeight: 500, color: secondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {metricLabel}
              </span>
            )}
          </div>
        )}

        <div className="pt-6 mb-0" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={clientName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: accent, boxShadow: "2px 2px 0px rgba(255,255,255,0.15)" }}>
                <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>{clientName.charAt(0)}</span>
              </div>
            )}
            <div>
              <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>{onNameEdit ? renderName() : clientName}</span>
              {(clientTitle || clientCompany) && (
                <span className="block" style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.45)" }}>
                  {clientTitle}{clientTitle && clientCompany ? " · " : ""}{clientCompany}
                </span>
              )}
            </div>
          </div>
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
        className="rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1"
        style={{
          fontFamily: "'Outfit', sans-serif",
          background: "white", border: "2px solid #E5E7EB",
          boxShadow: "0 2px 12px rgba(30,27,75,0.04)",
        }}
      >
        <Quote size={20} style={{ color: accent, opacity: 0.3 }} className="mb-4" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-6"
            style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "#6B7280", fontFamily: "'Fraunces', serif", fontStyle: "italic" }} />
        ) : (
          <blockquote className="mb-6"
            style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "#6B7280", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
            "{quote}"
          </blockquote>
        )}

        {metricValue && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: `${accent}10` }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: accent, fontFamily: "'Fraunces', serif" }}>
              {metricValue}
            </span>
            {metricLabel && (
              <span style={{ fontSize: "10px", fontWeight: 500, color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {metricLabel}
              </span>
            )}
          </div>
        )}

        <div className="pt-5" style={{ borderTop: "2px dashed #E5E7EB" }}>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={clientName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: dark, boxShadow: `2px 2px 0px ${accent}40` }}>
                <span className="text-white" style={{ fontSize: "14px", fontWeight: 700 }}>{clientName.charAt(0)}</span>
              </div>
            )}
            <div>
              <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{onNameEdit ? renderName() : clientName}</span>
              {(clientTitle || clientCompany) && (
                <span className="block" style={{ fontSize: "12px", fontWeight: 400, color: "#D1D5DB" }}>
                  {clientTitle}{clientTitle && clientCompany ? " · " : ""}{clientCompany}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Classic featured
  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl p-10 lg:p-12"
        style={{ fontFamily: "'Space Grotesk', sans-serif", backgroundColor: brand.darkColor }}
      >
        <Quote size={28} className="text-white/20 mb-6" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="text-white mb-8"
            style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1.6 }} />
        ) : (
          <blockquote className="text-white mb-8" style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1.6 }}>
            "{quote}"
          </blockquote>
        )}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={clientName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: brand.primaryColor }}>
              <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>{clientName.charAt(0)}</span>
            </div>
          )}
          <div>
            <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>{onNameEdit ? renderName() : clientName}</span>
            {(clientTitle || clientCompany) && (
              <span className="block text-white/50" style={{ fontSize: "13px", fontWeight: 400 }}>
                {clientTitle}{clientTitle && clientCompany ? " · " : ""}{clientCompany}
              </span>
            )}
          </div>
          {metricValue && (
            <div className="ml-auto text-right">
              <span className="block text-white" style={{ fontSize: "24px", fontWeight: 700 }}>{metricValue}</span>
              {metricLabel && (
                <span className="block text-white/50 uppercase tracking-[0.1em]" style={{ fontSize: "10px", fontWeight: 500 }}>{metricLabel}</span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Classic non-featured
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="bg-white border border-[#EBEBEB] rounded-2xl p-8"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <Quote size={20} style={{ color: `${brand.primaryColor}40` }} className="mb-4" />
      {onQuoteEdit ? (
        <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
          className="text-[#555] mb-6"
          style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }} />
      ) : (
        <blockquote className="text-[#555] mb-6" style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
          "{quote}"
        </blockquote>
      )}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={clientName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }}>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>{clientName.charAt(0)}</span>
          </div>
        )}
        <div>
          <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: brand.darkColor }}>{onNameEdit ? renderName() : clientName}</span>
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
