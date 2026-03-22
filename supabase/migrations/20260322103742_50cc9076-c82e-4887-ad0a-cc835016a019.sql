
-- 1. Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES public.users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on team_invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- 3. RLS for team_invites - agency members can manage
CREATE POLICY "Users can view their agency invites"
  ON public.team_invites FOR SELECT
  TO authenticated
  USING (agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can insert invites for their agency"
  ON public.team_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Admins can update their agency invites"
  ON public.team_invites FOR UPDATE
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Admins can delete their agency invites"
  ON public.team_invites FOR DELETE
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- Allow anon/service to read invites by token (for accept flow)
CREATE POLICY "Anyone can read invite by token"
  ON public.team_invites FOR SELECT
  TO anon
  USING (true);

-- 4. Add created_by/updated_by to key tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id);

-- 5. Update users RLS: allow reading all users in same agency
CREATE POLICY "Users can read agency members"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
  );

-- 6. Allow owner/admin to update other users' roles in same agency
CREATE POLICY "Admins can update agency members"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    agency_id = (SELECT agency_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- 7. Auto-set created_by trigger
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_proposals_created_by
  BEFORE INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_clients_created_by
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_bundles_created_by
  BEFORE INSERT ON public.bundles
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_packages_created_by
  BEFORE INSERT ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();
