
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS hubspot_deal_id TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS hubspot_contact_id TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS hubspot_company_id TEXT;
