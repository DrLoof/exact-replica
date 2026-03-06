
-- Add ai_context to service_modules
ALTER TABLE public.service_modules ADD COLUMN IF NOT EXISTS ai_context TEXT;

-- Add client context fields to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_challenge TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_goal TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_context_note TEXT;

-- Seed ai_context for default modules
UPDATE public.service_modules SET ai_context = 'Addresses outdated or inconsistent visual identity. Delivers a professional brand that works across all touchpoints. Typical goal: cohesive brand presence across all channels.' WHERE name = 'Brand Identity System' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses unclear positioning — the business struggles to explain what makes them different. Delivers a messaging framework for consistent communication. Typical goal: compelling messaging that resonates with target customers.' WHERE name = 'Brand Messaging & Voice' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses lack of dedicated design resource, causing inconsistent or slow creative output. Delivers ongoing design support. Typical goal: faster creative turnaround with consistent quality.' WHERE name = 'Graphic Design Retainer' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses a website that doesn''t convert, looks dated, or performs poorly on mobile. Delivers a modern site focused on conversion. Typical goal: better conversion rate and user experience.' WHERE name = 'Website Design & Development' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses campaigns lacking a focused destination, wasting ad spend. Delivers a conversion-optimized landing page. Typical goal: higher conversion rate and lower cost per lead.' WHERE name = 'Landing Page Design & Development' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses security risks, slow load times, and outdated content nobody has time to fix. Delivers ongoing site maintenance. Typical goal: reliable site performance with no surprises.' WHERE name = 'Website Maintenance & Support' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses no clear plan for what content to create or how to measure it. Delivers a structured content strategy and editorial calendar. Typical goal: consistent content output tied to business goals.' WHERE name = 'Content Strategy & Planning' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses not enough content to rank in search or engage the audience. Delivers regular SEO-optimized articles. Typical goal: steady growth in organic traffic.' WHERE name = 'Blog & Article Writing' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses website copy that doesn''t communicate value or drive action. Delivers conversion-focused page copy. Typical goal: more conversions from existing traffic.' WHERE name = 'Website Copywriting' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses emails that aren''t getting opened or driving revenue. Delivers professionally written email campaigns. Typical goal: better open rates and email-driven revenue.' WHERE name = 'Email Copywriting' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses the business not showing up when potential customers search for what they offer. Delivers a structured SEO program. Typical goal: higher rankings and more organic traffic.' WHERE name = 'SEO Strategy & Implementation' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses poor visibility in local search results and Google Maps. Delivers local search optimization. Typical goal: more local visibility and nearby customer inquiries.' WHERE name = 'Local SEO' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses inactive or inconsistent social channels with low engagement. Delivers strategic social media presence. Typical goal: growing audience with real engagement.' WHERE name = 'Social Media Management' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses missing out on short-form video as the fastest-growing content format. Delivers professional Reels/TikTok/Shorts content. Typical goal: increased video reach and brand awareness.' WHERE name = 'Short-Form Video Content' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses spending on ads without clear returns or missing high-intent search traffic. Delivers data-driven PPC campaigns. Typical goal: lower cost per lead and better ROAS.' WHERE name = 'Paid Search (PPC) Management' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses not reaching the right audience on social or underperforming ad campaigns. Delivers targeted social advertising. Typical goal: more qualified leads at lower cost.' WHERE name = 'Paid Social Advertising' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses an email list that isn''t used effectively — no strategy, inconsistent sends, low engagement. Delivers a structured email program. Typical goal: higher engagement and revenue from email.' WHERE name = 'Email Marketing Management' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses too many manual tasks, leads falling through cracks, no connection between marketing and sales. Delivers automated workflows. Typical goal: more leads converted with less manual effort.' WHERE name = 'Marketing Automation Setup' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses no clear picture of what''s working — decisions based on gut feeling. Delivers proper tracking and dashboards. Typical goal: data-driven decisions with clear performance visibility.' WHERE name = 'Analytics & Reporting Setup' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses scattered marketing efforts without a clear direction. Delivers a focused strategy and prioritized plan. Typical goal: clear marketing roadmap aligned with business goals.' WHERE name = 'Marketing Strategy & Consulting' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses getting traffic but not enough converting to leads or customers. Delivers systematic testing and optimization. Typical goal: higher conversion rate from existing traffic.' WHERE name = 'CRO & A/B Testing' AND ai_context IS NULL;

UPDATE public.service_modules SET ai_context = 'Addresses low brand awareness or limited credibility in the market. Delivers earned media coverage and press outreach. Typical goal: increased awareness and third-party credibility.' WHERE name = 'PR & Media Relations' AND ai_context IS NULL;
