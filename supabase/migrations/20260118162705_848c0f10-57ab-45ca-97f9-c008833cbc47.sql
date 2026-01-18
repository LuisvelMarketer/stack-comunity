-- =====================================================
-- SECURITY HARDENING MIGRATION - Part 2
-- Additional security improvements
-- =====================================================

-- 1. Create view for community_subscriptions that hides Stripe IDs (if not exists)
DROP VIEW IF EXISTS public.community_subscriptions_public;
CREATE VIEW public.community_subscriptions_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  community_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
FROM public.community_subscriptions;

-- 2. Create view for profiles that limits exposed data (if not exists)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  level,
  points,
  created_at
FROM public.profiles;

-- 3. Ensure security_audit_logs exists with proper structure
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on security_audit_logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON public.security_audit_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Ensure rate_limits table exists
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, function_name)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limits;
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup 
  ON public.profiles(email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pending_enrollments_email_status 
  ON public.pending_enrollments(email, status);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_active 
  ON public.course_enrollments(user_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_date
  ON public.security_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity
  ON public.security_audit_logs(severity, created_at DESC)
  WHERE severity IN ('warning', 'error', 'critical');

-- 6. Create or replace security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'info'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action, resource_type, resource_id, details, severity
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_details, p_severity
  );
END;
$$;

-- 7. Create trigger to log profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      NEW.id,
      'profile_updated',
      'profile',
      NEW.id::TEXT,
      jsonb_build_object('changed_fields', 
        CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email,' ELSE '' END ||
        CASE WHEN OLD.full_name IS DISTINCT FROM NEW.full_name THEN 'full_name,' ELSE '' END
      ),
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_access();