ALTER TABLE public.credentials
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Clients insert own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Clients update own credentials" ON public.credentials;
DROP POLICY IF EXISTS "Clients delete own credentials" ON public.credentials;

CREATE POLICY "Clients view own credentials"
ON public.credentials FOR SELECT TO authenticated
USING (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE POLICY "Clients insert own credentials"
ON public.credentials FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE POLICY "Clients update own credentials"
ON public.credentials FOR UPDATE TO authenticated
USING (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE POLICY "Clients delete own credentials"
ON public.credentials FOR DELETE TO authenticated
USING (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_credentials_updated_at ON public.credentials;
CREATE TRIGGER trg_credentials_updated_at
BEFORE UPDATE ON public.credentials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
