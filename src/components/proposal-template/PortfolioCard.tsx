import React from "react";
import { motion } from "motion/react";
import { useTemplate } from "./TemplateProvider";
import { useBrand } from "./BrandTheme";
import { BarChart3, Image } from "lucide-react";

interface PortfolioCardProps {
  title: string;
  category: string;
  description?: string | null;
  results?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  delay?: number;
}

export function PortfolioCard({
  title,
  category,
  description,
  results,
  imageUrl,
  imageAlt = "",
  delay = 0,
}: PortfolioCardProps) {
  const template = useTemplate();
  const brand = useBrand();
  const accent = template.colors.primaryAccent;
  const dark = template.colors.primaryDark;
  const isModern = template.id === "modern";
  const isElegant = template.id === "elegant";
  const isSoft = template.id === "soft";

  const cardBorder = isModern
    ? `2px solid ${accent}33`
    : isElegant
    ? `1px solid ${accent}20`
    : isSoft
    ? `1px solid #E8E0D4`
    : "1px solid #E0E0E0";

  const cardRadius = isModern ? "16px" : isElegant ? "16px" : isSoft ? "12px" : "12px";
  const cardShadow = isModern
    ? `4px 4px 0px ${dark}`
    : isElegant
    ? `0 4px 20px ${accent}0A`
    : "0 2px 8px rgba(0,0,0,0.04)";

  const fontFamily = isElegant
    ? "'DM Sans', sans-serif"
    : isModern
    ? "'Outfit', sans-serif"
    : isSoft
    ? "'DM Sans', sans-serif"
    : "'Space Grotesk', sans-serif";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      style={{
        border: cardBorder,
        borderRadius: cardRadius,
        boxShadow: cardShadow,
        overflow: "hidden",
        background: isSoft ? "#FFFDF9" : "#FFFFFF",
        fontFamily,
      }}
    >
      {/* Hero Image */}
      <div style={{ height: "200px", background: isSoft ? "#F5EFE7" : "#F5F5F5", position: "relative" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Image size={40} style={{ color: "#CCC" }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>
        {/* Category pill */}
        <span
          style={{
            display: "inline-block",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: accent,
            background: `${accent}12`,
            padding: "3px 10px",
            borderRadius: "100px",
            marginBottom: "8px",
          }}
        >
          {category}
        </span>

        {/* Title */}
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: dark,
            lineHeight: 1.3,
            margin: 0,
            fontFamily: isElegant ? "'Fraunces', serif" : fontFamily,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: "13px",
              color: template.colors.textBody || "#666",
              lineHeight: 1.5,
              marginTop: "8px",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>
        )}

        {/* Results */}
        {results && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 500,
              color: accent,
              background: `${accent}0A`,
              padding: "6px 10px",
              borderRadius: "8px",
            }}
          >
            <BarChart3 size={14} />
            <span>{results}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
