-- Insert streak achievements (global achievements, not tied to specific course/module)
INSERT INTO achievements (name, description, icon, points, achievement_type, course_id, module_id)
VALUES 
  ('Racha de 7 días', 'Mantuviste una racha de actividad de 7 días consecutivos', 'flame', 50, 'streak', NULL, NULL),
  ('Racha de 30 días', 'Mantuviste una racha de actividad de 30 días consecutivos', 'zap', 150, 'streak', NULL, NULL),
  ('Racha de 100 días', 'Mantuviste una racha de actividad de 100 días consecutivos', 'trophy', 500, 'streak', NULL, NULL);

-- Create function to check and award streak achievements
CREATE OR REPLACE FUNCTION public.check_streak_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_7_id uuid;
  streak_30_id uuid;
  streak_100_id uuid;
BEGIN
  -- Only process when streak is updated
  IF NEW.current_streak IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get achievement IDs
  SELECT id INTO streak_7_id FROM achievements WHERE name = 'Racha de 7 días' LIMIT 1;
  SELECT id INTO streak_30_id FROM achievements WHERE name = 'Racha de 30 días' LIMIT 1;
  SELECT id INTO streak_100_id FROM achievements WHERE name = 'Racha de 100 días' LIMIT 1;

  -- Check for 7 day streak
  IF NEW.current_streak >= 7 AND streak_7_id IS NOT NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, streak_7_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Add points if newly unlocked
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = NEW.user_id AND achievement_id = streak_7_id AND unlocked_at < NOW() - INTERVAL '1 second') THEN
      UPDATE profiles SET points = points + 50 WHERE id = NEW.user_id;
    END IF;
  END IF;

  -- Check for 30 day streak
  IF NEW.current_streak >= 30 AND streak_30_id IS NOT NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, streak_30_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = NEW.user_id AND achievement_id = streak_30_id AND unlocked_at < NOW() - INTERVAL '1 second') THEN
      UPDATE profiles SET points = points + 150 WHERE id = NEW.user_id;
    END IF;
  END IF;

  -- Check for 100 day streak
  IF NEW.current_streak >= 100 AND streak_100_id IS NOT NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.user_id, streak_100_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    IF NOT EXISTS (SELECT 1 FROM user_achievements WHERE user_id = NEW.user_id AND achievement_id = streak_100_id AND unlocked_at < NOW() - INTERVAL '1 second') THEN
      UPDATE profiles SET points = points + 500 WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically check streak achievements
DROP TRIGGER IF EXISTS check_streak_achievements_trigger ON user_streaks;
CREATE TRIGGER check_streak_achievements_trigger
  AFTER INSERT OR UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION check_streak_achievements();