-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-os', 'fotos-os', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-os');

CREATE POLICY "Allow public to view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fotos-os');

CREATE POLICY "Allow authenticated users to delete their photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fotos-os');
