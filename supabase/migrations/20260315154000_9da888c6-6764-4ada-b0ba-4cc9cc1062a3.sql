
-- Portfolio items table
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  results TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency portfolio items"
  ON public.portfolio_items FOR ALL
  USING (agency_id IN (SELECT users.agency_id FROM users WHERE users.id = auth.uid()));

-- Proposal-portfolio junction table
CREATE TABLE public.proposal_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  portfolio_item_id UUID REFERENCES public.portfolio_items(id),
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.proposal_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own agency proposal portfolio"
  ON public.proposal_portfolio FOR ALL
  USING (proposal_id IN (
    SELECT proposals.id FROM proposals
    WHERE proposals.agency_id IN (SELECT users.agency_id FROM users WHERE users.id = auth.uid())
  ));

-- Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload portfolio images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio-images');

CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Authenticated users can delete portfolio images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio-images');
