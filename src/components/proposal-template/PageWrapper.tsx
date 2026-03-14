import React, { type ReactNode } from "react";
import { useTemplate } from "./TemplateProvider";

interface PageWrapperProps {
  children: ReactNode;
  pageNumber?: string;
}

export function PageWrapper({ children, pageNumber }: PageWrapperProps) {
  const template = useTemplate();
  const isModern = template.id === 'modern';
  const isElegant = template.id === 'elegant';
  const accent = template.colors.primaryAccent;

  if (isElegant) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={{ background: "#FAFAF8" }}>
        <div className="relative z-10 px-10 py-14 lg:px-16 lg:py-20 max-w-5xl mx-auto">
          {children}
        </div>
        {pageNumber && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="w-5 h-px" style={{ background: `${accent}4D` }} />
            <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em", color: template.colors.textMuted }}>
              {pageNumber}
            </span>
            <div className="w-5 h-px" style={{ background: `${accent}4D` }} />
          </div>
        )}
      </div>
    );
  }

  if (isModern) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={{ background: "#FAFAF8" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full"
            style={{ background: accent, opacity: 0.03, filter: "blur(60px)" }} />
          <div className="absolute bottom-[20%] -left-10 w-[200px] h-[200px] rounded-full"
            style={{ background: accent, opacity: 0.025, filter: "blur(50px)" }} />
        </div>
        <div className="relative z-10 px-8 py-14 lg:px-16 lg:py-20 max-w-5xl mx-auto">
          {children}
        </div>
        {pageNumber && (
          <div className="absolute bottom-6 right-8 lg:right-16 flex items-center gap-2"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${accent}12`, color: accent, fontSize: "12px", fontWeight: 700 }}>
              {pageNumber}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full bg-white px-12 py-16 lg:px-16 lg:py-20"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {children}

      {pageNumber && (
        <div className="absolute bottom-8 right-12 lg:right-16">
          <span
            className="text-[#CCC] uppercase tracking-[0.15em]"
            style={{ fontSize: "11px" }}
          >
            Page {pageNumber}
          </span>
        </div>
      )}
    </div>
  );
}
