
-- Trade tags table for advanced SMC tagging (Section 3)
CREATE TABLE public.trade_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  user_id UUID NOT NULL,
  setup_types TEXT[] DEFAULT '{}',
  session TEXT DEFAULT 'other',
  execution_quality TEXT DEFAULT 'B Setup',
  timeframe_bias TEXT[] DEFAULT '{}',
  strategy TEXT DEFAULT 'Smart Money Concepts',
  custom_strategy_name TEXT,
  trade_outcome_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade tags" ON public.trade_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trade tags" ON public.trade_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade tags" ON public.trade_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trade tags" ON public.trade_tags FOR DELETE USING (auth.uid() = user_id);

-- Broker connections table (Section 2)
CREATE TABLE public.broker_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL,
  broker_type TEXT NOT NULL DEFAULT 'mt5',
  account_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'disconnected',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broker connections" ON public.broker_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own broker connections" ON public.broker_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own broker connections" ON public.broker_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own broker connections" ON public.broker_connections FOR DELETE USING (auth.uid() = user_id);

-- Trade screenshots table for before/after images (Section 4)
CREATE TABLE public.trade_screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL,
  user_id UUID NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'before',
  image_url TEXT NOT NULL,
  annotated_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade screenshots" ON public.trade_screenshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trade screenshots" ON public.trade_screenshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade screenshots" ON public.trade_screenshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trade screenshots" ON public.trade_screenshots FOR DELETE USING (auth.uid() = user_id);

-- Create chart-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chart-screenshots', 'chart-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chart-screenshots bucket
CREATE POLICY "Users can upload chart screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chart-screenshots' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view chart screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'chart-screenshots');
CREATE POLICY "Users can update own chart screenshots" ON storage.objects FOR UPDATE USING (bucket_id = 'chart-screenshots' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own chart screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'chart-screenshots' AND auth.uid() IS NOT NULL);
