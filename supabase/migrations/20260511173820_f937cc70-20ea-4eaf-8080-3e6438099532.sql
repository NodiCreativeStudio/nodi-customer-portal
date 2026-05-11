ALTER TABLE public.onboarding_moduli
  ADD COLUMN IF NOT EXISTS ragione_sociale text,
  ADD COLUMN IF NOT EXISTS anagrafica jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pagina_1_dati jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pagina_2_dati jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pagina_3_dati jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verticale text,
  ADD COLUMN IF NOT EXISTS completato_il timestamptz;