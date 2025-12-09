
-- Create function to award points for feedback
CREATE OR REPLACE FUNCTION public.award_feedback_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award 5 points for creating feedback
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET points = points + 5
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for feedback creation
CREATE TRIGGER on_feedback_created
  AFTER INSERT ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_feedback_points();

-- Create function to award bonus points when feedback is resolved
CREATE OR REPLACE FUNCTION public.award_resolved_feedback_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award 10 bonus points when feedback is marked as resolved
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    UPDATE profiles 
    SET points = points + 10
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for feedback resolution
CREATE TRIGGER on_feedback_resolved
  AFTER UPDATE ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_resolved_feedback_bonus();
