
-- Tighten the analytics insert policy to require a valid proposal_id
DROP POLICY "Anyone can insert analytics" ON public.proposal_analytics;

CREATE POLICY "Anyone can insert analytics for existing proposals" ON public.proposal_analytics
  FOR INSERT WITH CHECK (
    proposal_id IN (SELECT id FROM public.proposals)
  );
