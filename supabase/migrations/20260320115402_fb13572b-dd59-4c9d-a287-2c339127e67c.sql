
-- Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create package_modules junction table
CREATE TABLE public.package_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.service_modules(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0
);

-- Add package_id to proposals
ALTER TABLE public.proposals ADD COLUMN package_id UUID REFERENCES public.packages(id);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_modules ENABLE ROW LEVEL SECURITY;

-- RLS for packages (same pattern as bundles)
CREATE POLICY "Users see own agency packages" ON public.packages
  FOR ALL TO public
  USING (agency_id IN (SELECT users.agency_id FROM users WHERE users.id = auth.uid()));

-- RLS for package_modules
CREATE POLICY "Users see own agency package modules" ON public.package_modules
  FOR ALL TO public
  USING (package_id IN (SELECT packages.id FROM packages WHERE packages.agency_id IN (SELECT users.agency_id FROM users WHERE users.id = auth.uid())));
