-- Create function to extract mentions and create notifications
CREATE OR REPLACE FUNCTION public.create_mention_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mention_match text;
  mentioned_user_id uuid;
  mentioned_username text;
  author_name text;
  content_preview text;
BEGIN
  -- Get author name
  SELECT full_name INTO author_name FROM profiles WHERE id = NEW.user_id;
  
  -- Extract content preview (first 50 chars)
  content_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    content_preview := content_preview || '...';
  END IF;
  
  -- Find all @mentions in content using regex
  FOR mention_match IN
    SELECT DISTINCT (regexp_matches(NEW.content, '@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s]+)', 'g'))[1]
  LOOP
    -- Find user by full_name (case insensitive, trimmed)
    SELECT id, full_name INTO mentioned_user_id, mentioned_username
    FROM profiles
    WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(mention_match))
    LIMIT 1;
    
    -- If user found and it's not the author, create notification
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (
        mentioned_user_id,
        'mention',
        'Te han mencionado',
        COALESCE(author_name, 'Alguien') || ' te mencionó: "' || content_preview || '"',
        '/dashboard'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for mentions in posts
DROP TRIGGER IF EXISTS on_post_mention_notification ON posts;
CREATE TRIGGER on_post_mention_notification
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION create_mention_notifications();

-- Create trigger for mentions in comments
DROP TRIGGER IF EXISTS on_comment_mention_notification ON post_comments;
CREATE TRIGGER on_comment_mention_notification
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_mention_notifications();