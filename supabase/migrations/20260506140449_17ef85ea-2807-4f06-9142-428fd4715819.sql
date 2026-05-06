ALTER TABLE public.uploads
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'general';

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Clients can view own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'uploads' AND (
    public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
    OR (storage.foldername(name))[1] = public.current_user_company()::text
  )
);

CREATE POLICY "Clients can upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND (
    public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
    OR (storage.foldername(name))[1] = public.current_user_company()::text
  )
);

CREATE POLICY "Clients can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'uploads' AND (
    public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
    OR (storage.foldername(name))[1] = public.current_user_company()::text
  )
);
