-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies: community members can manage reactions
CREATE POLICY "Community members can view reactions"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_messages cm
    JOIN community_members cmem ON cmem.community_id = cm.community_id
    WHERE cm.id = message_reactions.message_id
    AND cmem.user_id = auth.uid()
  )
);

CREATE POLICY "Community members can add reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM community_messages cm
    JOIN community_members cmem ON cmem.community_id = cm.community_id
    WHERE cm.id = message_reactions.message_id
    AND cmem.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;