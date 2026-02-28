import React, { createContext, useContext, type ReactNode } from "react";

export interface BrandTheme {
  agencyName: string;
  agencyFullName: string;
  primaryColor: string;
  darkColor: string;
  logoUrl: string | null;
  logoInitial: string;
  contactEmail: string;
  contactWebsite: string;
  contactPhone: string;
  currency: string;
}

const defaultBrand: BrandTheme = {
  agencyName: "AGENCY",
  agencyFullName: "Your Agency",
  primaryColor: "#ffbf68",
  darkColor: "#0A0A0A",
  logoUrl: null,
  logoInitial: "A",
  contactEmail: "",
  contactWebsite: "",
  contactPhone: "",
  currency: "$",
};

const BrandContext = createContext<BrandTheme>(defaultBrand);

export function useBrand(): BrandTheme {
  return useContext(BrandContext);
}

interface BrandProviderProps {
  brand: Partial<BrandTheme>;
  children: ReactNode;
}

export function BrandProvider({ brand, children }: BrandProviderProps) {
  const mergedBrand: BrandTheme = { ...defaultBrand, ...brand };
  return (
    <BrandContext.Provider value={mergedBrand}>
      {children}
    </BrandContext.Provider>
  );
}
