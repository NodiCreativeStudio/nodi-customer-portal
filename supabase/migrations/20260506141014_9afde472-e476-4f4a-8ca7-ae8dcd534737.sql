DO $$ BEGIN
  CREATE TYPE public.tech_status AS ENUM ('active','inactive','trial','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tech_stack
  ADD COLUMN IF NOT EXISTS status public.tech_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS connected_account TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS cost_annual NUMERIC,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_tech_stack_updated_at ON public.tech_stack;
CREATE TRIGGER trg_tech_stack_updated_at
BEFORE UPDATE ON public.tech_stack
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tech_stack ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view own tech stack" ON public.tech_stack;
DROP POLICY IF EXISTS "Clients insert own tech stack" ON public.tech_stack;
DROP POLICY IF EXISTS "Clients update own tech stack" ON public.tech_stack;
DROP POLICY IF EXISTS "Clients delete own tech stack" ON public.tech_stack;

CREATE POLICY "Clients view own tech stack"
ON public.tech_stack FOR SELECT TO authenticated
USING (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE POLICY "Clients insert own tech stack"
ON public.tech_stack FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE POLICY "Clients update own tech stack"
ON public.tech_stack FOR UPDATE TO authenticated
USING (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);

CREATE POLICY "Clients delete own tech stack"
ON public.tech_stack FOR DELETE TO authenticated
USING (
  public.has_role(_role => 'admin'::public.app_role, _user_id => auth.uid())
  OR client_id = public.current_user_company()
);
