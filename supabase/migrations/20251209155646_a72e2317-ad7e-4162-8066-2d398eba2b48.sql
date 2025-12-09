-- Add typing indicators table
CREATE TABLE public.typing_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add message reactions table for DMs
CREATE TABLE public.dm_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Add read receipts column to direct_messages if not exists
-- (read column already exists, we'll add read_at for timestamp)
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_reactions;

-- Policies for typing_indicators
CREATE POLICY "Users can view typing in their conversations"
  ON public.typing_indicators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = typing_indicators.conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can update their typing status"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = typing_indicators.conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can delete their typing status"
  ON public.typing_indicators FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing"
  ON public.typing_indicators FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for dm_reactions
CREATE POLICY "Users can view reactions in their conversations"
  ON public.dm_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversations c ON c.id = dm.conversation_id
    WHERE dm.id = dm_reactions.message_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can add reactions in their conversations"
  ON public.dm_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM direct_messages dm
    JOIN conversations c ON c.id = dm.conversation_id
    WHERE dm.id = dm_reactions.message_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  ));

CREATE POLICY "Users can remove their own reactions"
  ON public.dm_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-cleanup old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  RETURN NEW;
END;
$$;

-- Trigger to cleanup on insert
CREATE TRIGGER cleanup_old_typing
  AFTER INSERT ON public.typing_indicators
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_typing_indicators();