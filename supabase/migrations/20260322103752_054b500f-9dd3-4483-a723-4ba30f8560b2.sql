
-- Fix the overly permissive anon SELECT policy on team_invites
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.team_invites;

-- Service role can manage invites (for edge function accept flow)
CREATE POLICY "Service role can manage invites"
  ON public.team_invites FOR ALL
  TO service_role
  USING (true);
