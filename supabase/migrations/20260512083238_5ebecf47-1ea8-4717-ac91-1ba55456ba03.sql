-- Enums
CREATE TYPE public.subscription_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE public.client_tech_status AS ENUM ('active', 'inactive');

-- Catalog
CREATE TABLE public.tech_stack_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description_what TEXT NOT NULL,
  description_do TEXT NOT NULL,
  description_why TEXT NOT NULL,
  icon_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tech_stack_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read catalog" ON public.tech_stack_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage catalog" ON public.tech_stack_catalog FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_catalog_updated BEFORE UPDATE ON public.tech_stack_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Subscriptions
CREATE TABLE public.tech_stack_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tech_stack_id UUID NOT NULL REFERENCES public.tech_stack_catalog(id) ON DELETE CASCADE,
  subscription_type subscription_type NOT NULL,
  cost_monthly NUMERIC(10,2),
  cost_yearly NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tech_stack_id, subscription_type)
);
ALTER TABLE public.tech_stack_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read subs" ON public.tech_stack_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage subs" ON public.tech_stack_subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.tech_stack_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Client assignments
CREATE TABLE public.client_tech_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  tech_stack_id UUID NOT NULL REFERENCES public.tech_stack_catalog(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.tech_stack_subscriptions(id) ON DELETE RESTRICT,
  status client_tech_status NOT NULL DEFAULT 'active',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, tech_stack_id)
);
ALTER TABLE public.client_tech_stack ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client read own tech" ON public.client_tech_stack FOR SELECT TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage assignments" ON public.client_tech_stack FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_cts_updated BEFORE UPDATE ON public.client_tech_stack
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_cts_client ON public.client_tech_stack(client_id);
CREATE INDEX idx_cts_tool ON public.client_tech_stack(tech_stack_id);
CREATE INDEX idx_subs_tool ON public.tech_stack_subscriptions(tech_stack_id);

-- Views
CREATE VIEW public.tech_stack_costs_summary
WITH (security_invoker=on) AS
SELECT
  c.id AS client_id,
  c.company_name AS client_name,
  COUNT(cts.id) FILTER (WHERE cts.status='active') AS tools_count,
  COALESCE(SUM(s.cost_monthly) FILTER (WHERE cts.status='active'),0) AS total_cost_monthly,
  COALESCE(SUM(s.cost_yearly) FILTER (WHERE cts.status='active'),0) AS total_cost_yearly,
  MAX(cts.updated_at) AS last_updated
FROM public.clients c
LEFT JOIN public.client_tech_stack cts ON cts.client_id = c.id
LEFT JOIN public.tech_stack_subscriptions s ON s.id = cts.subscription_id
GROUP BY c.id, c.company_name;

CREATE VIEW public.tech_stack_tool_breakdown
WITH (security_invoker=on) AS
SELECT
  t.id AS tech_stack_id,
  t.name AS tool_name,
  t.website_url AS tool_website,
  COUNT(cts.id) AS clients_using_count,
  COUNT(cts.id) FILTER (WHERE cts.status='active') AS active_clients_count,
  COALESCE(SUM(s.cost_monthly) FILTER (WHERE cts.status='active'),0) AS total_cost_monthly,
  COALESCE(SUM(s.cost_yearly) FILTER (WHERE cts.status='active'),0) AS total_cost_yearly
FROM public.tech_stack_catalog t
LEFT JOIN public.client_tech_stack cts ON cts.tech_stack_id = t.id
LEFT JOIN public.tech_stack_subscriptions s ON s.id = cts.subscription_id
GROUP BY t.id, t.name, t.website_url;