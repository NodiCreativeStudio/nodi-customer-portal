-- 1. Folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint (handles NULL parent_id via two partial indexes)
CREATE UNIQUE INDEX folders_unique_with_parent
  ON public.folders (client_id, parent_id, folder_name)
  WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX folders_unique_root
  ON public.folders (client_id, folder_name)
  WHERE parent_id IS NULL;

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own folders" ON public.folders
  FOR SELECT TO authenticated
  USING (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients create folders" ON public.folders
  FOR INSERT TO authenticated
  WITH CHECK (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients update folders" ON public.folders
  FOR UPDATE TO authenticated
  USING (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients delete folders" ON public.folders
  FOR DELETE TO authenticated
  USING (client_id = public.current_user_company() OR public.has_role(auth.uid(), 'admin'));

-- 2. Add folder_id to uploads
ALTER TABLE public.uploads
  ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- 3. Auto-create default folders for new clients
CREATE OR REPLACE FUNCTION public.create_default_folders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.folders (client_id, folder_name, parent_id)
  VALUES (NEW.id, 'General', NULL),
         (NEW.id, 'Documents', NULL),
         (NEW.id, 'Archive', NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_default_folders
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.create_default_folders();

-- 4. Backfill: create default folders for existing clients that have none
INSERT INTO public.folders (client_id, folder_name, parent_id)
SELECT c.id, f.name, NULL
FROM public.clients c
CROSS JOIN (VALUES ('General'), ('Documents'), ('Archive')) AS f(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.folders fo WHERE fo.client_id = c.id AND fo.parent_id IS NULL
);