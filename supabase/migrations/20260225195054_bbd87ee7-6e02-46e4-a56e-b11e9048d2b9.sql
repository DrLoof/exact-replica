
-- ============================================================
-- PROPOPAD DATABASE SCHEMA
-- ============================================================

-- Utility: update_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 1. AGENCIES (core tenant)
-- ============================================================
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#fc956e',
  dark_color TEXT DEFAULT '#0C0C0E',
  secondary_color TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  hourly_rate DECIMAL(10,2),
  proposal_prefix TEXT,
  proposal_counter INTEGER DEFAULT 0,
  default_validity_days INTEGER DEFAULT 30,
  default_revision_rounds INTEGER DEFAULT 2,
  default_notice_period TEXT DEFAULT '30 days',
  about_text TEXT,
  onboarding_step INTEGER DEFAULT 1,
  onboarding_complete BOOLEAN DEFAULT false,
  scraped_data JSONB
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. USERS (profiles linked to auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name TEXT,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'owner',
  avatar_url TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Agency RLS: users see own agency
CREATE POLICY "Users see own agency" ON public.agencies
  FOR SELECT USING (
    id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Users update own agency" ON public.agencies
  FOR UPDATE USING (
    id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 3. SERVICE GROUPS
-- ============================================================
CREATE TABLE public.service_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER,
  is_default BOOLEAN DEFAULT true
);

ALTER TABLE public.service_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service groups are readable by everyone" ON public.service_groups
  FOR SELECT USING (true);

-- ============================================================
-- 4. SERVICE MODULES
-- ============================================================
CREATE TABLE public.service_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  group_id UUID REFERENCES public.service_groups(id),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  icon TEXT,
  service_type TEXT DEFAULT 'core',
  pricing_model TEXT DEFAULT 'fixed',
  price_fixed DECIMAL(10,2),
  price_monthly DECIMAL(10,2),
  price_hourly DECIMAL(10,2),
  estimated_hours DECIMAL(10,2),
  deliverables TEXT[],
  client_responsibilities TEXT[],
  out_of_scope TEXT[],
  default_timeline TEXT,
  suggested_kpis TEXT[],
  common_tools TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency service modules" ON public.service_modules
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
    OR is_default = true
  );

CREATE POLICY "Users manage own agency service modules" ON public.service_modules
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 5. BUNDLES
-- ============================================================
CREATE TABLE public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  bundle_price DECIMAL(10,2),
  individual_total DECIMAL(10,2),
  savings_amount DECIMAL(10,2),
  savings_label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency bundles" ON public.bundles
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 6. BUNDLE_MODULES (junction)
-- ============================================================
CREATE TABLE public.bundle_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.service_modules(id)
);

ALTER TABLE public.bundle_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency bundle modules" ON public.bundle_modules
  FOR ALL USING (
    bundle_id IN (
      SELECT id FROM public.bundles WHERE agency_id IN (
        SELECT agency_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- 7. DIFFERENTIATORS
-- ============================================================
CREATE TABLE public.differentiators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  title TEXT NOT NULL,
  description TEXT,
  stat_value TEXT,
  stat_label TEXT,
  icon TEXT,
  display_order INTEGER
);

ALTER TABLE public.differentiators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency differentiators" ON public.differentiators
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 8. TESTIMONIALS
-- ============================================================
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  client_name TEXT NOT NULL,
  client_title TEXT,
  client_company TEXT,
  quote TEXT NOT NULL,
  metric_value TEXT,
  metric_label TEXT,
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  relevant_services TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency testimonials" ON public.testimonials
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 9. TERMS CLAUSES
-- ============================================================
CREATE TABLE public.terms_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER,
  is_default BOOLEAN DEFAULT true
);

ALTER TABLE public.terms_clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency terms" ON public.terms_clauses
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 10. PAYMENT TEMPLATES
-- ============================================================
CREATE TABLE public.payment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  name TEXT NOT NULL,
  milestones JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false
);

ALTER TABLE public.payment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency payment templates" ON public.payment_templates
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 11. CLIENTS
-- ============================================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_title TEXT,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency clients" ON public.clients
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 12. PROPOSALS
-- ============================================================
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  client_id UUID REFERENCES public.clients(id),
  created_by UUID REFERENCES public.users(id),
  reference_number TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  executive_summary TEXT,
  executive_summary_tone TEXT DEFAULT 'professional',
  project_start_date DATE,
  estimated_duration TEXT,
  phases JSONB,
  total_fixed DECIMAL(10,2) DEFAULT 0,
  total_monthly DECIMAL(10,2) DEFAULT 0,
  total_estimated DECIMAL(10,2) DEFAULT 0,
  bundle_savings DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) DEFAULT 0,
  payment_template_id UUID REFERENCES public.payment_templates(id),
  custom_milestones JSONB,
  validity_days INTEGER DEFAULT 30,
  valid_until DATE,
  revision_rounds INTEGER DEFAULT 2,
  notice_period TEXT DEFAULT '30 days',
  selected_testimonial_ids UUID[],
  selected_differentiator_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency proposals" ON public.proposals
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 13. PROPOSAL SERVICES
-- ============================================================
CREATE TABLE public.proposal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.service_modules(id),
  bundle_id UUID REFERENCES public.bundles(id),
  price_override DECIMAL(10,2),
  pricing_model_override TEXT,
  is_addon BOOLEAN DEFAULT false,
  display_order INTEGER,
  custom_description TEXT,
  custom_deliverables TEXT[]
);

ALTER TABLE public.proposal_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency proposal services" ON public.proposal_services
  FOR ALL USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE agency_id IN (
        SELECT agency_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- 14. PROPOSAL ANALYTICS
-- ============================================================
CREATE TABLE public.proposal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  section_name TEXT,
  duration_seconds INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics can be inserted by anyone (public proposal views)
CREATE POLICY "Anyone can insert analytics" ON public.proposal_analytics
  FOR INSERT WITH CHECK (true);

-- Only agency users can read analytics
CREATE POLICY "Users see own agency analytics" ON public.proposal_analytics
  FOR SELECT USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE agency_id IN (
        SELECT agency_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- 15. TIMELINE PHASES (defaults)
-- ============================================================
CREATE TABLE public.timeline_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  name TEXT NOT NULL,
  default_duration TEXT,
  description TEXT,
  display_order INTEGER
);

ALTER TABLE public.timeline_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency timeline phases" ON public.timeline_phases
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- SEED: Default Service Groups
-- ============================================================
INSERT INTO public.service_groups (name, description, icon, display_order) VALUES
  ('Brand & Creative', 'Visual identity, messaging, and design', 'Palette', 1),
  ('Website & Digital', 'Website design, development, and maintenance', 'Globe', 2),
  ('Content & Copywriting', 'Strategy, blog content, and website copy', 'PenTool', 3),
  ('SEO & Organic Growth', 'Search optimization and organic traffic', 'TrendingUp', 4),
  ('Paid Advertising', 'Paid search, social ads, and landing pages', 'Megaphone', 5),
  ('Social Media', 'Management, strategy, and video content', 'Share2', 6),
  ('Email Marketing', 'Campaigns, automation, and newsletters', 'Mail', 7),
  ('Analytics & Data', 'Setup, reporting, and CRO', 'BarChart3', 8),
  ('Marketing Strategy', 'Strategic planning and consulting', 'Compass', 9);

-- ============================================================
-- FUNCTION: Handle new user signup
-- Creates agency + user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_agency_id UUID;
BEGIN
  -- Create a new agency for the user
  INSERT INTO public.agencies (name, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Agency',
    NEW.email
  )
  RETURNING id INTO new_agency_id;

  -- Create user profile
  INSERT INTO public.users (id, agency_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_agency_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
