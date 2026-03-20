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

          {(onSubtitleEdit || hasRealSubtitle(subtitle)) && (
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
          {(onSubtitleEdit || hasRealSubtitle(subtitle)) && (
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

// Classic cover — redesigned to match Figma spec with circular blobs
function ClassicHeroCoverInner({
  proposalTitle, subtitle, clientName, date, proposalNumber,
  confidential = true, onTitleEdit, onSubtitleEdit, onClientNameEdit, onDateEdit, onLogoClick,
}: HeroCoverProps) {
  const brand = useBrand();
  const isPDF = usePDFMode();
  const Wrapper = isPDF ? 'div' : motion.div;
  const wrapperProps = (props: any) => isPDF ? {} : props;

  // Lighten brand color for blobs
  const blobColor = `${brand.primaryColor}18`;
  const blobColorMed = `${brand.primaryColor}12`;

  return (
    <div
      className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Decorative circular blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right large blob */}
        <Wrapper
          {...wrapperProps({ initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 1, ease: "easeOut" } })}
          className="absolute -top-[10%] -right-[10%] rounded-full"
          style={{ width: '55%', height: '55%', backgroundColor: blobColor }}
        />
        {/* Mid-right blob */}
        <Wrapper
          {...wrapperProps({ initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: 0.2, duration: 1, ease: "easeOut" } })}
          className="absolute top-[40%] -right-[5%] rounded-full"
          style={{ width: '30%', height: '30%', backgroundColor: blobColorMed }}
        />
        {/* Bottom-right blob */}
        <Wrapper
          {...wrapperProps({ initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: 0.4, duration: 1, ease: "easeOut" } })}
          className="absolute bottom-[5%] right-[15%] rounded-full"
          style={{ width: '22%', height: '22%', backgroundColor: blobColor }}
        />
        {/* Small decorative dot */}
        <div className="absolute top-[18%] left-[14%] w-3 h-3 rounded-full" style={{ backgroundColor: `${brand.primaryColor}25` }} />
        <div className="absolute bottom-[42%] left-[6%] w-2 h-2 rounded-full" style={{ backgroundColor: `${brand.primaryColor}20` }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-12 pt-10 lg:px-16 lg:pt-14">
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.5 } })}
          className="flex items-center gap-3"
        >
          <div onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : undefined }} title={onLogoClick ? 'Click to replace logo' : undefined}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain brightness-0 hover:opacity-80 transition-opacity" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                  style={{ backgroundColor: brand.darkColor }}>
                  {brand.agencyName?.[0] || 'A'}
                </div>
                <span className="tracking-[0.08em] uppercase"
                  style={{ fontSize: "16px", fontWeight: 700, color: brand.darkColor }}>
                  {brand.agencyFullName}
                </span>
              </div>
            )}
          </div>
        </Wrapper>
        {proposalNumber && (
          <Wrapper
            {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5, duration: 0.5 } })}
            className="rounded-full px-4 py-1.5 text-xs font-medium tracking-wider uppercase border"
            style={{ color: brand.primaryColor, borderColor: `${brand.primaryColor}30`, backgroundColor: `${brand.primaryColor}08` }}
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
          {/* "Proposal for" pill */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{ backgroundColor: `${brand.primaryColor}10`, color: brand.primaryColor }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z" fill="currentColor" opacity="0.7"/>
            </svg>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Proposal for {clientName}</span>
          </div>

          {onTitleEdit ? (
            <EditableText value={proposalTitle} placeholder="Enter proposal title..." onSave={onTitleEdit} as="h1"
              className="mb-4 tracking-tight"
              style={{ fontSize: isPDF ? "48px" : "clamp(36px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.1, color: brand.darkColor }} />
          ) : (
            <h1 className="mb-4 tracking-tight"
              style={{ fontSize: isPDF ? "48px" : "clamp(36px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.1, color: brand.darkColor }}>
              {proposalTitle}
            </h1>
          )}
          {(onSubtitleEdit || hasRealSubtitle(subtitle)) && (
            onSubtitleEdit ? (
              <EditableText value={subtitle || ''} placeholder="Click to add a subtitle..." onSave={onSubtitleEdit} as="p"
                className="max-w-lg mt-4" style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "#888" }} />
            ) : (
              <p className="max-w-lg mt-4" style={{ fontSize: "17px", fontWeight: 400, lineHeight: 1.7, color: "#888" }}>
                {subtitle}
              </p>
            )
          )}
        </Wrapper>

        {/* Meta cards + CTA */}
        <Wrapper
          {...wrapperProps({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5, duration: 0.6 } })}
          className="mt-14 flex flex-wrap items-stretch gap-3"
        >
          {/* Prepared for card */}
          <div className="rounded-2xl bg-white/80 border border-[#eee] shadow-sm px-6 py-4 backdrop-blur-sm">
            <span className="block uppercase tracking-[0.15em] mb-1" style={{ fontSize: "10px", fontWeight: 600, color: brand.primaryColor }}>
              Prepared for
            </span>
            {onClientNameEdit ? (
              <EditableText value={clientName} placeholder="Client name" onSave={onClientNameEdit} as="span"
                style={{ fontSize: "16px", fontWeight: 600, color: brand.darkColor }} />
            ) : (
              <span style={{ fontSize: "16px", fontWeight: 600, color: brand.darkColor }}>{clientName}</span>
            )}
          </div>

          {/* Date card */}
          <div className="rounded-2xl bg-white/80 border border-[#eee] shadow-sm px-6 py-4 backdrop-blur-sm">
            <span className="block uppercase tracking-[0.15em] mb-1" style={{ fontSize: "10px", fontWeight: 600, color: brand.primaryColor }}>
              Date
            </span>
            {onDateEdit ? (
              <EditableText value={formatDisplayDate(date)} placeholder="Date" onSave={onDateEdit} as="span"
                style={{ fontSize: "16px", fontWeight: 600, color: brand.darkColor }} />
            ) : (
              <span style={{ fontSize: "16px", fontWeight: 600, color: brand.darkColor }}>
                {formatDisplayDate(date)}
              </span>
            )}
          </div>

          {/* Let's go CTA */}
          <div className="flex items-center">
            <div className="rounded-2xl px-6 py-4 flex items-center gap-2 text-white font-semibold"
              style={{ backgroundColor: brand.primaryColor, fontSize: "14px", letterSpacing: "0.03em" }}>
              <span className="uppercase" style={{ fontSize: "12px", fontWeight: 700 }}>Let's go</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </Wrapper>
      </div>

      {/* Bottom decorative dots */}
      <Wrapper
        {...wrapperProps({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.8, duration: 0.5 } })}
        className="relative z-10 px-12 lg:px-16 pb-10 flex items-center gap-2"
      >
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? brand.primaryColor : `${brand.primaryColor}30` }} />
        ))}
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
