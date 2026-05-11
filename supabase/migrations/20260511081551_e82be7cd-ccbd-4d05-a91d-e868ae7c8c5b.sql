
-- =========================================================
-- agency_config (single row)
-- =========================================================
CREATE TABLE public.agency_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp_link TEXT,
  calendly_link TEXT,
  business_hours TEXT,
  support_email TEXT,
  support_phone TEXT,
  sender_email TEXT,
  send_welcome_email BOOLEAN NOT NULL DEFAULT TRUE,
  send_onboarding_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  send_monthly_report BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
ALTER TABLE public.agency_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can read agency_config"
  ON public.agency_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage agency_config"
  ON public.agency_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_agency_config_updated_at
  BEFORE UPDATE ON public.agency_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.agency_config (id) VALUES (TRUE);

-- =========================================================
-- agency_faqs
-- =========================================================
CREATE TABLE public.agency_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can read FAQs"
  ON public.agency_faqs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage FAQs"
  ON public.agency_faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_agency_faqs_updated_at
  BEFORE UPDATE ON public.agency_faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- activity_log
-- =========================================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  client_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX idx_activity_log_client_id ON public.activity_log (client_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read activity log"
  ON public.activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert activity"
  ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================================
-- Trigger functions to populate activity_log
-- =========================================================
CREATE OR REPLACE FUNCTION public.log_client_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_log (actor_id, client_id, action, entity_type, entity_id, label)
  VALUES (auth.uid(), NEW.id, 'created', 'client', NEW.id, NEW.company_name);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_log_client_insert
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_client_activity();

CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.activity_log (actor_id, client_id, action, entity_type, entity_id, label)
    VALUES (auth.uid(), NEW.client_id, 'created', 'project', NEW.id, NEW.project_name);
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.activity_log (actor_id, client_id, action, entity_type, entity_id, label, metadata)
    VALUES (auth.uid(), NEW.client_id, 'status_changed', 'project', NEW.id, NEW.project_name,
            jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_log_project_change
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_project_activity();

CREATE OR REPLACE FUNCTION public.log_upload_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_log (actor_id, client_id, action, entity_type, entity_id, label)
  VALUES (NEW.uploaded_by, NEW.client_id, 'uploaded', 'file', NEW.id, NEW.file_name);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_log_upload_insert
  AFTER INSERT ON public.uploads
  FOR EACH ROW EXECUTE FUNCTION public.log_upload_activity();

CREATE OR REPLACE FUNCTION public.log_onboarding_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE) THEN
    INSERT INTO public.activity_log (actor_id, client_id, action, entity_type, entity_id, label)
    VALUES (NEW.id, NEW.company_id, 'completed_onboarding', 'profile', NEW.id, COALESCE(NEW.full_name, NEW.email));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_log_onboarding_completed
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_onboarding_completed();
