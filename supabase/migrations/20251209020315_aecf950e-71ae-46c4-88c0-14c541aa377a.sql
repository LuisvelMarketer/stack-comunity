-- Function to create notification when someone gives feedback on a project
CREATE OR REPLACE FUNCTION public.create_project_feedback_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_owner_id uuid;
  project_title text;
  commenter_name text;
  feedback_preview text;
BEGIN
  -- Get project owner and title
  SELECT user_id, title INTO project_owner_id, project_title 
  FROM build_projects 
  WHERE id = NEW.project_id;
  
  -- Don't notify if user comments on their own project
  IF project_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  
  -- Get feedback preview
  feedback_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    feedback_preview := feedback_preview || '...';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    project_owner_id,
    'feedback',
    'Nuevo feedback en tu proyecto',
    COALESCE(commenter_name, 'Alguien') || ' comentó en "' || project_title || '": ' || feedback_preview,
    '/project/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$;

-- Function to create notification when someone follows a project
CREATE OR REPLACE FUNCTION public.create_project_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_owner_id uuid;
  project_title text;
  follower_name text;
BEGIN
  -- Get project owner and title
  SELECT user_id, title INTO project_owner_id, project_title 
  FROM build_projects 
  WHERE id = NEW.project_id;
  
  -- Don't notify if user follows their own project
  IF project_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get follower's name
  SELECT full_name INTO follower_name FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    project_owner_id,
    'follow',
    'Nuevo seguidor de tu proyecto',
    COALESCE(follower_name, 'Alguien') || ' comenzó a seguir tu proyecto "' || project_title || '"',
    '/project/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_project_feedback_created ON project_feedback;
CREATE TRIGGER on_project_feedback_created
  AFTER INSERT ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_project_feedback_notification();

DROP TRIGGER IF EXISTS on_project_follow_created ON project_followers;
CREATE TRIGGER on_project_follow_created
  AFTER INSERT ON project_followers
  FOR EACH ROW
  EXECUTE FUNCTION create_project_follow_notification();