import React from "react";
import { motion } from "motion/react";
import { useBrand } from "./BrandTheme";

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
}

export function SignatureBlock({
  heading = "Ready to proceed?",
  subtitle = "By signing below, both parties agree to the terms outlined in this proposal.",
  client,
  agency,
}: SignatureBlockProps) {
  const brand = useBrand();

  const agencyParty: SignatureParty = agency || {
    role: "Agency",
    companyName: brand.agencyFullName,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="text-center mb-14">
        <h2
          className="tracking-tight mb-3"
          style={{
            fontSize: "clamp(28px, 3vw, 40px)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: brand.darkColor,
          }}
        >
          {heading}
        </h2>
        <p
          className="text-[#888] max-w-md mx-auto"
          style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6 }}
        >
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {[client, agencyParty].map((party, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
            className="border border-[#EBEBEB] rounded-2xl p-8 lg:p-10"
          >
            <span
              className="inline-block uppercase tracking-[0.25em] mb-6"
              style={{ fontSize: "11px", fontWeight: 600, color: brand.primaryColor }}
            >
              {party.role}
            </span>
            <div className="mb-8">
              <span
                className="block mb-1"
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: brand.darkColor,
                }}
              >
                {party.companyName}
              </span>
              {party.personName && (
                <span
                  className="block text-[#888]"
                  style={{ fontSize: "14px", fontWeight: 400 }}
                >
                  {party.personName}
                  {party.title ? ` — ${party.title}` : ""}
                </span>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <div
                  className="h-16 border-b-2 mb-2"
                  style={{ borderColor: brand.darkColor }}
                />
                <span
                  className="text-[#BBB] uppercase tracking-[0.15em]"
                  style={{ fontSize: "10px", fontWeight: 500 }}
                >
                  Signature
                </span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="h-10 border-b border-[#E0E0E0] mb-2" />
                  <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500 }}>
                    Printed Name
                  </span>
                </div>
                <div>
                  <div className="h-10 border-b border-[#E0E0E0] mb-2" />
                  <span className="text-[#BBB] uppercase tracking-[0.15em]" style={{ fontSize: "10px", fontWeight: 500 }}>
                    Date
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Closing */}
      <div className="mt-20 text-center">
        <div className="inline-block">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.agencyName} className="h-12 w-auto object-contain mx-auto mb-4" />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: brand.darkColor }}
            >
              <span className="text-white tracking-tighter" style={{ fontSize: "13px", fontWeight: 700 }}>
                {brand.logoInitial}
              </span>
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
