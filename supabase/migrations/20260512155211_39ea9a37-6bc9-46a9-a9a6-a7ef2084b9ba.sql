
-- Enums
CREATE TYPE public.subscription_status AS ENUM ('active','cancelled','past_due','incomplete');
CREATE TYPE public.payment_type AS ENUM ('onboarding','monthly_subscription');
CREATE TYPE public.payment_status AS ENUM ('succeeded','failed','pending','cancelled');
CREATE TYPE public.mandate_status AS ENUM ('accepted','rejected','cancelled');

-- subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_method_id TEXT,
  iban_last_4 TEXT,
  subscription_status public.subscription_status NOT NULL DEFAULT 'incomplete',
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 400.00,
  onboarding_fee NUMERIC(10,2) NOT NULL DEFAULT 600.00,
  onboarding_paid BOOLEAN NOT NULL DEFAULT false,
  onboarding_paid_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  last_payment_status TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_client ON public.subscriptions(client_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  stripe_payment_id TEXT,
  stripe_invoice_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_type public.payment_type NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  failure_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_client_created ON public.payments(client_id, created_at DESC);
CREATE INDEX idx_payments_subscription ON public.payments(subscription_id);
CREATE UNIQUE INDEX idx_payments_stripe ON public.payments(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

-- payment_methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  stripe_payment_method_id TEXT,
  type TEXT NOT NULL DEFAULT 'sepa_debit',
  iban_country TEXT,
  iban_last_4 TEXT,
  account_holder_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT true,
  mandate_status public.mandate_status NOT NULL DEFAULT 'accepted',
  mandate_id TEXT,
  mandate_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_methods_client ON public.payment_methods(client_id);

-- webhooks_log
CREATE TABLE public.webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhooks_log_type_proc ON public.webhooks_log(event_type, processed);
CREATE UNIQUE INDEX idx_webhooks_log_event ON public.webhooks_log(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- updated_at triggers
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payment_methods_updated BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;

-- subscriptions policies
CREATE POLICY "Admin manage subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Client view own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Client insert own subscription" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Client update own subscription" ON public.subscriptions FOR UPDATE TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));

-- payments policies
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Client view own payments" ON public.payments FOR SELECT TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));

-- payment_methods policies
CREATE POLICY "Admin manage pm" ON public.payment_methods FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Client view own pm" ON public.payment_methods FOR SELECT TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Client insert own pm" ON public.payment_methods FOR INSERT TO authenticated
  WITH CHECK (client_id = current_user_company() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Client update own pm" ON public.payment_methods FOR UPDATE TO authenticated
  USING (client_id = current_user_company() OR has_role(auth.uid(),'admin'));

-- webhooks_log policies (admin only)
CREATE POLICY "Admin read webhooks" ON public.webhooks_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin insert webhooks" ON public.webhooks_log FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
