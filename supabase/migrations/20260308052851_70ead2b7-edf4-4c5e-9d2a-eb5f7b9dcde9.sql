
-- payment_confirmations table
CREATE TABLE public.payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT
);
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own payment confirmations" ON public.payment_confirmations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payment confirmations" ON public.payment_confirmations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment confirmations" ON public.payment_confirmations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment confirmations" ON public.payment_confirmations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'dark',
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT,
  notification_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- market_analysis_log table
CREATE TABLE public.market_analysis_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  instrument TEXT NOT NULL,
  analysis_text TEXT NOT NULL,
  bias TEXT,
  direction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.market_analysis_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analysis logs" ON public.market_analysis_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own analysis logs" ON public.market_analysis_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all analysis logs" ON public.market_analysis_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own support tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own support tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all support tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update support tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- admin_settings table for subscription pricing etc
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin settings" ON public.admin_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update admin settings" ON public.admin_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert admin settings" ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing
INSERT INTO public.admin_settings (key, value) VALUES ('subscription_pricing', '{"monthly_nad": 165, "monthly_usd": 9, "annual_nad": 1650, "annual_usd": 90, "annual_discount_pct": 17}');
INSERT INTO public.admin_settings (key, value) VALUES ('market_analysis_config', '{"enabled": true, "pro_only": true, "disclaimer": "This is educational analysis, not financial advice. Always confirm on your own timeframe."}');
INSERT INTO public.admin_settings (key, value) VALUES ('support_contact', '{"email": "traderdrprecision@gmail.com"}');
