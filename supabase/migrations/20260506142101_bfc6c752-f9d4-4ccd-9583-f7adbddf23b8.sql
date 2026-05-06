
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS employee_count text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description text;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority public.task_priority NOT NULL DEFAULT 'medium';
