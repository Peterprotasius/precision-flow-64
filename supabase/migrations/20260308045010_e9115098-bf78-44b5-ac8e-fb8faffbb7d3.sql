-- Make all storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('screenshots', 'avatars', 'chart-screenshots');

-- Drop ALL existing storage policies to start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Screenshots bucket: ownership-scoped policies
CREATE POLICY "screenshots_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "screenshots_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "screenshots_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars bucket: ownership-scoped policies
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Chart-screenshots bucket: ownership-scoped policies
CREATE POLICY "chart_screenshots_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chart-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chart_screenshots_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chart-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chart_screenshots_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chart-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);