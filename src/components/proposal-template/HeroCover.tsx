import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";
import { useTemplate } from "./TemplateProvider";
import { usePDFMode } from "./TemplateProvider";
import { EditableText } from "./EditableText";

function formatDisplayDate(date?: string): string {
  if (!date) return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  // If ISO date like "2026-03-23", format it
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function hasRealSubtitle(subtitle?: string): boolean {
  if (!subtitle) return false;
  const trimmed = subtitle.trim();
  return trimmed !== '' && !trimmed.startsWith('Click to');
}

interface HeroCoverProps {
  proposalTitle: string;
  subtitle?: string;
  clientName: string;
  date?: string;
  proposalNumber?: string;
  confidential?: boolean;
  onTitleEdit?: (value: string) => void;
  onSubtitleEdit?: (value: string) => void;
  onClientNameEdit?: (value: string) => void;
  onDateEdit?: (value: string) => void;
  onLogoClick?: () => void;
}

function ElegantHeroCover({
  proposalTitle, subtitle, clientName, date, proposalNumber,
  onTitleEdit, onSubtitleEdit, onClientNameEdit, onDateEdit, onLogoClick,
}: HeroCoverProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isPDF = usePDFMode();
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;
  const muted = template.colors.textMuted;
  const faint = template.colors.textFaint;
  const border = template.colors.border;
  const displayDate = formatDisplayDate(date);
  const agencyInitial = brand.agencyName?.charAt(0) || 'A';

  const Wrapper = isPDF ? 'div' : motion.div;
  const wrapperProps = (props: any) => isPDF ? {} : props;

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col" style={{ background: "#FAFAF8" }}>
      {/* Soft gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[15%] w-[65%] h-[65%] rounded-full bg-[#EDE5FF] blur-[100px] opacity-70" />
        <div className="absolute -bottom-[15%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#FFE4D6] blur-[100px] opacity-50" />
        <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] rounded-full blur-[80px]"
          style={{ background: accent, opacity: 0.1 }} />
      </div>

      {/* Top Bar */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2, duration: 0.5 } })}
        className="relative z-10 flex items-center justify-between px-10 pt-10 lg:px-16 lg:pt-14"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex items-center gap-3" onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : undefined }} title={onLogoClick ? 'Click to replace logo' : undefined}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain brightness-0 hover:opacity-80 transition-opacity" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: accent }}>
                <span className="text-white" style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{agencyInitial}</span>
              </div>
              <span className="tracking-[0.15em] uppercase" style={{ fontSize: "13px", fontWeight: 600, color: dark }}>{brand.agencyName}</span>
            </>
          )}
        </div>
        {proposalNumber && (
          <span style={{ fontSize: "12px", fontWeight: 400, color: muted }}>{proposalNumber}</span>
        )}
      </Wrapper>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 lg:px-16 max-w-3xl">
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.7, ease: "easeOut" } })}
        >
          <span className="inline-block mb-8" style={{ fontSize: "14px", fontWeight: 500, letterSpacing: "0.05em", color: accent }}>Proposal</span>
          {onTitleEdit ? (
            <EditableText value={proposalTitle} placeholder="Enter proposal title..." onSave={onTitleEdit} as="h1"
              style={{
                fontFamily: "'Fraunces', serif", fontSize: isPDF ? "54px" : "clamp(38px, 5.5vw, 68px)",
                fontWeight: 600, lineHeight: 1.1, color: dark, letterSpacing: "-0.01em",
              }} />
          ) : (
            <h1 style={{
              fontFamily: "'Fraunces', serif", fontSize: isPDF ? "54px" : "clamp(38px, 5.5vw, 68px)",
              fontWeight: 600, lineHeight: 1.1, color: dark, letterSpacing: "-0.01em",
            }}>
              {proposalTitle}
            </h1>
          )}
          {(onSubtitleEdit || hasRealSubtitle(subtitle)) && (
            onSubtitleEdit ? (
              <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
                className="max-w-lg mt-6"
                style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: muted, fontFamily: "'DM Sans', sans-serif" }} />
            ) : (
              <p className="max-w-lg mt-6" style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: muted, fontFamily: "'DM Sans', sans-serif" }}>
                {subtitle}
              </p>
            )
          )}
          <div className="mt-16 flex items-center gap-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div>
              <span className="block mb-1" style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", color: muted }}>Prepared for</span>
              {onClientNameEdit ? (
                <EditableText value={clientName} placeholder="Client name" onSave={onClientNameEdit} as="span"
                  style={{ fontSize: "16px", fontWeight: 600, color: dark }} />
              ) : (
                <span style={{ fontSize: "16px", fontWeight: 600, color: dark }}>{clientName}</span>
              )}
            </div>
            <div className="w-px h-8" style={{ background: border }} />
            <div>
              <span className="block mb-1" style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", color: muted }}>Date</span>
              {onDateEdit ? (
                <EditableText value={displayDate} placeholder="Date" onSave={onDateEdit} as="span"
                  style={{ fontSize: "16px", fontWeight: 600, color: dark }} />
              ) : (
                <span style={{ fontSize: "16px", fontWeight: 600, color: dark }}>{displayDate}</span>
              )}
            </div>
          </div>
        </Wrapper>
      </div>

      {/* Bottom */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.8, duration: 0.5 } })}
        className="relative z-10 px-10 lg:px-16 pb-10"
      >
        <div className="h-px mb-6" style={{ background: border }} />
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", color: faint }}>Confidential</span>
          <span style={{ fontSize: "11px", fontWeight: 500, color: faint }}>01 / 09</span>
        </div>
      </Wrapper>
    </div>
  );
}

function ModernHeroCover({
  proposalTitle, subtitle, clientName, date, proposalNumber,
  onTitleEdit, onSubtitleEdit, onClientNameEdit, onDateEdit, onLogoClick,
}: HeroCoverProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isPDF = usePDFMode();
  const accent = template.colors.primaryAccent;
  const secondary = template.colors.secondaryAccent;
  const dark = template.colors.primaryDark;
  const textBody = template.colors.textBody;
  const textFaint = template.colors.textFaint;
  const displayDate = formatDisplayDate(date);

  const Wrapper = isPDF ? 'div' : motion.div;
  const wrapperProps = (props: any) => isPDF ? {} : props;

  const renderTitle = (text: string) => {
    if (!text.includes("&")) return text;
    return text.split("&").map((part, i, arr) => (
      <React.Fragment key={i}>
        {part}
        {i < arr.length - 1 && <span style={{ color: secondary }}>&amp;</span>}
      </React.Fragment>
    ));
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: "#FAFAF8", fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Background blobs */}
      {!isPDF && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full"
            style={{ background: accent, opacity: 0.08, filter: 'blur(80px)' }} />
          <div className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] rounded-full"
            style={{ background: accent, opacity: 0.06, filter: 'blur(80px)' }} />
          <div className="absolute top-[40%] -left-[5%] w-[300px] h-[300px] rounded-full"
            style={{ background: accent, opacity: 0.05, filter: 'blur(60px)' }} />
          <div className="absolute bottom-[15%] right-[25%] w-[200px] h-[200px] rounded-full"
            style={{ background: secondary, opacity: 0.04, filter: 'blur(60px)' }} />
        </div>
      )}

      {/* Small decorative shapes */}
      {!isPDF && (
        <>
          <div className="absolute top-[20%] left-[8%] w-3 h-3 rounded-sm pointer-events-none"
            style={{ background: accent, opacity: 0.2, animation: 'spin 20s linear infinite' }} />
          <div className="absolute top-[55%] left-[5%] w-2.5 h-2.5 rounded-full pointer-events-none"
            style={{ background: accent, opacity: 0.25, animation: 'pulse 3s ease-in-out infinite' }} />
        </>
      )}

      {/* Top bar */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2, duration: 0.5 } })}
        className="relative z-10 flex items-center justify-between px-8 pt-8 lg:px-14 lg:pt-12"
      >
        <div className="flex items-center gap-3" onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : undefined }} title={onLogoClick ? 'Click to replace logo' : undefined}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain brightness-0 hover:opacity-80 transition-opacity" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: dark }}>
                <span className="text-white" style={{ fontSize: "16px", fontWeight: 800 }}>
                  {brand.agencyName?.charAt(0) || 'A'}
                </span>
              </div>
              <span className="tracking-wide uppercase"
                style={{ fontSize: "14px", fontWeight: 700, color: dark }}>
                {brand.agencyName}
              </span>
            </>
          )}
        </div>
        {proposalNumber && (
          <div className="px-4 py-1.5 rounded-full"
            style={{ background: `${accent}15`, color: accent, fontSize: "12px", fontWeight: 600 }}>
            {proposalNumber}
          </div>
        )}
      </Wrapper>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 lg:px-14 max-w-3xl">
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.7, ease: "easeOut" } })}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: `${secondary}15`, color: secondary, fontSize: "14px", fontWeight: 600 }}>
            Proposal for {clientName}
          </div>

          {onTitleEdit ? (
            <EditableText
              value={proposalTitle}
              placeholder="Enter proposal title..."
              onSave={onTitleEdit}
              as="h1"
              className="mb-4"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: isPDF ? "56px" : "clamp(40px, 6vw, 72px)",
                fontWeight: 800, lineHeight: 1.05, color: dark, letterSpacing: "-0.02em",
              }}
            />
          ) : (
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: isPDF ? "56px" : "clamp(40px, 6vw, 72px)",
              fontWeight: 800, lineHeight: 1.05, color: dark, letterSpacing: "-0.02em",
            }}>
              {renderTitle(proposalTitle)}
            </h1>
          )}

          {(subtitle || onSubtitleEdit) && (
            onSubtitleEdit ? (
              <EditableText
                value={subtitle || ''}
                placeholder="Click to add a subtitle..."
                onSave={onSubtitleEdit}
                as="p"
                className="max-w-lg mt-6"
                style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.7, color: textBody, fontFamily: "'Outfit', sans-serif" }}
              />
            ) : (
              <p className="max-w-lg mt-6"
                style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.7, color: textBody }}>
                {subtitle}
              </p>
            )
          )}
        </Wrapper>

        {/* Bottom info cards */}
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6, duration: 0.6 } })}
          className="mt-14 flex flex-wrap items-center gap-4"
        >
          <div className="px-6 py-4 rounded-2xl"
            style={{ background: template.colors.cardBackground, boxShadow: `0 2px 20px ${dark}0F` }}>
            <span className="block uppercase tracking-wider mb-1"
              style={{ fontSize: "10px", fontWeight: 600, color: accent }}>Prepared for</span>
            {onClientNameEdit ? (
              <EditableText value={clientName} placeholder="Client name" onSave={onClientNameEdit} as="span"
                style={{ fontSize: "16px", fontWeight: 700, color: dark }} />
            ) : (
              <span style={{ fontSize: "16px", fontWeight: 700, color: dark }}>{clientName}</span>
            )}
          </div>
          <div className="px-6 py-4 rounded-2xl"
            style={{ background: template.colors.cardBackground, boxShadow: `0 2px 20px ${dark}0F` }}>
            <span className="block uppercase tracking-wider mb-1"
              style={{ fontSize: "10px", fontWeight: 600, color: accent }}>Date</span>
            {onDateEdit ? (
              <EditableText value={displayDate} placeholder="Date" onSave={onDateEdit} as="span"
                style={{ fontSize: "16px", fontWeight: 700, color: dark }} />
            ) : (
              <span style={{ fontSize: "16px", fontWeight: 700, color: dark }}>{displayDate}</span>
            )}
          </div>
          <div className="px-6 py-4 rounded-2xl flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            style={{ background: secondary, color: "white", boxShadow: `0 4px 20px ${secondary}40` }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Let's go</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </Wrapper>
      </div>

      {/* Bottom bar */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.8, duration: 0.5 } })}
        className="relative z-10 px-8 lg:px-14 pb-8 flex items-center justify-end"
      >
        <span style={{ fontSize: "11px", fontWeight: 500, color: textFaint }}>
          Page 01 of 09
        </span>
      </Wrapper>
    </div>
  );
}

function SoftHeroCover({
  proposalTitle, subtitle, clientName, date, proposalNumber,
  onTitleEdit, onSubtitleEdit, onClientNameEdit, onDateEdit, onLogoClick,
}: HeroCoverProps) {
  const brand = useBrand();
  const template = useTemplate();
  const isPDF = usePDFMode();
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;
  const displayDate = formatDisplayDate(date);

  const Wrapper = isPDF ? 'div' : motion.div;
  const wrapperProps = (props: any) => isPDF ? {} : props;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        background: isPDF ? accent : `linear-gradient(to bottom right, ${accent}, ${accent}CC, ${accent}99)`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Noise texture overlay */}
      {!isPDF && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      )}
      {/* Top bar */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2, duration: 0.5 } })}
        className="relative z-10 flex items-center justify-between px-10 pt-10 lg:px-16 lg:pt-14"
      >
        <div className="flex items-center gap-3" onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : undefined }} title={onLogoClick ? 'Click to replace logo' : undefined}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain brightness-0 invert hover:opacity-80 transition-opacity" />
          ) : (
            <span className="tracking-[0.2em] uppercase" style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>
              {brand.agencyName}
            </span>
          )}
        </div>
        {proposalNumber && (
          <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{proposalNumber}</span>
        )}
      </Wrapper>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 lg:px-16 max-w-3xl">
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.7, ease: "easeOut" } })}
        >
          {onTitleEdit ? (
            <EditableText value={proposalTitle} placeholder="Enter proposal title..." onSave={onTitleEdit} as="h1"
              style={{
                fontSize: isPDF ? "54px" : "clamp(42px, 6vw, 72px)", fontWeight: 600, lineHeight: 1.08,
                color: "white", letterSpacing: "-0.02em",
              }} />
          ) : (
            <h1 style={{
              fontSize: isPDF ? "54px" : "clamp(42px, 6vw, 72px)", fontWeight: 600, lineHeight: 1.08,
              color: "white", letterSpacing: "-0.02em",
            }}>
              {proposalTitle}
            </h1>
          )}
          {(subtitle || onSubtitleEdit) && (
            onSubtitleEdit ? (
              <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
                className="max-w-lg mt-6"
                style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }} />
            ) : (
              <p className="max-w-lg mt-6" style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>
                {subtitle}
              </p>
            )
          )}
          <div className="mt-16 flex items-center gap-10">
            <div>
              <span className="block mb-1" style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)" }}>Prepared for</span>
              {onClientNameEdit ? (
                <EditableText value={clientName} placeholder="Client name" onSave={onClientNameEdit} as="span"
                  style={{ fontSize: "16px", fontWeight: 600, color: "white" }} />
              ) : (
                <span style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>{clientName}</span>
              )}
            </div>
            <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div>
              <span className="block mb-1" style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)" }}>Date</span>
              {onDateEdit ? (
                <EditableText value={displayDate} placeholder="Date" onSave={onDateEdit} as="span"
                  style={{ fontSize: "16px", fontWeight: 600, color: "white" }} />
              ) : (
                <span style={{ fontSize: "16px", fontWeight: 600, color: "white" }}>{displayDate}</span>
              )}
            </div>
          </div>
        </Wrapper>
      </div>

      {/* Bottom */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.8, duration: 0.5 } })}
        className="relative z-10 px-10 lg:px-16 pb-10"
      >
        <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>Confidential</span>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>01 / 09</span>
        </div>
      </Wrapper>
    </div>
  );
}

// Classic cover — kept below original SoftHeroCover
function ClassicHeroCoverInner({
  proposalTitle, subtitle, clientName, date, proposalNumber,
  confidential = true, onTitleEdit, onSubtitleEdit, onClientNameEdit, onDateEdit, onLogoClick,
}: HeroCoverProps) {
  const brand = useBrand();
  const isPDF = usePDFMode();
  const Wrapper = isPDF ? 'div' : motion.div;
  const wrapperProps = (props: any) => isPDF ? {} : props;

  return (
    <div
      className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Abstract Graphic Panel */}
      <div className="absolute top-0 right-0 w-[35%] lg:w-[45%] h-full overflow-hidden pointer-events-none hidden md:block">
        <Wrapper
          {...wrapperProps({ initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { duration: 0.8, ease: "easeOut" } })}
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
        </Wrapper>
      </div>

      {/* Mobile accent bar */}
      <div
        className="absolute top-0 right-0 w-2 h-full md:hidden"
        style={{ backgroundColor: brand.primaryColor }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-12 pt-10 lg:px-16 lg:pt-14">
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.5 } })}
          className="flex items-center gap-3"
        >
          <div onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : undefined }} title={onLogoClick ? 'Click to replace logo' : undefined}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.agencyName} className="h-32 w-auto object-contain brightness-0 hover:opacity-80 transition-opacity" />
          ) : (
            <span className="tracking-[0.15em] uppercase"
              style={{ fontSize: "18px", fontWeight: 700, color: brand.darkColor, letterSpacing: "0.08em" }}>
              {brand.agencyFullName}
            </span>
          )}
          </div>
        </Wrapper>
        {proposalNumber && (
          <Wrapper
            {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5, duration: 0.5 } })}
            className="text-white md:text-[#999] tracking-wider uppercase relative z-10"
            style={{ fontSize: "12px", fontWeight: 400 }}
          >
            {proposalNumber}
          </Wrapper>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-12 lg:px-16 max-w-full md:max-w-[60%] lg:max-w-[55%]">
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2, duration: 0.7, ease: "easeOut" } })}
        >
          <span className="inline-block uppercase tracking-[0.25em] mb-6"
            style={{ fontSize: "13px", fontWeight: 600, color: brand.primaryColor }}>
            Proposal for
          </span>
          {onTitleEdit ? (
            <EditableText value={proposalTitle} placeholder="Enter proposal title..." onSave={onTitleEdit} as="h1"
              className="mb-4 tracking-tight"
              style={{ fontSize: isPDF ? "48px" : "clamp(36px, 5vw, 64px)", fontWeight: 700, lineHeight: 1.05, color: brand.darkColor }} />
          ) : (
            <h1 className="mb-4 tracking-tight"
              style={{ fontSize: isPDF ? "48px" : "clamp(36px, 5vw, 64px)", fontWeight: 700, lineHeight: 1.05, color: brand.darkColor }}>
              {proposalTitle}
            </h1>
          )}
          {(subtitle || onSubtitleEdit) && (
            onSubtitleEdit ? (
              <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
                className="max-w-lg mt-4" style={{ fontSize: "18px", fontWeight: 300, lineHeight: 1.6, color: "#666" }} />
            ) : (
              <p className="text-[#666] max-w-lg mt-4" style={{ fontSize: "18px", fontWeight: 300, lineHeight: 1.6 }}>
                {subtitle}
              </p>
            )
          )}
        </Wrapper>

        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5, duration: 0.6 } })}
          className="mt-16 flex items-center gap-8"
        >
          <div>
            <span className="block text-[#999] uppercase tracking-[0.15em] mb-1" style={{ fontSize: "11px", fontWeight: 500 }}>
              Prepared for
            </span>
            {onClientNameEdit ? (
              <EditableText value={clientName} placeholder="Client name" onSave={onClientNameEdit} as="span"
                style={{ fontSize: "18px", fontWeight: 600, color: brand.darkColor }} />
            ) : (
              <span style={{ fontSize: "18px", fontWeight: 600, color: brand.darkColor }}>{clientName}</span>
            )}
          </div>
          <div className="w-px h-10 bg-[#E0E0E0]" />
          <div>
            <span className="block text-[#999] uppercase tracking-[0.15em] mb-1" style={{ fontSize: "11px", fontWeight: 500 }}>
              Date
            </span>
            {onDateEdit ? (
              <EditableText value={date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} placeholder="Date" onSave={onDateEdit} as="span"
                style={{ fontSize: "18px", fontWeight: 600, color: brand.darkColor }} />
            ) : (
              <span style={{ fontSize: "18px", fontWeight: 600, color: brand.darkColor }}>
                {date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </Wrapper>
      </div>

      {/* Footer */}
      <Wrapper
        {...wrapperProps({ initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { delay: 0.6, duration: 0.8, ease: "easeOut" } })}
        className="relative z-10 mx-12 lg:mx-16 mb-10 h-px bg-[#E0E0E0] origin-left"
      />
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1, duration: 0.5 } })}
        className="relative z-10 px-12 lg:px-16 pb-10 flex items-center justify-between"
      >
        {confidential && (
          <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "11px" }}>
            Confidential
          </span>
        )}
        <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "11px" }}>
          Page 01
        </span>
      </Wrapper>
    </div>
  );
}

export function HeroCover(props: HeroCoverProps) {
  const template = useTemplate();

  if (template.id === 'soft') {
    return <SoftHeroCover {...props} />;
  }

  if (template.id === 'elegant') {
    return <ElegantHeroCover {...props} />;
  }

  if (template.id === 'modern') {
    return <ModernHeroCover {...props} />;
  }

  return <ClassicHeroCoverInner {...props} />;
}
