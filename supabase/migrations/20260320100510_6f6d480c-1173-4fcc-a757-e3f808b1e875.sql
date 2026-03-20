
-- Allow authenticated users to update service_groups (for reordering)
CREATE POLICY "Authenticated users can update service groups"
ON public.service_groups
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
