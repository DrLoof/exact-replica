ALTER TABLE proposals ADD COLUMN template_id TEXT DEFAULT 'classic';
ALTER TABLE agencies ADD COLUMN default_template TEXT DEFAULT 'classic';