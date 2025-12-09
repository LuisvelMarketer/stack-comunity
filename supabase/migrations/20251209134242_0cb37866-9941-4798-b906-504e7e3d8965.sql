-- Create function to send notification when someone replies to feedback
CREATE OR REPLACE FUNCTION public.create_feedback_reply_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_feedback_owner_id uuid;
  replier_name text;
  project_title text;
  project_id_val uuid;
  reply_preview text;
BEGIN
  -- Only process replies (where parent_id is not null)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get parent feedback owner
  SELECT user_id, project_id INTO parent_feedback_owner_id, project_id_val
  FROM project_feedback 
  WHERE id = NEW.parent_id;
  
  -- Don't notify if user replies to their own feedback
  IF parent_feedback_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get replier's name
  SELECT full_name INTO replier_name FROM profiles WHERE id = NEW.user_id;
  
  -- Get project title
  SELECT title INTO project_title FROM build_projects WHERE id = project_id_val;
  
  -- Get reply preview (first 50 chars)
  reply_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    reply_preview := reply_preview || '...';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    parent_feedback_owner_id,
    'reply',
    'Nueva respuesta a tu feedback',
    COALESCE(replier_name, 'Alguien') || ' respondió a tu feedback en "' || COALESCE(project_title, 'un proyecto') || '": ' || reply_preview,
    '/project/' || project_id_val
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for feedback replies
DROP TRIGGER IF EXISTS on_feedback_reply_created ON project_feedback;
CREATE TRIGGER on_feedback_reply_created
  AFTER INSERT ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feedback_reply_notification();