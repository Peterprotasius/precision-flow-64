
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profit NUMERIC NOT NULL,
  lot_size NUMERIC NOT NULL DEFAULT 0.1,
  risk_percent NUMERIC NOT NULL DEFAULT 1,
  rr_ratio NUMERIC NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'open' CHECK (result IN ('win', 'loss', 'breakeven', 'open')),
  profit_loss_amount NUMERIC NOT NULL DEFAULT 0,
  timeframe TEXT NOT NULL DEFAULT '15m',
  htf_bias TEXT NOT NULL DEFAULT 'bullish' CHECK (htf_bias IN ('bullish', 'bearish')),
  bos_present BOOLEAN NOT NULL DEFAULT false,
  liquidity_sweep BOOLEAN NOT NULL DEFAULT false,
  order_block BOOLEAN NOT NULL DEFAULT false,
  confidence_level INTEGER NOT NULL DEFAULT 5,
  emotion_before TEXT,
  emotion_after TEXT,
  notes TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Screenshot storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);

CREATE POLICY "Users can upload screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');
CREATE POLICY "Users can delete their screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
