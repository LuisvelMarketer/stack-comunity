-- =============================================
-- PHASE 1: FIX PERMISSIVE RLS POLICIES (CRITICAL)
-- Drop all existing policies first, then create secure ones
-- =============================================

-- 1. Fix ai_mentor_suggestions
DROP POLICY IF EXISTS "Users can manage own AI suggestions" ON ai_mentor_suggestions;
DROP POLICY IF EXISTS "Users can view own suggestions" ON ai_mentor_suggestions;
DROP POLICY IF EXISTS "Users can insert own suggestions" ON ai_mentor_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON ai_mentor_suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON ai_mentor_suggestions;

CREATE POLICY "Users can view own suggestions" 
ON ai_mentor_suggestions FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suggestions" 
ON ai_mentor_suggestions FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions" 
ON ai_mentor_suggestions FOR UPDATE TO authenticated 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own suggestions" 
ON ai_mentor_suggestions FOR DELETE TO authenticated 
USING (user_id = auth.uid());

-- 2. Fix certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "Service role manages certificates" ON certificates;
DROP POLICY IF EXISTS "Service role can manage certificates" ON certificates;

CREATE POLICY "Users can view own certificates" 
ON certificates FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage certificates" 
ON certificates FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 3. Fix community_subscriptions
DROP POLICY IF EXISTS "Users can manage subscriptions" ON community_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON community_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON community_subscriptions;
DROP POLICY IF EXISTS "Service role manages all subscriptions" ON community_subscriptions;

CREATE POLICY "Users can view own subscriptions" 
ON community_subscriptions FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" 
ON community_subscriptions FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role manages all subscriptions" 
ON community_subscriptions FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 4. Fix season_project_scores
DROP POLICY IF EXISTS "Anyone can manage project scores" ON season_project_scores;
DROP POLICY IF EXISTS "Authenticated users can view scores" ON season_project_scores;
DROP POLICY IF EXISTS "Service role manages scores" ON season_project_scores;

CREATE POLICY "Authenticated users can view scores" 
ON season_project_scores FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Service role manages scores" 
ON season_project_scores FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 5. Fix season_user_points
DROP POLICY IF EXISTS "Anyone can manage user points" ON season_user_points;
DROP POLICY IF EXISTS "Authenticated users can view points" ON season_user_points;
DROP POLICY IF EXISTS "Users can view own points" ON season_user_points;
DROP POLICY IF EXISTS "Service role manages points" ON season_user_points;

CREATE POLICY "Authenticated users can view all points" 
ON season_user_points FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Service role manages points" 
ON season_user_points FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 6. Fix user_activity_logs
DROP POLICY IF EXISTS "Anyone can manage activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity" ON user_activity_logs;
DROP POLICY IF EXISTS "Service role manages all activity" ON user_activity_logs;

CREATE POLICY "Users can view own activity" 
ON user_activity_logs FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activity" 
ON user_activity_logs FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role manages all activity" 
ON user_activity_logs FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 7. Fix user_level_history
DROP POLICY IF EXISTS "Anyone can insert level history" ON user_level_history;
DROP POLICY IF EXISTS "Users can view own level history" ON user_level_history;
DROP POLICY IF EXISTS "Users can insert own level history" ON user_level_history;
DROP POLICY IF EXISTS "Service role manages level history" ON user_level_history;

CREATE POLICY "Users can view own level history" 
ON user_level_history FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own level history" 
ON user_level_history FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role manages level history" 
ON user_level_history FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- =============================================
-- PHASE 2: RATE LIMITING TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet,
  function_name text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, function_name, ip_address)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for rate limits" ON rate_limits;
CREATE POLICY "Service role only for rate limits" 
ON rate_limits FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON rate_limits(user_id, function_name, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip 
ON rate_limits(ip_address, function_name, window_start);

-- =============================================
-- PHASE 6: SECURITY AUDIT LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for audit logs" ON security_audit_logs;
CREATE POLICY "Service role only for audit logs" 
ON security_audit_logs FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_created ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON security_audit_logs(resource_type, resource_id);

-- Function to clean old rate limit entries
CREATE OR REPLACE FUNCTION clean_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;