
-- Create trigger for feedback notifications (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_project_feedback_notification'
  ) THEN
    CREATE TRIGGER on_project_feedback_notification
      AFTER INSERT ON public.project_feedback
      FOR EACH ROW
      EXECUTE FUNCTION public.create_project_feedback_notification();
  END IF;
END $$;
