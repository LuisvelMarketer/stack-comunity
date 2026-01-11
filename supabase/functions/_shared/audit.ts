// Security audit logging for Edge Functions

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset_requested'
  | 'permission_denied'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'data_export'
  | 'admin_action'
  | 'api_access'
  | 'file_upload'
  | 'file_download';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

interface AuditEvent {
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  severity?: AuditSeverity;
}

export async function logSecurityEvent(
  supabaseAdmin: SupabaseClient,
  event: AuditEvent
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('security_audit_logs')
      .insert({
        user_id: event.user_id || null,
        action: event.action,
        resource_type: event.resource_type,
        resource_id: event.resource_id || null,
        ip_address: event.ip_address || null,
        user_agent: event.user_agent || null,
        details: event.details || {},
        severity: event.severity || 'info',
      });

    if (error) {
      console.error('Failed to log security event:', error);
    }
  } catch (err) {
    console.error('Security logging error:', err);
  }
}

// Helper to extract info from request
export function extractRequestInfo(req: Request): {
  ip_address: string;
  user_agent: string;
} {
  return {
    ip_address:
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown',
    user_agent: req.headers.get('user-agent') || 'unknown',
  };
}

// Log failed authentication attempt
export async function logFailedAuth(
  supabaseAdmin: SupabaseClient,
  req: Request,
  email?: string
): Promise<void> {
  const { ip_address, user_agent } = extractRequestInfo(req);
  
  await logSecurityEvent(supabaseAdmin, {
    action: 'login_failed',
    resource_type: 'auth',
    ip_address,
    user_agent,
    details: { email: email ? email.substring(0, 3) + '***' : undefined },
    severity: 'warning',
  });
}

// Log rate limit exceeded
export async function logRateLimitExceeded(
  supabaseAdmin: SupabaseClient,
  req: Request,
  userId: string | null,
  functionName: string
): Promise<void> {
  const { ip_address, user_agent } = extractRequestInfo(req);
  
  await logSecurityEvent(supabaseAdmin, {
    user_id: userId || undefined,
    action: 'rate_limit_exceeded',
    resource_type: 'edge_function',
    ip_address,
    user_agent,
    details: { function_name: functionName },
    severity: 'warning',
  });
}

// Log suspicious activity
export async function logSuspiciousActivity(
  supabaseAdmin: SupabaseClient,
  req: Request,
  userId: string | null,
  reason: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { ip_address, user_agent } = extractRequestInfo(req);
  
  await logSecurityEvent(supabaseAdmin, {
    user_id: userId || undefined,
    action: 'suspicious_activity',
    resource_type: 'security',
    ip_address,
    user_agent,
    details: { reason, ...details },
    severity: 'critical',
  });
}
