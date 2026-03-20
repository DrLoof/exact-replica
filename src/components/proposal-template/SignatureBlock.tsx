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
  closingHeading?: string;
  closingSubtitle?: string;
  closingEmail?: string;
  closingPhone?: string;
  onClosingHeadingEdit?: (value: string) => void;
  onClosingSubtitleEdit?: (value: string) => void;
  onClosingEmailEdit?: (value: string) => void;
  onClosingPhoneEdit?: (value: string) => void;
}

export function SignatureBlock({
  heading = "Ready to proceed?",
  subtitle = "By signing below, both parties agree to the terms outlined in this proposal.",
  client, agency, onHeadingEdit, onSubtitleEdit,
  closingHeading, closingSubtitle, closingEmail, closingPhone,
  onClosingHeadingEdit, onClosingSubtitleEdit, onClosingEmailEdit, onClosingPhoneEdit,
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

  const resolvedClosingHeading = closingHeading ?? `Thank you for considering ${brand.agencyFullName}.`;
  const resolvedClosingSubtitle = closingSubtitle ?? "We're excited about the possibility of working together.";
  const resolvedEmail = closingEmail ?? brand.contactEmail;
  const resolvedPhone = closingPhone ?? brand.contactPhone;

  // Helper to render the closing/footer section with editable fields
  function renderClosingSection(opts: {
    logoStyle?: React.CSSProperties;
    headingStyle: React.CSSProperties;
    subtitleStyle: React.CSSProperties;
    contactStyle: React.CSSProperties;
    separatorStyle?: React.CSSProperties;
    disclaimerStyle: React.CSSProperties;
    contactLayout: 'inline' | 'pills';
    pillStyle?: React.CSSProperties;
  }) {
    const editable = !!(onClosingHeadingEdit || onClosingSubtitleEdit || onClosingEmailEdit || onClosingPhoneEdit);

    return (
      <>
        <div className="mt-20 text-center">
          <div className="inline-block">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain mx-auto mb-4" />
            ) : opts.contactLayout === 'pills' ? (
              // Modern fallback
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: dark }}>
                <span className="text-white" style={{ fontSize: "16px", fontWeight: 800 }}>
                  {brand.agencyName?.charAt(0) || 'A'}
                </span>
              </div>
            ) : template.id === 'elegant' ? (
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: accent }}>
                <span className="text-white" style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'Fraunces', serif" }}>
                  {brand.agencyName?.charAt(0) || 'A'}
                </span>
              </div>
            ) : template.id === 'soft' ? (
              <span className="block mb-4 uppercase tracking-[0.15em]" style={{ fontSize: "14px", fontWeight: 600, color: dark }}>
                {brand.agencyName}
              </span>
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: brand.darkColor }}>
                <span className="text-white tracking-tighter" style={{ fontSize: "13px", fontWeight: 700 }}>{brand.logoInitial}</span>
              </div>
            )}

            {onClosingHeadingEdit ? (
              <EditableText value={resolvedClosingHeading} placeholder="Closing heading..." onSave={onClosingHeadingEdit} as="p"
                className="mb-2" style={opts.headingStyle} />
            ) : (
              <p className="mb-2" style={opts.headingStyle}>{resolvedClosingHeading}</p>
            )}

            {onClosingSubtitleEdit ? (
              <EditableText value={resolvedClosingSubtitle} placeholder="Closing subtitle..." onSave={onClosingSubtitleEdit} as="p"
                style={opts.subtitleStyle} />
            ) : (
              <p style={opts.subtitleStyle}>{resolvedClosingSubtitle}</p>
            )}

            {opts.contactLayout === 'pills' ? (
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                {resolvedEmail && (
                  onClosingEmailEdit ? (
                    <EditableText value={resolvedEmail} placeholder="Email..." onSave={onClosingEmailEdit} as="span"
                      className="px-4 py-2 rounded-full inline-block" style={opts.pillStyle} />
                  ) : (
                    <span className="px-4 py-2 rounded-full" style={opts.pillStyle}>{resolvedEmail}</span>
                  )
                )}
                {brand.contactWebsite && (
                  <span className="px-4 py-2 rounded-full" style={opts.pillStyle}>{brand.contactWebsite}</span>
                )}
                {resolvedPhone && (
                  onClosingPhoneEdit ? (
                    <EditableText value={resolvedPhone} placeholder="Phone..." onSave={onClosingPhoneEdit} as="span"
                      className="px-4 py-2 rounded-full inline-block" style={opts.pillStyle} />
                  ) : (
                    <span className="px-4 py-2 rounded-full" style={opts.pillStyle}>{resolvedPhone}</span>
                  )
                )}
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-6">
                {resolvedEmail && (
                  onClosingEmailEdit ? (
                    <EditableText value={resolvedEmail} placeholder="Email..." onSave={onClosingEmailEdit} as="span"
                      className="inline-block" style={opts.contactStyle} />
                  ) : (
                    <span style={opts.contactStyle}>{resolvedEmail}</span>
                  )
                )}
                {resolvedEmail && brand.contactWebsite && <span style={opts.separatorStyle}>|</span>}
                {brand.contactWebsite && <span style={opts.contactStyle}>{brand.contactWebsite}</span>}
                {brand.contactWebsite && resolvedPhone && <span style={opts.separatorStyle}>|</span>}
                {resolvedPhone && (
                  onClosingPhoneEdit ? (
                    <EditableText value={resolvedPhone} placeholder="Phone..." onSave={onClosingPhoneEdit} as="span"
                      className="inline-block" style={opts.contactStyle} />
                  ) : (
                    <span style={opts.contactStyle}>{resolvedPhone}</span>
                  )
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-10 text-center">
          <p style={opts.disclaimerStyle}>
            This document constitutes a binding agreement upon signature by both parties.
          </p>
        </div>
      </>
    );
  }

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
        {renderClosingSection({
          headingStyle: { fontSize: "20px", fontWeight: 600, color: dark },
          subtitleStyle: { fontSize: "14px", fontWeight: 400, color: muted },
          contactStyle: { fontSize: "13px", color: faint },
          separatorStyle: { color: border },
          disclaimerStyle: { fontSize: "12px", fontWeight: 400, color: faint },
          contactLayout: 'inline',
        })}
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

        {renderClosingSection({
          headingStyle: { fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 500, color: dark },
          subtitleStyle: { fontSize: "14px", fontWeight: 400, color: muted },
          contactStyle: { fontSize: "13px", color: faint },
          separatorStyle: { color: border },
          disclaimerStyle: { fontSize: "12px", fontWeight: 400, color: faint },
          contactLayout: 'inline',
        })}
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
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textMuted }} />
          ) : (
            <p className="max-w-md mx-auto mt-4"
              style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: template.colors.textMuted }}>
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
                  <div className="h-16 mb-2 rounded-lg" style={{ background: `${accent}0A`, borderBottom: `3px solid ${accent}` }} />
                  <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: template.colors.textFaint }}>
                    Signature
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: `2px dashed ${template.colors.border}` }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: template.colors.textFaint }}>
                      Printed Name
                    </span>
                  </div>
                  <div>
                    <div className="h-10 mb-2" style={{ borderBottom: `2px dashed ${template.colors.border}` }} />
                    <span className="uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500, color: template.colors.textFaint }}>
                      Date
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {renderClosingSection({
          headingStyle: { fontFamily: "'Fraunces', serif", fontSize: "20px", fontWeight: 700, color: dark },
          subtitleStyle: { fontSize: "14px", fontWeight: 400, color: template.colors.textMuted },
          contactStyle: { fontSize: "13px", fontWeight: 500 },
          disclaimerStyle: { fontSize: "12px", fontWeight: 400, color: template.colors.textFaint },
          contactLayout: 'pills',
          pillStyle: { background: `${accent}10`, color: accent, fontSize: "13px", fontWeight: 500 },
        })}
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

      {renderClosingSection({
        headingStyle: { fontSize: "20px", fontWeight: 700, color: brand.darkColor },
        subtitleStyle: { fontSize: "14px", fontWeight: 400, color: '#999' },
        contactStyle: { fontSize: "13px", color: '#BBB' },
        separatorStyle: { color: '#E0E0E0' },
        disclaimerStyle: { fontSize: "12px", fontWeight: 400, color: '#CCC' },
        contactLayout: 'inline',
      })}
    </motion.div>
  );
}
