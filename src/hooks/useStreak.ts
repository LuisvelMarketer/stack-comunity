import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useStreak = () => {
  const { user } = useAuth();

  const updateStreak = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if user has a streak record
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingStreak) {
        // Create new streak record
        await supabase.from('user_streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          total_activity_days: 1,
        });
        return;
      }

      const lastActivityDate = existingStreak.last_activity_date;
      
      // If already logged today, do nothing
      if (lastActivityDate === today) {
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      let longestStreak = existingStreak.longest_streak || 0;

      if (lastActivityDate === yesterdayStr) {
        // Consecutive day - increase streak
        newStreak = (existingStreak.current_streak || 0) + 1;
      }

      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          total_activity_days: (existingStreak.total_activity_days || 0) + 1,
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [user]);

  // Update streak on mount
  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user, updateStreak]);

  return { updateStreak };
};
