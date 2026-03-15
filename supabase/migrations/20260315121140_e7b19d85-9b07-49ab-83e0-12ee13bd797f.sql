
-- Add global toggles to proposals
ALTER TABLE public.proposals 
  ADD COLUMN IF NOT EXISTS show_client_responsibilities boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_out_of_scope boolean DEFAULT false;

-- Add per-service data and toggles to proposal_services
ALTER TABLE public.proposal_services
  ADD COLUMN IF NOT EXISTS client_responsibilities text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS out_of_scope text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_responsibilities boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_out_of_scope boolean DEFAULT true;
