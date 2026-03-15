
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS selected_portfolio_ids UUID[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portfolio_section_title TEXT DEFAULT 'Our Work',
  ADD COLUMN IF NOT EXISTS portfolio_section_visible BOOLEAN DEFAULT false;
