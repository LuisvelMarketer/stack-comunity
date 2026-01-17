import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CourseEnrollment {
  course_type: string | null;
  tier: string | null;
  is_active: boolean | null;
  course_id: string;
  community_id: string;
}

export const useCourseEnrollment = () => {
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!user) {
        setEnrollment(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('course_enrollments')
          .select('course_type, tier, is_active, course_id, community_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) {
          console.error('[useCourseEnrollment] Error:', fetchError);
          setError(fetchError.message);
        } else {
          setEnrollment(data);
        }
      } catch (err) {
        console.error('[useCourseEnrollment] Unexpected error:', err);
        setError('Error al cargar la inscripción');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollment();
  }, [user]);

  const isCourseType = (type: string): boolean => {
    return enrollment?.course_type === type && enrollment?.is_active === true;
  };

  const hasCeroAccess = isCourseType('cero');
  const hasQuantumAccess = isCourseType('quantum');

  return {
    enrollment,
    loading,
    error,
    isCourseType,
    hasCeroAccess,
    hasQuantumAccess,
    isEnrolled: !!enrollment && enrollment.is_active === true,
  };
};
