-- Fix 1: Convert ALL RESTRICTIVE policies to PERMISSIVE across all tables
-- and fix profiles UPDATE to prevent privilege escalation

-- ============ ACHIEVEMENTS ============
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;

CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ BROKER_CONNECTIONS ============
DROP POLICY IF EXISTS "Users can delete own broker connections" ON public.broker_connections;
DROP POLICY IF EXISTS "Users can insert own broker connections" ON public.broker_connections;
DROP POLICY IF EXISTS "Users can update own broker connections" ON public.broker_connections;
DROP POLICY IF EXISTS "Users can view own broker connections" ON public.broker_connections;

CREATE POLICY "Users can delete own broker connections" ON public.broker_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own broker connections" ON public.broker_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own broker connections" ON public.broker_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own broker connections" ON public.broker_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATION_READS ============
DROP POLICY IF EXISTS "Users can insert own notification reads" ON public.notification_reads;
DROP POLICY IF EXISTS "Users can read own notification reads" ON public.notification_reads;

CREATE POLICY "Users can insert own notification reads" ON public.notification_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own notification reads" ON public.notification_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
DROP POLICY IF EXISTS "Authenticated users can read notifications" ON public.notifications;

CREATE POLICY "Authenticated users can read notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_pro = (SELECT p.is_pro FROM public.profiles p WHERE p.user_id = auth.uid())
    AND subscription_status = (SELECT p.subscription_status FROM public.profiles p WHERE p.user_id = auth.uid())
    AND pro_expires_at IS NOT DISTINCT FROM (SELECT p.pro_expires_at FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- ============ PROP_ACCOUNTS ============
DROP POLICY IF EXISTS "Users can delete own prop accounts" ON public.prop_accounts;
DROP POLICY IF EXISTS "Users can insert own prop accounts" ON public.prop_accounts;
DROP POLICY IF EXISTS "Users can update own prop accounts" ON public.prop_accounts;
DROP POLICY IF EXISTS "Users can view own prop accounts" ON public.prop_accounts;

CREATE POLICY "Users can delete own prop accounts" ON public.prop_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prop accounts" ON public.prop_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prop accounts" ON public.prop_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own prop accounts" ON public.prop_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ PSYCHOLOGY_CHECKINS ============
DROP POLICY IF EXISTS "Users can delete own checkins" ON public.psychology_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.psychology_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON public.psychology_checkins;
DROP POLICY IF EXISTS "Users can view own checkins" ON public.psychology_checkins;

CREATE POLICY "Users can delete own checkins" ON public.psychology_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.psychology_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.psychology_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own checkins" ON public.psychology_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ PUSH_SUBSCRIPTIONS ============
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TRADE_SCREENSHOTS ============
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON public.trade_screenshots;
DROP POLICY IF EXISTS "Users can insert own trade screenshots" ON public.trade_screenshots;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON public.trade_screenshots;
DROP POLICY IF EXISTS "Users can view own trade screenshots" ON public.trade_screenshots;

CREATE POLICY "Users can delete own trade screenshots" ON public.trade_screenshots FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trade screenshots" ON public.trade_screenshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade screenshots" ON public.trade_screenshots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own trade screenshots" ON public.trade_screenshots FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ TRADE_TAGS ============
DROP POLICY IF EXISTS "Users can delete own trade tags" ON public.trade_tags;
DROP POLICY IF EXISTS "Users can insert own trade tags" ON public.trade_tags;
DROP POLICY IF EXISTS "Users can update own trade tags" ON public.trade_tags;
DROP POLICY IF EXISTS "Users can view own trade tags" ON public.trade_tags;

CREATE POLICY "Users can delete own trade tags" ON public.trade_tags FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trade tags" ON public.trade_tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade tags" ON public.trade_tags FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own trade tags" ON public.trade_tags FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ TRADES ============
DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;

CREATE POLICY "Users can delete their own trades" ON public.trades FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============ USER_XP ============
DROP POLICY IF EXISTS "Users can insert own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can update own xp" ON public.user_xp;
DROP POLICY IF EXISTS "Users can view own xp" ON public.user_xp;

CREATE POLICY "Users can insert own xp" ON public.user_xp FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp" ON public.user_xp FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own xp" ON public.user_xp FOR SELECT TO authenticated USING (auth.uid() = user_id);