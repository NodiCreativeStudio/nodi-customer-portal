
CREATE TYPE public.onboarding_status AS ENUM ('draft', 'submitted');

CREATE TABLE public.onboarding_moduli (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.onboarding_status NOT NULL DEFAULT 'draft',

  -- Page 1: Anagrafica
  company_name TEXT,
  industry public.client_industry,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  employees_range TEXT,
  vat_id TEXT,
  founding_year INTEGER,
  description TEXT,
  preferred_contact TEXT,
  best_time TEXT,

  -- Page 2: vertical-specific (flexible)
  vertical_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Page 3: goals
  goals TEXT[] NOT NULL DEFAULT '{}',
  budget_range TEXT,
  timeline TEXT,
  additional_requirements TEXT,
  agreed_terms BOOLEAN NOT NULL DEFAULT false,

  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_moduli ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own onboarding"
  ON public.onboarding_moduli FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own onboarding"
  ON public.onboarding_moduli FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own onboarding"
  ON public.onboarding_moduli FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage onboarding"
  ON public.onboarding_moduli FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_onboarding_updated
  BEFORE UPDATE ON public.onboarding_moduli
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_onboarding_user ON public.onboarding_moduli(user_id);
