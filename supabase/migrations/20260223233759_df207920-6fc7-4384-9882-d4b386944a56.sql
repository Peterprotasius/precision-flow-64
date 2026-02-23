
-- Add Pro subscription columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN pro_expires_at TIMESTAMP WITH TIME ZONE;

-- Add is_admin column for admin panel access
ALTER TABLE public.profiles
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient expiry checks
CREATE INDEX idx_profiles_pro_expiry ON public.profiles (is_pro, pro_expires_at)
WHERE is_pro = true;

-- Allow admins to read all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  )
);

-- Allow admins to update all profiles (for Pro activation)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  )
);
