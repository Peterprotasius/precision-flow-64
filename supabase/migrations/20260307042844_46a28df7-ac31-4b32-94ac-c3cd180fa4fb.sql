
-- Prop firm accounts table
CREATE TABLE public.prop_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  firm_name TEXT NOT NULL,
  account_label TEXT NOT NULL DEFAULT 'Challenge',
  account_size NUMERIC NOT NULL DEFAULT 10000,
  profit_target_pct NUMERIC NOT NULL DEFAULT 8,
  daily_loss_limit_pct NUMERIC NOT NULL DEFAULT 5,
  total_drawdown_pct NUMERIC NOT NULL DEFAULT 10,
  current_balance NUMERIC NOT NULL DEFAULT 10000,
  current_pnl NUMERIC NOT NULL DEFAULT 0,
  daily_pnl NUMERIC NOT NULL DEFAULT 0,
  phase TEXT NOT NULL DEFAULT 'Phase 1',
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prop_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prop accounts" ON public.prop_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prop accounts" ON public.prop_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prop accounts" ON public.prop_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prop accounts" ON public.prop_accounts FOR DELETE USING (auth.uid() = user_id);

-- Psychology check-ins table
CREATE TABLE public.psychology_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_type TEXT NOT NULL DEFAULT 'pre_session',
  htf_bias TEXT,
  market_conditions TEXT,
  emotional_state TEXT NOT NULL DEFAULT 'Neutral',
  energy_level INTEGER NOT NULL DEFAULT 5,
  sleep_quality INTEGER NOT NULL DEFAULT 5,
  confidence_rating INTEGER NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psychology_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.psychology_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.psychology_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.psychology_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.psychology_checkins FOR DELETE USING (auth.uid() = user_id);
