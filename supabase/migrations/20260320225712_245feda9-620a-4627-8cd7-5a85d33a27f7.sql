INSERT INTO service_groups (name, description, icon, display_order, is_default)
VALUES ('AI & Emerging', 'AI-powered marketing services and emerging channels', 'Sparkles', 10, true)
ON CONFLICT DO NOTHING;