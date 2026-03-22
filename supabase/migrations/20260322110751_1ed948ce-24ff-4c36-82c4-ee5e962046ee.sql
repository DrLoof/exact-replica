-- Fix infinite recursion in users table RLS policies
-- Drop the problematic policies that self-reference users table
DROP POLICY IF EXISTS "Users can read agency members" ON public.users;
DROP POLICY IF EXISTS "Admins can update agency members" ON public.users;

-- Recreate using the security definer function to avoid recursion
CREATE POLICY "Users can read agency members" ON public.users
  FOR SELECT TO authenticated
  USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Admins can update agency members" ON public.users
  FOR UPDATE TO authenticated
  USING (
    agency_id = get_user_agency_id(auth.uid())
    AND get_user_agency_id(auth.uid()) IS NOT NULL
  );