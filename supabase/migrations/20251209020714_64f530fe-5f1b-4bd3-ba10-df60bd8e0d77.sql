-- Create table for comments on project updates
CREATE TABLE public.project_update_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  update_id uuid NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_update_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view comments on visible updates"
ON public.project_update_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_updates pu
    JOIN build_projects bp ON bp.id = pu.project_id
    WHERE pu.id = project_update_comments.update_id
    AND (bp.visibility = 'public' OR bp.user_id = auth.uid() OR 
      (bp.visibility = 'community' AND EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = bp.community_id AND user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Authenticated users can create comments"
ON public.project_update_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.project_update_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_project_update_comments_update_id ON project_update_comments(update_id);

-- Function to create notification when someone comments on an update
CREATE OR REPLACE FUNCTION public.create_update_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_owner_id uuid;
  update_title text;
  project_id uuid;
  commenter_name text;
  comment_preview text;
BEGIN
  -- Get update owner and details
  SELECT pu.user_id, pu.title, pu.project_id 
  INTO update_owner_id, update_title, project_id
  FROM project_updates pu
  WHERE pu.id = NEW.update_id;
  
  -- Don't notify if user comments on their own update
  IF update_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  
  -- Get comment preview
  comment_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    comment_preview := comment_preview || '...';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    update_owner_id,
    'comment',
    'Nuevo comentario en tu actualización',
    COALESCE(commenter_name, 'Alguien') || ' comentó en "' || update_title || '": ' || comment_preview,
    '/project/' || project_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_update_comment_created
  AFTER INSERT ON project_update_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_update_comment_notification();