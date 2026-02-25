import React, { type ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  pageNumber?: string;
}

export function PageWrapper({ children, pageNumber }: PageWrapperProps) {
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
