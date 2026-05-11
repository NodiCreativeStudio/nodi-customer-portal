ALTER TABLE public.agency_config
  ADD COLUMN IF NOT EXISTS contact_role TEXT,
  ADD COLUMN IF NOT EXISTS contact_response_time TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_link TEXT,
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS agency_tagline TEXT;