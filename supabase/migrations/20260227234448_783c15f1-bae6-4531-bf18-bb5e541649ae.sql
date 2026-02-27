
ALTER TABLE public.agencies 
  ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS scrape_url TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

ALTER TABLE public.differentiators
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
