
-- Allow anonymous users to read active proposal shares by share_id
CREATE POLICY "Public can read active shares" ON public.proposal_shares
  FOR SELECT USING (is_active = true);

-- Allow anonymous read on proposals via share (for public view)
CREATE POLICY "Public can read shared proposals" ON public.proposals
  FOR SELECT USING (id IN (
    SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
  ));

-- Allow anonymous read on proposal_services for shared proposals
CREATE POLICY "Public can read shared proposal services" ON public.proposal_services
  FOR SELECT USING (proposal_id IN (
    SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
  ));

-- Allow anonymous read on agencies for shared proposals
CREATE POLICY "Public can read agency for shared proposals" ON public.agencies
  FOR SELECT USING (id IN (
    SELECT agency_id FROM public.proposals WHERE id IN (
      SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
    )
  ));

-- Allow anonymous read on clients for shared proposals
CREATE POLICY "Public can read client for shared proposals" ON public.clients
  FOR SELECT USING (id IN (
    SELECT client_id FROM public.proposals WHERE id IN (
      SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
    )
  ));

-- Allow anonymous INSERT on proposal_analytics (already exists but ensuring)
-- Already covered by existing policy

-- Allow anonymous read on service_modules for shared proposals
CREATE POLICY "Public can read modules for shared proposals" ON public.service_modules
  FOR SELECT USING (id IN (
    SELECT module_id FROM public.proposal_services WHERE proposal_id IN (
      SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
    )
  ));

-- Allow anonymous read on differentiators for shared proposals  
CREATE POLICY "Public can read differentiators for shared proposals" ON public.differentiators
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM public.proposals WHERE id IN (
      SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
    )
  ));

-- Allow anonymous read on testimonials for shared proposals
CREATE POLICY "Public can read testimonials for shared proposals" ON public.testimonials
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM public.proposals WHERE id IN (
      SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
    )
  ));

-- Allow anonymous read on terms_clauses for shared proposals
CREATE POLICY "Public can read terms for shared proposals" ON public.terms_clauses
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM public.proposals WHERE id IN (
      SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
    )
  ));

-- Allow anonymous UPDATE on proposals (just viewed_at and status for tracking)
CREATE POLICY "Public can mark proposals as viewed" ON public.proposals
  FOR UPDATE USING (id IN (
    SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
  )) WITH CHECK (id IN (
    SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
  ));
