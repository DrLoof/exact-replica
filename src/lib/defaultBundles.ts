import { defaultModulesByGroup, type DefaultModule } from './defaultModules';

export interface BundleTemplate {
  name: string;
  tagline: string;
  description: string;
  serviceNames: string[];
  discountPercentage: number;
}

export const defaultBundles: BundleTemplate[] = [
  {
    name: 'Brand Launch',
    tagline: 'From identity to online presence — everything to launch your brand.',
    description: 'A complete brand foundation package covering visual identity, messaging framework, website design, and the copy to bring it all together. Ideal for new businesses, rebrand projects, or companies launching a new product line.',
    serviceNames: ['Brand Identity System', 'Brand Messaging & Voice', 'Website Design & Development', 'Website Copywriting'],
    discountPercentage: 15,
  },
  {
    name: 'Digital Growth Engine',
    tagline: 'Content, SEO, and analytics working together to grow your pipeline.',
    description: 'A data-driven organic growth package combining SEO, content strategy, regular blog content, and the analytics infrastructure to track results. Built for businesses ready to invest in compounding organic growth.',
    serviceNames: ['SEO Strategy & Implementation', 'Content Strategy & Planning', 'Blog & Article Writing', 'Analytics & Reporting Setup'],
    discountPercentage: 15,
  },
  {
    name: 'Lead Generation Machine',
    tagline: 'Targeted ads, optimized landing pages, and full-funnel tracking.',
    description: 'An end-to-end paid acquisition package. We build the landing pages, run the ads across search and social, set up email nurture for captured leads, and give you the analytics to see exactly what\'s working.',
    serviceNames: ['Paid Search (PPC) Management', 'Paid Social Advertising', 'Landing Page Design & Development', 'Email Marketing Management', 'Analytics & Reporting Setup'],
    discountPercentage: 15,
  },
  {
    name: 'Social Media Presence',
    tagline: 'Strategy, content, and community management across every platform.',
    description: 'Everything needed for a professional social media presence. From strategy and content calendar to daily management, video content, and paid amplification.',
    serviceNames: ['Social Media Management', 'Short-Form Video Content', 'Content Strategy & Planning', 'Paid Social Advertising'],
    discountPercentage: 15,
  },
  {
    name: 'Marketing Foundation',
    tagline: 'Strategy, messaging, and measurement — the foundation everything else builds on.',
    description: 'Before you run ads or post content, you need a plan. This package delivers a complete marketing strategy, brand messaging framework, content roadmap, and the analytics to measure success.',
    serviceNames: ['Marketing Strategy & Consulting', 'Brand Messaging & Voice', 'Content Strategy & Planning', 'Analytics & Reporting Setup'],
    discountPercentage: 15,
  },
  {
    name: 'Full-Service Retainer',
    tagline: 'Your outsourced marketing department — content, social, email, and design.',
    description: 'A comprehensive ongoing retainer covering the core marketing channels. Social media, email campaigns, fresh blog content, design support, and analytics reporting.',
    serviceNames: ['Social Media Management', 'Email Marketing Management', 'Blog & Article Writing', 'Graphic Design Retainer', 'Analytics & Reporting Setup'],
    discountPercentage: 15,
  },
  {
    name: 'Website & SEO Launch',
    tagline: 'A website built to rank — design, content, SEO, and analytics from the start.',
    description: 'Combines a complete website build with SEO strategy, professional copywriting, and analytics setup. Bakes search performance into every page from day one.',
    serviceNames: ['Website Design & Development', 'Website Copywriting', 'SEO Strategy & Implementation', 'Analytics & Reporting Setup'],
    discountPercentage: 15,
  },
  {
    name: 'Conversion & Growth',
    tagline: 'Turn your existing traffic into more revenue with testing, automation, and optimization.',
    description: 'Combines conversion rate optimization, marketing automation, email nurturing, and advanced analytics to squeeze more revenue from your existing audience.',
    serviceNames: ['CRO & A/B Testing', 'Marketing Automation Setup', 'Email Marketing Management', 'Analytics & Reporting Setup'],
    discountPercentage: 15,
  },
];

/** Find a default module by name across all groups */
export function findDefaultModule(name: string): { module: DefaultModule; groupName: string } | null {
  for (const [groupName, modules] of Object.entries(defaultModulesByGroup)) {
    const mod = modules.find(m => m.name === name);
    if (mod) return { module: mod, groupName };
  }
  return null;
}

/** Calculate bundle pricing from service names */
export function calculateBundlePricing(serviceNames: string[], discountPct: number, agencyModules?: any[]) {
  let totalFixed = 0;
  let totalMonthly = 0;

  for (const name of serviceNames) {
    // Prefer agency module pricing if available
    const agencyMod = agencyModules?.find((m: any) => m.name === name);
    if (agencyMod) {
      totalFixed += agencyMod.price_fixed || 0;
      totalMonthly += agencyMod.price_monthly || 0;
    } else {
      const found = findDefaultModule(name);
      if (found) {
        if (found.module.pricingModel === 'fixed') totalFixed += found.module.price;
        else if (found.module.pricingModel === 'monthly') totalMonthly += found.module.price;
      }
    }
  }

  const mult = 1 - discountPct / 100;
  const bundleFixed = Math.round(totalFixed * mult);
  const bundleMonthly = Math.round(totalMonthly * mult);
  const savingsFixed = totalFixed - bundleFixed;
  const savingsMonthly = totalMonthly - bundleMonthly;

  return {
    totalFixed,
    totalMonthly,
    bundleFixed,
    bundleMonthly,
    savingsFixed,
    savingsMonthly,
    totalIndividual: totalFixed + totalMonthly,
    bundleTotal: bundleFixed + bundleMonthly,
    totalSavings: savingsFixed + savingsMonthly,
  };
}

/** Format price display for mixed pricing */
export function formatBundlePrice(fixed: number, monthly: number, symbol = '$'): string {
  if (fixed > 0 && monthly > 0) return `${symbol}${fixed.toLocaleString()} + ${symbol}${monthly.toLocaleString()}/mo`;
  if (monthly > 0) return `${symbol}${monthly.toLocaleString()}/mo`;
  return `${symbol}${fixed.toLocaleString()}`;
}
