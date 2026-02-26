
-- Create a security definer function to check if a proposal_id has active shares
-- This breaks the infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.has_active_share(p_proposal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposal_shares
    WHERE proposal_id = p_proposal_id
      AND is_active = true
  )
$$;

-- Create a function to get proposal_ids with active shares
CREATE OR REPLACE FUNCTION public.get_shared_proposal_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT proposal_id FROM public.proposal_shares WHERE is_active = true
$$;

-- Now fix the proposal_shares policies - drop the ALL policy that causes recursion
DROP POLICY IF EXISTS "Users manage own agency shares" ON public.proposal_shares;
DROP POLICY IF EXISTS "Public can read active shares" ON public.proposal_shares;

-- Recreate with security definer function for the user check
CREATE OR REPLACE FUNCTION public.get_user_agency_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.users WHERE id = p_user_id LIMIT 1
$$;

-- Recreate proposal_shares policies without recursion
CREATE POLICY "Public can read active shares"
ON public.proposal_shares
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users manage own agency shares"
ON public.proposal_shares
FOR ALL
USING (
  proposal_id IN (
    SELECT id FROM public.proposals
    WHERE agency_id = public.get_user_agency_id(auth.uid())
  )
);

-- Fix agencies policies that reference proposal_shares
DROP POLICY IF EXISTS "Public can read agency for shared proposals" ON public.agencies;
CREATE POLICY "Public can read agency for shared proposals"
ON public.agencies
FOR SELECT
USING (
  id IN (
    SELECT agency_id FROM public.proposals
    WHERE id IN (SELECT public.get_shared_proposal_ids())
  )
);

-- Fix clients policies
DROP POLICY IF EXISTS "Public can read client for shared proposals" ON public.clients;
CREATE POLICY "Public can read client for shared proposals"
ON public.clients
FOR SELECT
USING (
  id IN (
    SELECT client_id FROM public.proposals
    WHERE id IN (SELECT public.get_shared_proposal_ids())
  )
);

-- Fix differentiators policies
DROP POLICY IF EXISTS "Public can read differentiators for shared proposals" ON public.differentiators;
CREATE POLICY "Public can read differentiators for shared proposals"
ON public.differentiators
FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM public.proposals
    WHERE id IN (SELECT public.get_shared_proposal_ids())
  )
);

-- Fix proposal_services policies
DROP POLICY IF EXISTS "Public can read shared proposal services" ON public.proposal_services;
CREATE POLICY "Public can read shared proposal services"
ON public.proposal_services
FOR SELECT
USING (proposal_id IN (SELECT public.get_shared_proposal_ids()));

-- Fix proposals policies
DROP POLICY IF EXISTS "Public can read shared proposals" ON public.proposals;
CREATE POLICY "Public can read shared proposals"
ON public.proposals
FOR SELECT
USING (id IN (SELECT public.get_shared_proposal_ids()));

DROP POLICY IF EXISTS "Public can mark proposals as viewed" ON public.proposals;
CREATE POLICY "Public can mark proposals as viewed"
ON public.proposals
FOR UPDATE
USING (id IN (SELECT public.get_shared_proposal_ids()))
WITH CHECK (id IN (SELECT public.get_shared_proposal_ids()));

-- Fix service_modules policies
DROP POLICY IF EXISTS "Public can read modules for shared proposals" ON public.service_modules;
CREATE POLICY "Public can read modules for shared proposals"
ON public.service_modules
FOR SELECT
USING (
  id IN (
    SELECT module_id FROM public.proposal_services
    WHERE proposal_id IN (SELECT public.get_shared_proposal_ids())
  )
);

-- Fix terms_clauses policies
DROP POLICY IF EXISTS "Public can read terms for shared proposals" ON public.terms_clauses;
CREATE POLICY "Public can read terms for shared proposals"
ON public.terms_clauses
FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM public.proposals
    WHERE id IN (SELECT public.get_shared_proposal_ids())
  )
);

-- Fix testimonials policies
DROP POLICY IF EXISTS "Public can read testimonials for shared proposals" ON public.testimonials;
CREATE POLICY "Public can read testimonials for shared proposals"
ON public.testimonials
FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM public.proposals
    WHERE id IN (SELECT public.get_shared_proposal_ids())
  )
);
