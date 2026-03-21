
-- Brand & Creative
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=4, max_weeks=6, phase_category='creative', can_parallel=true, depends_on='{}' WHERE name='Brand Identity System';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=2, max_weeks=4, phase_category='strategy', can_parallel=true, depends_on='{}' WHERE name='Brand Messaging & Voice';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=1, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Graphic Design Retainer';

-- Website & Digital
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=6, max_weeks=12, phase_category='build', can_parallel=false, depends_on='{"Brand Identity System"}' WHERE name='Website Design & Development';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=2, max_weeks=3, phase_category='build', can_parallel=true, depends_on='{}' WHERE name='Landing Page Design & Development';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=1, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{"Website Design & Development"}' WHERE name='Website Maintenance & Support';

-- Content & Copywriting
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=3, max_weeks=4, phase_category='strategy', can_parallel=true, depends_on='{}' WHERE name='Content Strategy & Planning';
UPDATE service_modules SET timeline_type='deliverable', setup_weeks=0, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{"Content Strategy & Planning"}' WHERE name='Blog & Article Writing';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=2, max_weeks=4, phase_category='creative', can_parallel=true, depends_on='{"Brand Messaging & Voice"}' WHERE name='Website Copywriting';
UPDATE service_modules SET timeline_type='deliverable', setup_weeks=0, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Email Copywriting';

-- SEO & Organic Growth
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='SEO Strategy & Implementation';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Local SEO';

-- Social Media
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Social Media Management';
UPDATE service_modules SET timeline_type='deliverable', setup_weeks=0, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Short-Form Video Content';

-- Paid Advertising
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Paid Search (PPC) Management';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Paid Social Advertising';

-- Email & Automation
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=3, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Email Marketing Management';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=4, max_weeks=8, phase_category='build', can_parallel=true, depends_on='{}' WHERE name='Marketing Automation Setup';

-- Analytics & Data
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=2, max_weeks=4, phase_category='build', can_parallel=true, depends_on='{}' WHERE name='Analytics & Reporting Setup';

-- Strategy & Consulting
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=3, max_weeks=5, phase_category='strategy', can_parallel=false, depends_on='{}' WHERE name='Marketing Strategy & Consulting';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='CRO & A/B Testing';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='PR & Media Relations';

-- New AI & Emerging modules (if they exist)
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='AI Search Optimization (GEO)';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{"Content Strategy & Planning"}' WHERE name='AI Content Production';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=3, max_weeks=4, phase_category='build', can_parallel=true, depends_on='{}' WHERE name='AI Chatbot & Conversational Marketing';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=6, max_weeks=10, phase_category='build', can_parallel=false, depends_on='{"Brand Identity System"}' WHERE name='E-Commerce Store Design & Development';
UPDATE service_modules SET timeline_type='project', setup_weeks=0, min_weeks=4, max_weeks=6, phase_category='strategy', can_parallel=true, depends_on='{}' WHERE name='UX & Conversion Design';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=3, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Influencer Marketing Management';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=2, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Reputation Management';
UPDATE service_modules SET timeline_type='ongoing', setup_weeks=3, min_weeks=0, max_weeks=0, phase_category='ongoing', can_parallel=true, depends_on='{}' WHERE name='Video Marketing Strategy & Production';
