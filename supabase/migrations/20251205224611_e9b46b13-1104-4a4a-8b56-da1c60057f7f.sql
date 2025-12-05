-- Create community_messages table for chat
CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Policies: only community members can read/write messages
CREATE POLICY "Community members can view messages"
ON public.community_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_messages.community_id
    AND community_members.user_id = auth.uid()
  )
);

CREATE POLICY "Community members can send messages"
ON public.community_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_messages.community_id
    AND community_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own messages"
ON public.community_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for community messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;