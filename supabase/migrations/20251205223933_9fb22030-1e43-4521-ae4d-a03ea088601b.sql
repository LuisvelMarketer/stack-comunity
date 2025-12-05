-- Create function to notify on new direct message
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
  conv_record record;
BEGIN
  -- Get conversation details
  SELECT * INTO conv_record FROM conversations WHERE id = NEW.conversation_id;
  
  -- Determine recipient (the other participant)
  IF conv_record.participant_1 = NEW.sender_id THEN
    recipient_id := conv_record.participant_2;
  ELSE
    recipient_id := conv_record.participant_1;
  END IF;
  
  -- Get sender's name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Create notification for recipient
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    recipient_id,
    'message',
    'Nuevo mensaje',
    COALESCE(sender_name, 'Alguien') || ' te envió un mensaje',
    '/messages/' || NEW.conversation_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.create_message_notification();