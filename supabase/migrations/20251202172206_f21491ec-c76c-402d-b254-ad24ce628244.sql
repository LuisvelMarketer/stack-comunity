-- Create trigger function for post likes notifications
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id uuid;
  liker_name text;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT full_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    post_owner_id,
    'like',
    'Nuevo like',
    COALESCE(liker_name, 'Alguien') || ' le dio like a tu publicación',
    '/dashboard'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for likes
DROP TRIGGER IF EXISTS on_post_like_notification ON post_likes;
CREATE TRIGGER on_post_like_notification
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Create trigger function for post comments notifications
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id uuid;
  commenter_name text;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    post_owner_id,
    'comment',
    'Nuevo comentario',
    COALESCE(commenter_name, 'Alguien') || ' comentó en tu publicación',
    '/dashboard'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for comments
DROP TRIGGER IF EXISTS on_post_comment_notification ON post_comments;
CREATE TRIGGER on_post_comment_notification
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;