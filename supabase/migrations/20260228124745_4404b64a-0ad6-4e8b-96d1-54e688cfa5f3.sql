
-- Standard bundle templates (read-only reference)
CREATE TABLE public.bundle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  discount_percentage INTEGER DEFAULT 15,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Which service modules belong to each template
CREATE TABLE public.bundle_template_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_template_id UUID REFERENCES public.bundle_templates(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL
);

-- RLS: everyone can read templates
ALTER TABLE public.bundle_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_template_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bundle templates" ON public.bundle_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can read bundle template modules" ON public.bundle_template_modules FOR SELECT USING (true);

-- Seed the 8 standard bundles
INSERT INTO public.bundle_templates (name, tagline, description, discount_percentage, display_order) VALUES
('Brand Launch', 'From identity to online presence — everything to launch your brand.', 'A complete brand foundation package covering visual identity, messaging framework, website design, and the copy to bring it all together. Ideal for new businesses, rebrand projects, or companies launching a new product line.', 15, 1),
('Digital Growth Engine', 'Content, SEO, and analytics working together to grow your pipeline.', 'A data-driven organic growth package combining SEO, content strategy, regular blog content, and the analytics infrastructure to track results. Built for businesses ready to invest in compounding organic growth.', 15, 2),
('Lead Generation Machine', 'Targeted ads, optimized landing pages, and full-funnel tracking.', 'An end-to-end paid acquisition package. We build the landing pages, run the ads across search and social, set up email nurture for captured leads, and give you the analytics to see exactly what''s working.', 15, 3),
('Social Media Presence', 'Strategy, content, and community management across every platform.', 'Everything needed for a professional social media presence. From strategy and content calendar to daily management, video content, and paid amplification. Keeps your brand visible, engaging, and growing.', 15, 4),
('Marketing Foundation', 'Strategy, messaging, and measurement — the foundation everything else builds on.', 'Before you run ads or post content, you need a plan. This package delivers a complete marketing strategy, brand messaging framework, content roadmap, and the analytics to measure success. The blueprint for everything that follows.', 15, 5),
('Full-Service Retainer', 'Your outsourced marketing department — content, social, email, and design.', 'A comprehensive ongoing retainer covering the core marketing channels. Social media, email campaigns, fresh blog content, design support, and analytics reporting. For businesses that want consistent, professional marketing without hiring an in-house team.', 15, 6),
('Website & SEO Launch', 'A website built to rank — design, content, SEO, and analytics from the start.', 'Combines a complete website build with SEO strategy, professional copywriting, and analytics setup. Instead of building a site and retrofitting SEO later, this package bakes search performance into every page from day one.', 15, 7),
('Conversion & Growth', 'Turn your existing traffic into more revenue with testing, automation, and optimization.', 'You''re already getting traffic — now make it work harder. This package combines conversion rate optimization, marketing automation, email nurturing, and advanced analytics to squeeze more revenue from your existing audience.', 15, 8);

-- Seed bundle template modules
INSERT INTO public.bundle_template_modules (bundle_template_id, module_name)
SELECT bt.id, m.module_name FROM public.bundle_templates bt
CROSS JOIN (VALUES
  ('Brand Launch', 'Brand Identity System'),
  ('Brand Launch', 'Brand Messaging & Voice'),
  ('Brand Launch', 'Website Design & Development'),
  ('Brand Launch', 'Website Copywriting'),
  ('Digital Growth Engine', 'SEO Strategy & Implementation'),
  ('Digital Growth Engine', 'Content Strategy & Planning'),
  ('Digital Growth Engine', 'Blog & Article Writing'),
  ('Digital Growth Engine', 'Analytics & Reporting Setup'),
  ('Lead Generation Machine', 'Paid Search (PPC) Management'),
  ('Lead Generation Machine', 'Paid Social Advertising'),
  ('Lead Generation Machine', 'Landing Page Design & Development'),
  ('Lead Generation Machine', 'Email Marketing Management'),
  ('Lead Generation Machine', 'Analytics & Reporting Setup'),
  ('Social Media Presence', 'Social Media Management'),
  ('Social Media Presence', 'Short-Form Video Content'),
  ('Social Media Presence', 'Content Strategy & Planning'),
  ('Social Media Presence', 'Paid Social Advertising'),
  ('Marketing Foundation', 'Marketing Strategy & Consulting'),
  ('Marketing Foundation', 'Brand Messaging & Voice'),
  ('Marketing Foundation', 'Content Strategy & Planning'),
  ('Marketing Foundation', 'Analytics & Reporting Setup'),
  ('Full-Service Retainer', 'Social Media Management'),
  ('Full-Service Retainer', 'Email Marketing Management'),
  ('Full-Service Retainer', 'Blog & Article Writing'),
  ('Full-Service Retainer', 'Graphic Design Retainer'),
  ('Full-Service Retainer', 'Analytics & Reporting Setup'),
  ('Website & SEO Launch', 'Website Design & Development'),
  ('Website & SEO Launch', 'Website Copywriting'),
  ('Website & SEO Launch', 'SEO Strategy & Implementation'),
  ('Website & SEO Launch', 'Analytics & Reporting Setup'),
  ('Conversion & Growth', 'CRO & A/B Testing'),
  ('Conversion & Growth', 'Marketing Automation Setup'),
  ('Conversion & Growth', 'Email Marketing Management'),
  ('Conversion & Growth', 'Analytics & Reporting Setup')
) AS m(bundle_name, module_name)
WHERE bt.name = m.bundle_name;
