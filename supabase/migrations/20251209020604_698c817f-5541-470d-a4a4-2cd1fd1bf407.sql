-- Function to create notification when someone likes a project
CREATE OR REPLACE FUNCTION public.create_project_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_owner_id uuid;
  project_title text;
  liker_name text;
BEGIN
  -- Get project owner and title
  SELECT user_id, title INTO project_owner_id, project_title 
  FROM build_projects 
  WHERE id = NEW.project_id;
  
  -- Don't notify if user likes their own project
  IF project_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT full_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    project_owner_id,
    'like',
    'Nuevo like en tu proyecto',
    COALESCE(liker_name, 'Alguien') || ' le dio like a tu proyecto "' || project_title || '"',
    '/project/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_project_like_created ON project_likes;
CREATE TRIGGER on_project_like_created
  AFTER INSERT ON project_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_project_like_notification();