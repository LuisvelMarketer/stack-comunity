-- Create table for achievement definitions
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  points INTEGER NOT NULL DEFAULT 10,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL DEFAULT 'module_complete',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- Admins and owners can manage achievements
CREATE POLICY "Admins can manage achievements"
ON public.achievements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can manage community course achievements"
ON public.achievements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN community_members cm ON cm.community_id = c.community_id
    WHERE c.id = achievements.course_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);

-- Users can view all unlocked achievements
CREATE POLICY "Anyone can view unlocked achievements"
ON public.user_achievements
FOR SELECT
USING (true);

-- System inserts achievements (via trigger)
CREATE POLICY "Users can unlock achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to check and unlock achievements when module is completed
CREATE OR REPLACE FUNCTION public.check_module_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  course_record RECORD;
  total_modules INTEGER;
  completed_modules INTEGER;
BEGIN
  -- Only process when module is marked as completed
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    
    -- Check for module-specific achievement
    FOR achievement_record IN 
      SELECT * FROM achievements 
      WHERE module_id = NEW.module_id 
      AND achievement_type = 'module_complete'
    LOOP
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, achievement_record.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
      
      -- Add points to user profile
      UPDATE profiles 
      SET points = points + achievement_record.points
      WHERE id = NEW.user_id;
    END LOOP;
    
    -- Check for course completion achievement
    SELECT cm.course_id INTO course_record
    FROM course_modules cm
    WHERE cm.id = NEW.module_id;
    
    IF course_record.course_id IS NOT NULL THEN
      -- Count total and completed modules for this course
      SELECT COUNT(*) INTO total_modules
      FROM course_modules
      WHERE course_id = course_record.course_id;
      
      SELECT COUNT(*) INTO completed_modules
      FROM user_progress up
      JOIN course_modules cm ON cm.id = up.module_id
      WHERE cm.course_id = course_record.course_id
      AND up.user_id = NEW.user_id
      AND up.completed = true;
      
      -- If all modules completed, unlock course completion achievements
      IF completed_modules = total_modules THEN
        FOR achievement_record IN 
          SELECT * FROM achievements 
          WHERE course_id = course_record.course_id 
          AND achievement_type = 'course_complete'
        LOOP
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (NEW.user_id, achievement_record.id)
          ON CONFLICT (user_id, achievement_id) DO NOTHING;
          
          UPDATE profiles 
          SET points = points + achievement_record.points
          WHERE id = NEW.user_id;
        END LOOP;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for checking achievements
CREATE TRIGGER on_module_complete_check_achievement
  AFTER INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.check_module_achievement();