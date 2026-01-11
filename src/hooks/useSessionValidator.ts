import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

interface UseSessionValidatorOptions {
  onSessionInvalid?: () => void;
  checkInterval?: number;
  inactivityThreshold?: number;
}

export function useSessionValidator(options: UseSessionValidatorOptions = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    onSessionInvalid,
    checkInterval = SESSION_CHECK_INTERVAL,
    inactivityThreshold = INACTIVITY_THRESHOLD,
  } = options;

  const handleInvalidSession = useCallback(async () => {
    // Clear any stored session data
    await supabase.auth.signOut();
    
    toast({
      title: 'Sesión expirada',
      description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      variant: 'destructive',
    });
    
    if (onSessionInvalid) {
      onSessionInvalid();
    } else {
      navigate('/auth');
    }
  }, [navigate, toast, onSessionInvalid]);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        await handleInvalidSession();
        return false;
      }
      
      if (!session) {
        // No session, might be expected on public pages
        return false;
      }
      
      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresInMs = expiresAt * 1000 - Date.now();
        if (expiresInMs < 5 * 60 * 1000) {
          // Try to refresh the session
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Session refresh error:', refreshError);
            await handleInvalidSession();
            return false;
          }
        }
      }
      
      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      return false;
    }
  }, [handleInvalidSession]);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const checkInactivity = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    return timeSinceActivity < inactivityThreshold;
  }, [inactivityThreshold]);

  useEffect(() => {
    // Set up activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up periodic session check
    checkIntervalRef.current = setInterval(async () => {
      // Only check if user has been active
      if (checkInactivity()) {
        await checkSession();
      }
    }, checkInterval);

    // Check session when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await checkSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check session on focus
    const handleFocus = async () => {
      await checkSession();
    };
    
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSession, checkInactivity, updateActivity, checkInterval]);

  return {
    checkSession,
    updateActivity,
    isActive: checkInactivity,
  };
}
