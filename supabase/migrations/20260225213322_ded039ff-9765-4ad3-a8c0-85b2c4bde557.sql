
-- Create a public bucket for agency logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own agency folder
CREATE POLICY "Authenticated users can upload agency logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agency-logos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update agency logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agency-logos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete agency logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agency-logos');

-- Allow public read access (logos are shown on public proposals)
CREATE POLICY "Public read access for agency logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agency-logos');
