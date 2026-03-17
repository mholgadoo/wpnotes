-- Storage buckets: create via Supabase Dashboard or API.
-- Documented here as reference.

-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vault-files', 'vault-files', false);

-- RLS for storage.objects:

-- CREATE POLICY "Users can upload own attachments"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own attachments"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own attachments"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
