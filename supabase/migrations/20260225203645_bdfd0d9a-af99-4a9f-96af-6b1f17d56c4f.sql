
UPDATE public.service_groups SET name = 'Analytics & Reporting' WHERE id = '60a7cbb5-6360-48d9-ad8b-7e5d9268a6d8';
UPDATE public.service_groups SET name = 'Strategy & Consulting' WHERE id = '209c83d6-1034-4e94-b35c-bea3fcb46985';
INSERT INTO public.service_groups (name, description, icon, display_order, is_default) VALUES
  ('Marketing Automation & CRM', 'Lead scoring, nurture sequences, and CRM integration', 'Workflow', 10, true),
  ('Conversion Rate Optimization', 'A/B testing, user research, and funnel optimization', 'Target', 11, true),
  ('PR & Communications', 'Media outreach, press releases, and earned media', 'Newspaper', 12, true);
