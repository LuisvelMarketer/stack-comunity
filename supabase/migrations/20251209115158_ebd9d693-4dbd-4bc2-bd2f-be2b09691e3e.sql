
-- Create function to call the email edge function via pg_net
CREATE OR REPLACE FUNCTION public.send_feedback_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner_id 
  FROM build_projects 
  WHERE id = NEW.project_id;
  
  -- Don't send email if commenter is the project owner
  IF project_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Call the edge function via pg_net
  PERFORM net.http_post(
    url := 'https://zdrekqhxzhuttafkwtpa.supabase.co/functions/v1/send-feedback-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcmVrcWh4emh1dHRhZmt3dHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDEzMzEsImV4cCI6MjA3OTQ3NzMzMX0.ZUHfgbGJI_FuNHhdzHAI1h06t0VWCnXt09BmxIoo2yo'
    ),
    body := jsonb_build_object(
      'project_id', NEW.project_id,
      'feedback_id', NEW.id,
      'feedback_content', NEW.content,
      'feedback_category', COALESCE(NEW.category, 'general'),
      'feedback_priority', COALESCE(NEW.priority, 'medium'),
      'commenter_id', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for sending feedback email
DROP TRIGGER IF EXISTS on_feedback_email ON public.project_feedback;
CREATE TRIGGER on_feedback_email
  AFTER INSERT ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.send_feedback_email_notification();
