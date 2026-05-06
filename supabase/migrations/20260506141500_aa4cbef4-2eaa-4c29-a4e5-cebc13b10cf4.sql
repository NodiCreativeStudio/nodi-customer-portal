
CREATE TYPE public.document_category AS ENUM ('report','invoice','contract','deliverable','onboarding','other');

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL,
  category public.document_category NOT NULL DEFAULT 'other',
  storage_path text,
  external_url text,
  file_size bigint,
  mime_type text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage documents" ON public.documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view own documents" ON public.documents
  FOR SELECT TO authenticated
  USING (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients insert own documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients delete own documents" ON public.documents
  FOR DELETE TO authenticated
  USING (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_documents_client ON public.documents(client_id);
CREATE INDEX idx_documents_category ON public.documents(category);
