export interface DefaultModule {
  name: string;
  shortDesc: string;
  pricingModel: 'fixed' | 'monthly' | 'hourly';
  price: number;
}

export const defaultModulesByGroup: Record<string, DefaultModule[]> = {
  'Brand & Creative': [
    { name: 'Brand Identity System', shortDesc: 'Logo, typography, color palette, and brand guidelines', pricingModel: 'fixed', price: 8500 },
    { name: 'Brand Messaging & Voice', shortDesc: 'Brand positioning, messaging framework, and tone of voice', pricingModel: 'fixed', price: 4500 },
    { name: 'Graphic Design Retainer', shortDesc: 'Ongoing design support for marketing materials', pricingModel: 'monthly', price: 2500 },
  ],
  'Website & Digital': [
    { name: 'Website Design & Development', shortDesc: 'Custom website design, development, and launch', pricingModel: 'fixed', price: 15000 },
    { name: 'Website Copywriting', shortDesc: 'Conversion-focused copy for all website pages', pricingModel: 'fixed', price: 3500 },
    { name: 'Website Maintenance', shortDesc: 'Ongoing updates, security, and hosting management', pricingModel: 'monthly', price: 800 },
  ],
  'Content & Copywriting': [
    { name: 'Content Strategy', shortDesc: 'Audience research, content pillars, and editorial calendar', pricingModel: 'fixed', price: 5000 },
    { name: 'Blog Writing', shortDesc: 'SEO-optimized blog posts with keyword research', pricingModel: 'monthly', price: 2000 },
    { name: 'Email Copywriting', shortDesc: 'Email sequences, campaigns, and newsletter content', pricingModel: 'fixed', price: 3000 },
  ],
  'SEO & Organic Growth': [
    { name: 'SEO Strategy & Implementation', shortDesc: 'Technical SEO, on-page optimization, and link building', pricingModel: 'monthly', price: 3500 },
    { name: 'Technical SEO Audit', shortDesc: 'Comprehensive site audit with actionable recommendations', pricingModel: 'fixed', price: 2500 },
  ],
  'Paid Advertising': [
    { name: 'Paid Search (PPC)', shortDesc: 'Google Ads management with keyword strategy', pricingModel: 'monthly', price: 3000 },
    { name: 'Paid Social Advertising', shortDesc: 'Meta, LinkedIn, and TikTok ad campaigns', pricingModel: 'monthly', price: 2500 },
    { name: 'Landing Page Design', shortDesc: 'High-converting landing pages for campaigns', pricingModel: 'fixed', price: 3500 },
  ],
  'Social Media': [
    { name: 'Social Media Management', shortDesc: 'Content creation, scheduling, and community management', pricingModel: 'monthly', price: 3000 },
    { name: 'Short-Form Video', shortDesc: 'Reels, TikToks, and YouTube Shorts production', pricingModel: 'monthly', price: 2500 },
  ],
  'Email Marketing': [
    { name: 'Email Marketing Strategy', shortDesc: 'Full email strategy with segmentation and automation', pricingModel: 'fixed', price: 4000 },
    { name: 'Email Automation', shortDesc: 'Automated sequences for nurture, onboarding, and retention', pricingModel: 'fixed', price: 3500 },
  ],
  'Analytics & Data': [
    { name: 'Analytics Setup', shortDesc: 'GA4, Tag Manager, and conversion tracking implementation', pricingModel: 'fixed', price: 2500 },
    { name: 'Conversion Rate Optimization', shortDesc: 'A/B testing, user research, and funnel optimization', pricingModel: 'monthly', price: 3000 },
  ],
  'Marketing Strategy': [
    { name: 'Marketing Strategy & Consulting', shortDesc: 'Strategic planning, market analysis, and growth roadmap', pricingModel: 'fixed', price: 8000 },
  ],
};

export function getDefaultModulesForGroup(groupName: string): DefaultModule[] {
  return defaultModulesByGroup[groupName] || [];
}
