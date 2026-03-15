
CREATE POLICY "Public can read portfolio items for shared proposals"
ON public.portfolio_items
FOR SELECT
TO public
USING (
  agency_id IN (
    SELECT proposals.agency_id
    FROM proposals
    WHERE proposals.id IN (SELECT get_shared_proposal_ids())
  )
);
