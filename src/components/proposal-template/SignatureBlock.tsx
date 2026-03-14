import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { EditableText } from "./EditableText";
import { Pen } from "lucide-react";

interface SignatureParty {
  role: string;
  companyName: string;
  personName?: string;
  title?: string;
}

interface SignatureBlockProps {
  heading?: string;
  subtitle?: string;
  client: SignatureParty;
  agency?: SignatureParty;
  onHeadingEdit?: (value: string) => void;
  onSubtitleEdit?: (value: string) => void;
}

export function SignatureBlock({
  heading = "Ready to proceed?",
  subtitle = "By signing below, both parties agree to the terms outlined in this proposal.",
  client, agency, onHeadingEdit, onSubtitleEdit,
}: SignatureBlockProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const isSoft = template.id === 'soft';
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;

  const agencyParty: SignatureParty = agency || {
    role: "Agency",
    companyName: brand.agencyFullName,
  };

  if (isSoft) {
    const border = template.colors.border;
    const muted = template.colors.textMuted;
    const faint = template.colors.textFaint;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center mb-14">
          {onHeadingEdit ? (
            <EditableText value={heading} placeholder="Heading..." onSave={onHeadingEdit} as="h1"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 600, lineHeight: 1.1, color: dark }} />
          ) : (
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 600, lineHeight: 1.1, color: dark }}>{heading}</h2>
          )}
          {onSubtitleEdit ? (
            <EditableText value={subtitle} placeholder="Subtitle..." onSave={onSubtitleEdit} as="p"
              className="max-w-md mx-auto mt-4"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
          ) : (
            <p className="max-w-md mx-auto mt-4" style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: muted }}>{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {[client, agencyParty].map((party, idx) => (
            <motion.div key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
              className="rounded-2xl p-8 lg:p-10"
              style={{ background: "white", border: `1px solid ${border}` }}
            >
              <span className="inline-block mb-6 uppercase tracking-[0.2em]"
                style={{ fontSize: "11px", fontWeight: 600, color: accent }}>
                {party.role}
              </span>
              <div className="mb-8">
                <span className="block mb-1" style={{ fontSize: "20px", fontWeight: 600, color: dark }}>{party.companyName}</span>
                {party.personName && (
                  <span className="block" style={{ fontSize: "14px", fontWeight: 400, color: muted }}>
                    {party.personName}{party.title ? ` — ${party.title}` : ""}
                  </span>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <div className="h-16 mb-2" style={{ borderBottom: `2px solid ${accent}66` }} />
                  <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: faint }}>Signature</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: `1px solid ${border}` }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: faint }}>Printed Name</span>
                  </div>
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: `1px solid ${border}` }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: faint }}>Date</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-20 text-center">
          <div className="inline-block">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain mx-auto mb-4" />
            ) : (
              <span className="block mb-4 uppercase tracking-[0.15em]" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>
                {brand.agencyName}
              </span>
            )}
            <p className="mb-2" style={{ fontSize: "20px", fontWeight: 600, color: dark }}>
              Thank you for considering {brand.agencyFullName}.
            </p>
            <p style={{ fontSize: "14px", fontWeight: 400, color: muted }}>
              We're excited about the possibility of working together.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6">
              {brand.contactEmail && <span style={{ fontSize: "13px", color: faint }}>{brand.contactEmail}</span>}
              {brand.contactEmail && brand.contactWebsite && <span style={{ color: border }}>|</span>}
              {brand.contactWebsite && <span style={{ fontSize: "13px", color: faint }}>{brand.contactWebsite}</span>}
              {brand.contactWebsite && brand.contactPhone && <span style={{ color: border }}>|</span>}
              {brand.contactPhone && <span style={{ fontSize: "13px", color: faint }}>{brand.contactPhone}</span>}
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <p style={{ fontSize: "12px", fontWeight: 400, color: faint }}>
            This document constitutes a binding agreement upon signature by both parties.
          </p>
        </div>
      </motion.div>
    );
  }

  if (isElegant) {
    const border = template.colors.border;
    const muted = template.colors.textMuted;
    const faint = template.colors.textFaint;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center mb-14">
          {onHeadingEdit ? (
            <EditableText value={heading} placeholder="Heading..." onSave={onHeadingEdit} as="h1"
              style={{
                fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 500, lineHeight: 1.1, color: dark,
              }} />
          ) : (
            <h2 style={{
              fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 500, lineHeight: 1.1, color: dark,
            }}>
              {heading}
            </h2>
          )}
          {onSubtitleEdit ? (
            <EditableText value={subtitle} placeholder="Subtitle..." onSave={onSubtitleEdit} as="p"
              className="max-w-md mx-auto mt-4"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: muted }} />
          ) : (
            <p className="max-w-md mx-auto mt-4"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: muted }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {[client, agencyParty].map((party, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
              className="rounded-3xl p-8 lg:p-10"
              style={{ background: "white", border: `1px solid ${border}` }}
            >
              <span className="inline-block mb-6 uppercase tracking-[0.2em]"
                style={{ fontSize: "11px", fontWeight: 600, color: accent }}>
                {party.role}
              </span>
              <div className="mb-8">
                <span className="block mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, color: dark }}>
                  {party.companyName}
                </span>
                {party.personName && (
                  <span className="block" style={{ fontSize: "14px", fontWeight: 400, color: muted }}>
                    {party.personName}{party.title ? ` — ${party.title}` : ""}
                  </span>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <div className="h-16 mb-2" style={{ borderBottom: `2px solid ${accent}4D` }} />
                  <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: faint }}>
                    Signature
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: `1px solid ${border}` }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: faint }}>
                      Printed Name
                    </span>
                  </div>
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: `1px solid ${border}` }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: faint }}>
                      Date
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="inline-block">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain mx-auto mb-4" />
            ) : (
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: accent }}>
                <span className="text-white" style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'Fraunces', serif" }}>
                  {brand.agencyName?.charAt(0) || 'A'}
                </span>
              </div>
            )}
            <p className="mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, color: dark }}>
              Thank you for considering {brand.agencyFullName}.
            </p>
            <p style={{ fontSize: "14px", fontWeight: 400, color: muted }}>
              We're excited about the possibility of working together.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6">
              {brand.contactEmail && <span style={{ fontSize: "13px", color: faint }}>{brand.contactEmail}</span>}
              {brand.contactEmail && brand.contactWebsite && <span style={{ color: border }}>|</span>}
              {brand.contactWebsite && <span style={{ fontSize: "13px", color: faint }}>{brand.contactWebsite}</span>}
              {brand.contactWebsite && brand.contactPhone && <span style={{ color: border }}>|</span>}
              {brand.contactPhone && <span style={{ fontSize: "13px", color: faint }}>{brand.contactPhone}</span>}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p style={{ fontSize: "12px", fontWeight: 400, color: faint }}>
            This document constitutes a binding agreement upon signature by both parties.
          </p>
        </div>
      </motion.div>
    );
  }

  if (isModern) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: `${secondary}15`, color: secondary, fontSize: "13px", fontWeight: 600 }}>
            <Pen size={13} />
            Ready to sign
          </div>
          {onHeadingEdit ? (
            <EditableText value={heading} placeholder="Heading..." onSave={onHeadingEdit} as="h1"
              style={{
                fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 700, lineHeight: 1.1, color: dark,
              }} />
          ) : (
            <h2 style={{
              fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 700, lineHeight: 1.1, color: dark,
            }}>
              {heading}
            </h2>
          )}
          {onSubtitleEdit ? (
            <EditableText value={subtitle} placeholder="Subtitle..." onSave={onSubtitleEdit} as="p"
              className="max-w-md mx-auto mt-4"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }} />
          ) : (
            <p className="max-w-md mx-auto mt-4"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "#9CA3AF" }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {[client, agencyParty].map((party, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
              className="rounded-3xl p-8 lg:p-10"
              style={{ background: template.colors.cardBackground, border: `2px solid ${template.colors.border}` }}
            >
              <span className="inline-block px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider"
                style={{ fontSize: "11px", fontWeight: 600, background: `${accent}12`, color: accent }}>
                {party.role}
              </span>
              <div className="mb-8">
                <span className="block mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, color: dark }}>
                  {party.companyName}
                </span>
                {party.personName && (
                <span className="block" style={{ fontSize: "14px", fontWeight: 400, color: template.colors.textMuted }}>
                    {party.personName}{party.title ? ` — ${party.title}` : ""}
                  </span>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <div className="h-16 mb-2 rounded-lg" style={{ background: `${accent}06`, borderBottom: `3px solid ${accent}` }} />
                  <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: "#D1D5DB" }}>
                    Signature
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: "2px dashed #E5E7EB" }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: "#D1D5DB" }}>
                      Printed Name
                    </span>
                  </div>
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: "2px dashed #E5E7EB" }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: "#D1D5DB" }}>
                      Date
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="inline-block">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain mx-auto mb-4" />
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: dark }}>
                <span className="text-white" style={{ fontSize: "16px", fontWeight: 800 }}>
                  {brand.agencyName?.charAt(0) || 'A'}
                </span>
              </div>
            )}
            <p className="mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, color: dark }}>
              Thank you for considering {brand.agencyFullName}.
            </p>
            <p style={{ fontSize: "14px", fontWeight: 400, color: "#9CA3AF" }}>
              We're excited about the possibility of working together.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              {brand.contactEmail && (
                <span className="px-4 py-2 rounded-full" style={{ background: `${accent}10`, color: accent, fontSize: "13px", fontWeight: 500 }}>
                  {brand.contactEmail}
                </span>
              )}
              {brand.contactWebsite && (
                <span className="px-4 py-2 rounded-full" style={{ background: `${accent}10`, color: accent, fontSize: "13px", fontWeight: 500 }}>
                  {brand.contactWebsite}
                </span>
              )}
              {brand.contactPhone && (
                <span className="px-4 py-2 rounded-full" style={{ background: `${accent}10`, color: accent, fontSize: "13px", fontWeight: 500 }}>
                  {brand.contactPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p style={{ fontSize: "12px", fontWeight: 400, color: "#D1D5DB" }}>
            This document constitutes a binding agreement upon signature by both parties.
          </p>
        </div>
      </motion.div>
    );
  }

  // Classic rendering
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="text-center mb-14">
        {onHeadingEdit ? (
          <EditableText value={heading} placeholder="Heading..." onSave={onHeadingEdit} as="h1"
            className="tracking-tight mb-3"
            style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, lineHeight: 1.1, color: brand.darkColor }} />
        ) : (
          <h2 className="tracking-tight mb-3"
            style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, lineHeight: 1.1, color: brand.darkColor }}>
            {heading}
          </h2>
        )}
        {onSubtitleEdit ? (
          <EditableText value={subtitle} placeholder="Subtitle..." onSave={onSubtitleEdit} as="p"
            className="text-[#888] max-w-md mx-auto"
            style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6 }} />
        ) : (
          <p className="text-[#888] max-w-md mx-auto" style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {[client, agencyParty].map((party, idx) => (
          <motion.div key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
            className="border border-[#EBEBEB] rounded-2xl p-8 lg:p-10"
          >
            <span className="inline-block uppercase tracking-[0.25em] mb-6"
              style={{ fontSize: "11px", fontWeight: 600, color: brand.primaryColor }}>
              {party.role}
            </span>
            <div className="mb-8">
              <span className="block mb-1" style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor }}>
                {party.companyName}
              </span>
              {party.personName && (
                <span className="block text-[#888]" style={{ fontSize: "14px", fontWeight: 400 }}>
                  {party.personName}{party.title ? ` — ${party.title}` : ""}
                </span>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <div className="h-16 border-b-2 mb-2" style={{ borderColor: brand.darkColor }} />
                <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500 }}>Signature</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="h-10 border-b border-[#E0E0E0] mb-2" />
                  <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500 }}>Printed Name</span>
                </div>
                <div>
                  <div className="h-10 border-b border-[#E0E0E0] mb-2" />
                  <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500 }}>Date</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <div className="inline-block">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain mx-auto mb-4" />
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: brand.darkColor }}>
              <span className="text-white tracking-tighter" style={{ fontSize: "13px", fontWeight: 700 }}>{brand.logoInitial}</span>
            </div>
          )}
          <p className="tracking-tight mb-2" style={{ fontSize: "20px", fontWeight: 700, color: brand.darkColor }}>
            Thank you for considering {brand.agencyFullName}.
          </p>
          <p className="text-[#999]" style={{ fontSize: "14px", fontWeight: 400 }}>
            We're excited about the possibility of working together.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6">
            {brand.contactEmail && <span className="text-[#BBB]" style={{ fontSize: "13px" }}>{brand.contactEmail}</span>}
            {brand.contactEmail && brand.contactWebsite && <span className="text-[#E0E0E0]">|</span>}
            {brand.contactWebsite && <span className="text-[#BBB]" style={{ fontSize: "13px" }}>{brand.contactWebsite}</span>}
            {brand.contactWebsite && brand.contactPhone && <span className="text-[#E0E0E0]">|</span>}
            {brand.contactPhone && <span className="text-[#BBB]" style={{ fontSize: "13px" }}>{brand.contactPhone}</span>}
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-[#CCC]" style={{ fontSize: "12px", fontWeight: 400 }}>
          This document constitutes a binding agreement upon signature by both parties.
        </p>
      </div>
    </motion.div>
  );
}
