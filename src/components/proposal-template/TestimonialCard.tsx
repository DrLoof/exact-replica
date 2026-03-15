import React, { useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";
import { Quote, Camera, X } from "lucide-react";

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
  onTitleEdit?: (value: string) => void;
  onCompanyEdit?: (value: string) => void;
  onMetricValueEdit?: (value: string) => void;
  onMetricLabelEdit?: (value: string) => void;
  onAvatarUpload?: (file: File) => void;
  onRemove?: () => void;
}

export function TestimonialCard({
  clientName, clientTitle, clientCompany, quote,
  metricValue, metricLabel, avatarUrl,
  featured = false, delay = 0, onQuoteEdit, onNameEdit,
  onTitleEdit, onCompanyEdit, onMetricValueEdit, onMetricLabelEdit,
  onAvatarUpload, onRemove,
}: TestimonialCardProps) {
  const brand = useBrand();
  const template = useTemplate();
  const [hovered, setHovered] = useState(false);

  const removeButton = onRemove ? (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className={`absolute top-3 right-3 z-10 p-1.5 rounded-full transition-opacity duration-200 print:hidden ${hovered ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      title="Remove testimonial"
    >
      <X className="h-3.5 w-3.5 text-white" />
    </button>
  ) : null;
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (onAvatarUpload) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
      e.target.value = '';
    }
  };

  const renderAvatar = (size: string, rounded: string, bgStyle: React.CSSProperties, textStyle: React.CSSProperties) => {
    const sizeClass = size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
    const canUpload = !!onAvatarUpload;
    return (
      <div className={`relative ${canUpload ? 'cursor-pointer group/avatar' : ''}`} onClick={handleAvatarClick}>
        {canUpload && (
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        )}
        {avatarUrl ? (
          <img src={avatarUrl} alt={clientName} className={`${sizeClass} ${rounded} object-cover`} />
        ) : (
          <div className={`${sizeClass} ${rounded} flex items-center justify-center`} style={bgStyle}>
            <span style={textStyle}>{clientName.charAt(0)}</span>
          </div>
        )}
        {canUpload && (
          <div className={`absolute inset-0 ${rounded} bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity print:hidden`}>
            <Camera className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  const renderName = () => onNameEdit ? (
    <EditableText value={clientName} placeholder="Client name..." onSave={onNameEdit} as="span" />
  ) : clientName;

  const renderTitleCompany = (style: React.CSSProperties) => {
    if (!onTitleEdit && !onCompanyEdit) {
      if (!clientTitle && !clientCompany) return null;
      return (
        <span className="block" style={style}>
          {clientTitle}{clientTitle && clientCompany ? " · " : ""}{clientCompany}
        </span>
      );
    }
    return (
      <span className="block" style={style}>
        {onTitleEdit ? (
          <EditableText value={clientTitle || ''} placeholder="Title..." onSave={onTitleEdit} as="span" />
        ) : clientTitle}
        {(clientTitle || onTitleEdit) && (clientCompany || onCompanyEdit) ? " · " : ""}
        {onCompanyEdit ? (
          <EditableText value={clientCompany || ''} placeholder="Company..." onSave={onCompanyEdit} as="span" />
        ) : clientCompany}
      </span>
    );
  };

  const [showMetricInputs, setShowMetricInputs] = useState(false);
  const [metricDraft, setMetricDraft] = useState({ value: '', label: '' });

  const handleSaveMetric = () => {
    if (metricDraft.value.trim() && onMetricValueEdit) {
      onMetricValueEdit(metricDraft.value.trim());
      if (onMetricLabelEdit && metricDraft.label.trim()) {
        onMetricLabelEdit(metricDraft.label.trim());
      }
    }
    setShowMetricInputs(false);
    setMetricDraft({ value: '', label: '' });
  };

  const renderMetricPopover = () => {
    if (!showMetricInputs) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden" onClick={() => setShowMetricInputs(false)}>
        <div className="absolute inset-0 bg-black/20" />
        <div
          className="relative bg-white rounded-xl shadow-xl p-5 w-[320px]"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          <h4 className="text-[14px] font-semibold mb-3" style={{ color: '#2D2A26' }}>Add KPI</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide" style={{ color: '#999' }}>Metric value</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. +265%"
                value={metricDraft.value}
                onChange={(e) => setMetricDraft(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveMetric()}
                className="w-full px-3 py-2 text-[14px] rounded-lg border border-[#E5E0D8] focus:outline-none focus:ring-2 focus:ring-[#E8825C]/30 focus:border-[#E8825C]"
                style={{ color: '#2D2A26' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1 uppercase tracking-wide" style={{ color: '#999' }}>Label</label>
              <input
                type="text"
                placeholder="e.g. Facebook ROAS"
                value={metricDraft.label}
                onChange={(e) => setMetricDraft(prev => ({ ...prev, label: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveMetric()}
                className="w-full px-3 py-2 text-[14px] rounded-lg border border-[#E5E0D8] focus:outline-none focus:ring-2 focus:ring-[#E8825C]/30 focus:border-[#E8825C]"
                style={{ color: '#2D2A26' }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowMetricInputs(false)}
              className="flex-1 px-3 py-2 text-[13px] font-medium rounded-lg border border-[#E5E0D8] hover:bg-[#F5F0EB] transition-colors"
              style={{ color: '#7A7266' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMetric}
              disabled={!metricDraft.value.trim()}
              className="flex-1 px-3 py-2 text-[13px] font-medium rounded-lg text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#E8825C' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMetric = (valueStyle: React.CSSProperties, labelStyle: React.CSSProperties, containerStyle?: React.CSSProperties, containerClass?: string) => {
    // Has metric data — show it (editable or static)
    if (metricValue) {
      return (
        <div className={containerClass || "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"} style={containerStyle}>
          {onMetricValueEdit ? (
            <EditableText value={metricValue} placeholder="Metric..." onSave={onMetricValueEdit} as="span" style={valueStyle} />
          ) : (
            <span style={valueStyle}>{metricValue}</span>
          )}
          {(metricLabel || onMetricLabelEdit) && (
            onMetricLabelEdit ? (
              <EditableText value={metricLabel || ''} placeholder="Label..." onSave={onMetricLabelEdit} as="span" style={labelStyle} />
            ) : (
              <span style={labelStyle}>{metricLabel}</span>
            )
          )}
        </div>
      );
    }

    // No metric, callbacks available — show "Add KPI" button (hidden in print)
    if (onMetricValueEdit && !metricValue) {
      return (
        <>
          {renderMetricPopover()}
          <button
            onClick={() => setShowMetricInputs(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-[12px] font-medium transition-all duration-200 opacity-60 hover:opacity-100 print:hidden"
            style={{ 
              backgroundColor: containerStyle?.background as string || 'rgba(110,154,122,0.1)', 
              color: valueStyle.color as string || '#6E9A7A' 
            }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            + Add KPI
          </button>
        </>
      );
    }

    return null;
  };

  // Wrap helper for hover remove button
  const wrapProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  // Soft featured
  if (isSoft && featured) {
    return (
      <motion.div
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl p-10 relative"
        style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: accent }}
      >
        {removeButton}
        <Quote size={28} style={{ color: "rgba(255,255,255,0.25)" }} className="mb-6" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-8"
            style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }} />
        ) : (
          <blockquote className="mb-8" style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
            "{quote}"
          </blockquote>
        )}
        {renderMetric(
          { fontSize: "18px", fontWeight: 600, color: "white" },
          { fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
          { background: "rgba(255,255,255,0.15)" },
          "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        )}
        <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div className="flex items-center gap-4">
            {renderAvatar('lg', 'rounded-xl', { backgroundColor: "rgba(255,255,255,0.2)" }, { fontSize: "16px", fontWeight: 600, color: "white" })}
            <div>
              <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>{onNameEdit ? renderName() : clientName}</span>
              {renderTitleCompany({ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Soft non-featured
  if (isSoft) {
    const border = template.colors.border;
    const bg = template.colors.background;
    return (
      <motion.div
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="rounded-2xl p-8 transition-all duration-300 relative"
        style={{ fontFamily: "'DM Sans', sans-serif", background: "white", border: `1px solid ${border}` }}
        onMouseEnter={(e) => { setHovered(true); e.currentTarget.style.borderColor = `${accent}40`; }}
        onMouseLeave={(e) => { setHovered(false); e.currentTarget.style.borderColor = border; }}
      >
        {removeButton}
        <Quote size={20} style={{ color: `${accent}33` }} className="mb-4" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textBody }} />
        ) : (
          <blockquote className="mb-6" style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textBody }}>
            "{quote}"
          </blockquote>
        )}
        {renderMetric(
          { fontSize: "14px", fontWeight: 600, color: accent },
          { fontSize: "10px", fontWeight: 500, color: accent, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
          { background: bg },
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
        )}
        <div className="pt-5" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            {renderAvatar('sm', 'rounded-xl', { backgroundColor: bg, color: accent }, { fontSize: "14px", fontWeight: 600 })}
            <div>
              <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{onNameEdit ? renderName() : clientName}</span>
              {renderTitleCompany({ fontSize: "12px", fontWeight: 400, color: template.colors.textFaint })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Elegant featured
  if (isElegant && featured) {
    return (
      <motion.div
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-3xl p-10 relative"
        style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: accent }}
      >
        {removeButton}
        <Quote size={28} style={{ color: "rgba(255,255,255,0.25)" }} className="mb-6" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-8"
            style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }} />
        ) : (
          <blockquote className="mb-8"
            style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
            "{quote}"
          </blockquote>
        )}
        {renderMetric(
          { fontSize: "18px", fontWeight: 600, color: "white", fontFamily: "'Fraunces', serif" },
          { fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
          { background: "rgba(255,255,255,0.15)" },
          "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        )}
        <div className="pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div className="flex items-center gap-4">
            {renderAvatar('lg', 'rounded-2xl', { backgroundColor: "rgba(255,255,255,0.2)" }, { fontSize: "16px", fontWeight: 600, color: "white" })}
            <div>
              <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>{onNameEdit ? renderName() : clientName}</span>
              {renderTitleCompany({ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Elegant non-featured
  if (isElegant) {
    const border = template.colors.border;
    const accentTint = `${accent}0F`;
    return (
      <motion.div
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl p-8 transition-all duration-300 relative"
        style={{ fontFamily: "'DM Sans', sans-serif", background: "white", border: `1px solid ${border}` }}
        onMouseEnter={(e) => { setHovered(true); e.currentTarget.style.borderColor = `${accent}40`; }}
        onMouseLeave={(e) => { setHovered(false); e.currentTarget.style.borderColor = border; }}
      >
        {removeButton}
        <Quote size={20} style={{ color: `${accent}26` }} className="mb-4" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-6"
            style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textBody }} />
        ) : (
          <blockquote className="mb-6"
            style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textBody }}>
            "{quote}"
          </blockquote>
        )}
        {renderMetric(
          { fontSize: "14px", fontWeight: 600, color: accent, fontFamily: "'Fraunces', serif" },
          { fontSize: "10px", fontWeight: 500, color: accent, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
          { background: accentTint },
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
        )}
        <div className="pt-5" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            {renderAvatar('sm', 'rounded-2xl', { backgroundColor: `${accent}15`, color: accent }, { fontSize: "14px", fontWeight: 600 })}
            <div>
              <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{onNameEdit ? renderName() : clientName}</span>
              {renderTitleCompany({ fontSize: "12px", fontWeight: 400, color: template.colors.textFaint })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Modern featured
  if (isModern && featured) {
    return (
      <motion.div
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-3xl p-10 relative"
        style={{ fontFamily: "'Outfit', sans-serif", backgroundColor: dark, boxShadow: `0 12px 40px ${dark}33` }}
      >
        {removeButton}
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
        {renderMetric(
          { fontSize: "18px", fontWeight: 800, color: secondary, fontFamily: "'Fraunces', serif" },
          { fontSize: "11px", fontWeight: 500, color: secondary, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
          { background: `${secondary}26` },
          "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        )}
        <div className="pt-6 mb-0" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-4">
            {renderAvatar('lg', 'rounded-full', { backgroundColor: accent, boxShadow: "2px 2px 0px rgba(255,255,255,0.15)" }, { fontSize: "16px", fontWeight: 700, color: "white" })}
            <div>
              <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>{onNameEdit ? renderName() : clientName}</span>
              {renderTitleCompany({ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.45)" })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Modern non-featured
  if (isModern) {
    return (
      <motion.div
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 relative"
        style={{ fontFamily: "'Outfit', sans-serif", background: template.colors.cardBackground, border: `2px solid ${template.colors.border}`, boxShadow: `0 2px 12px ${dark}0A` }}
      >
        {removeButton}
        <Quote size={20} style={{ color: `${accent}30` }} className="mb-4" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="mb-6"
            style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textBody, fontFamily: "'Fraunces', serif", fontStyle: "italic" }} />
        ) : (
          <blockquote className="mb-6"
            style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textBody, fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
            "{quote}"
          </blockquote>
        )}
        {renderMetric(
          { fontSize: "14px", fontWeight: 700, color: accent, fontFamily: "'Fraunces', serif" },
          { fontSize: "10px", fontWeight: 500, color: accent, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
          { background: `${accent}10` },
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
        )}
        <div className="pt-5" style={{ borderTop: `2px dashed ${template.colors.border}` }}>
          <div className="flex items-center gap-3">
            {renderAvatar('sm', 'rounded-full', { backgroundColor: dark, boxShadow: `2px 2px 0px ${accent}40` }, { fontSize: "14px", fontWeight: 700, color: "white" })}
            <div>
              <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>{onNameEdit ? renderName() : clientName}</span>
              {renderTitleCompany({ fontSize: "12px", fontWeight: 400, color: template.colors.textFaint })}
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
        {...wrapProps}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl p-10 lg:p-12 relative"
        style={{ fontFamily: "'Space Grotesk', sans-serif", backgroundColor: brand.darkColor }}
      >
        {removeButton}
        <Quote size={28} className="text-white/20 mb-6" />
        {onQuoteEdit ? (
          <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
            className="text-white mb-8"
            style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1.6 }} />
        ) : (
          <blockquote className="text-white mb-8" style={{ fontSize: "20px", fontWeight: 400, lineHeight: 1.6 }}>"{quote}"</blockquote>
        )}
        <div className="flex items-center gap-4">
          {renderAvatar('lg', 'rounded-full', { backgroundColor: brand.primaryColor }, { fontSize: "16px", fontWeight: 700, color: "white" })}
          <div>
            <span className="block text-white" style={{ fontSize: "15px", fontWeight: 600 }}>{onNameEdit ? renderName() : clientName}</span>
            {renderTitleCompany({ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" })}
          </div>
          {renderMetric(
            { fontSize: "24px", fontWeight: 700, color: "white" },
            { fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.1em" },
            {},
            "ml-auto text-right"
          )}
        </div>
      </motion.div>
    );
  }

  // Classic non-featured
  return (
    <motion.div
      {...wrapProps}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="bg-white border border-[#EBEBEB] rounded-2xl p-8 relative"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {removeButton}
      <Quote size={20} style={{ color: `${brand.primaryColor}40` }} className="mb-4" />
      {onQuoteEdit ? (
        <EditableText value={quote} placeholder="Click to add a quote..." onSave={onQuoteEdit} as="p"
          className="text-[#555] mb-6"
          style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }} />
      ) : (
        <blockquote className="text-[#555] mb-6" style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>"{quote}"</blockquote>
      )}
      {renderMetric(
        { fontSize: "14px", fontWeight: 700, color: brand.primaryColor },
        { fontSize: "10px", fontWeight: 500, color: brand.primaryColor, textTransform: "uppercase" as const, letterSpacing: "0.1em" },
        { background: `${brand.primaryColor}10` },
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
      )}
      <div className="flex items-center gap-3">
        {renderAvatar('sm', 'rounded-full', { backgroundColor: `${brand.primaryColor}15`, color: brand.primaryColor }, { fontSize: "14px", fontWeight: 700 })}
        <div>
          <span className="block" style={{ fontSize: "14px", fontWeight: 600, color: brand.darkColor }}>{onNameEdit ? renderName() : clientName}</span>
          {renderTitleCompany({ fontSize: "12px", fontWeight: 400, color: "#999" })}
        </div>
      </div>
    </motion.div>
  );
}
