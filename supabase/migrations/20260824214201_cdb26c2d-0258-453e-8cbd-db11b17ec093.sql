CREATE POLICY "dispute_files_public_upload" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'dispute-files');
CREATE POLICY "dispute_files_staff_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dispute-files');
CREATE POLICY "dispute_files_staff_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'dispute-files');
CREATE POLICY "dispute_files_admin_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'dispute-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));